import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/firebase/services/studentService';
import { Loader2, Activity, CheckCircle, Clock, Calendar } from 'lucide-react';

const ProgressStatus = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProgress(currentUser.uid);
    }
  }, [currentUser]);

  const fetchProgress = async (uid) => {
    try {
      setLoading(true);
      const student = await studentService.getById(uid);
      setStudentData(student);
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="KL CSE Capstone Portal - Progress Tracking">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const currentStage = studentData?.reviewStage || 'Review 1';
  
  const allMilestones = [
    { id: 1, title: 'Project Registration & Team Formation', desc: 'Officially mapping your project to the Capstone Database.', date: 'Aug 15', isPast: true },
    { id: 2, title: 'Guide Allocation', desc: 'Faculty mentor assigned.', date: 'Sep 01', isPast: true },
    { id: 3, title: 'Project Proposal Submission', desc: 'Submission of abstract and core objectives.', date: 'Oct 15', isPast: currentStage !== 'Review 1' },
    { id: 4, title: 'Review 1: Architecture & Design', desc: 'Formal presentation to internal committee.', date: 'Nov 12', isPast: ['Review 2', 'Review 3', 'Completed'].includes(currentStage) },
    { id: 5, title: 'Review 2: Prototype Implementation', desc: 'Demonstration of core logic and partial UI.', date: 'Jan 20', isPast: ['Review 3', 'Completed'].includes(currentStage) },
    { id: 6, title: 'Review 3: Final Deployment', desc: 'Final product presentation and QA.', date: 'Mar 10', isPast: currentStage === 'Completed' },
    { id: 7, title: 'Final Report Submission', desc: 'Hardcopy and softcopy of the thesis document.', date: 'Apr 05', isPast: currentStage === 'Completed' }
  ];

  const completedCount = allMilestones.filter(m => m.isPast).length;
  const progressPercentage = Math.round((completedCount / allMilestones.length) * 100);

  return (
    <DashboardLayout navigationItems={studentNavigation} title="KL CSE Capstone Portal - Progress Tracking">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary-600" /> Progress Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track your project milestones, completed tasks, and upcoming deadlines.</p>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Overall Completion</h3>
              <p className="text-sm text-gray-500 mt-1">Based on formal review stages and administrative sign-offs.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-black text-primary-600">{progressPercentage}%</p>
                <p className="text-xs font-semibold text-gray-500 uppercase">Completed</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
                <svg className="w-full h-full absolute inset-0 transform -rotate-90">
                  <circle cx="28" cy="28" r="28" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100" />
                  <circle 
                    cx="28" cy="28" r="28" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    strokeDasharray="175" 
                    strokeDashoffset={175 - (175 * progressPercentage) / 100}
                    className="text-primary-500 transition-all duration-1000 ease-in-out" 
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {allMilestones.map((milestone, idx) => (
              <div key={milestone.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 ring-4 ring-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${
                  milestone.isPast 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : (!milestone.isPast && (idx === 0 || allMilestones[idx - 1].isPast) 
                        ? 'bg-primary-500 border-primary-500 text-white animate-pulse' 
                        : 'bg-white border-gray-300 text-gray-400')
                }`}>
                  {milestone.isPast ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                </div>

                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={milestone.isPast ? 'success' : (!milestone.isPast && (idx === 0 || allMilestones[idx - 1].isPast) ? 'primary' : 'default')}>
                      {milestone.isPast ? 'Completed' : (!milestone.isPast && (idx === 0 || allMilestones[idx - 1].isPast) ? 'Current' : 'Pending')}
                    </Badge>
                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {milestone.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mt-2">{milestone.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{milestone.desc}</p>
                </div>

              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProgressStatus;
