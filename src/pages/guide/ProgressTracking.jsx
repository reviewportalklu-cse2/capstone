import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/firebase/services/projectService';
import { studentService } from '@/firebase/services/studentService';
import { Users, CheckCircle, Clock, FileText, Loader2, Target, AlertCircle } from 'lucide-react';

const MILESTONES = [
  'Synopsis',
  'Literature Review',
  'Architecture',
  'Implementation',
  'Testing',
  'Documentation',
  'Final Presentation'
];

const ProgressTracking = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData(currentUser.uid);
    }
  }, [currentUser]);

  const fetchData = async (uid) => {
    try {
      setLoading(true);
      setError(null);
      const [projectsData, studentsData] = await Promise.all([
        projectService.getProjectsByGuide(uid),
        studentService.getByGuideId(uid)
      ]);
      setProjects(projectsData);
      setStudentsCount(studentsData.length);
    } catch (err) {
      console.error("Failed to fetch project stats:", err);
      setError("Failed to load progress data.");
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneIndex = (milestoneName) => {
    if (!milestoneName) return 0;
    const idx = MILESTONES.indexOf(milestoneName);
    return idx === -1 ? 0 : idx + 1; // +1 because being on it means previous are done
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Progress Tracking">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const ongoingCount = projects.length - completedCount;

  return (
    <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Progress Tracking">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-primary-600" /> Progress Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1">Detailed overview of student project progression across required milestones.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Projects"
            value={projects.length.toString()}
            icon={FileText}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
          />
          <StatCard 
            title="Ongoing Projects"
            value={ongoingCount.toString()}
            icon={Clock}
            colorClass="text-warning-600"
            bgClass="bg-warning-50"
          />
          <StatCard 
            title="Completed Projects"
            value={completedCount.toString()}
            icon={CheckCircle}
            colorClass="text-success"
            bgClass="bg-success/10"
          />
          <StatCard 
            title="Students Guided"
            value={studentsCount.toString()} 
            icon={Users}
            colorClass="text-purple-600"
            bgClass="bg-purple-50"
          />
        </div>

        <div className="space-y-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900 px-1">Detailed Project Milestones</h2>
          
          {projects.length === 0 ? (
            <Card>
              <div className="py-12">
                <EmptyState icon={Target} title="No Projects Found" description="You have no assigned projects to track." />
              </div>
            </Card>
          ) : (
            projects.map(project => {
              const currentIdx = getMilestoneIndex(project.currentMilestone);
              const percentage = Math.round((currentIdx / MILESTONES.length) * 100);
              
              return (
                <Card key={project.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{project.title || 'Untitled Project'}</h3>
                      <p className="text-sm text-gray-500 mt-1">Current Phase: <span className="font-semibold text-gray-700">{project.currentMilestone || 'Not Started'}</span></p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary-600">{percentage}%</span>
                        <p className="text-xs text-gray-500">Overall Completion</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-4 pb-2">
                    {/* Progress Bar Background Line */}
                    <div className="absolute top-8 left-0 w-full h-1 bg-gray-200 rounded"></div>
                    <div 
                      className="absolute top-8 left-0 h-1 bg-primary-500 rounded transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>

                    <div className="flex justify-between relative z-10">
                      {MILESTONES.map((milestone, idx) => {
                        const isCompleted = idx < currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <div key={milestone} className="flex flex-col items-center group w-1/7 cursor-default">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                              isCompleted ? 'bg-primary-500 border-primary-500 text-white' : 
                              isCurrent ? 'bg-white border-primary-500 text-primary-600 ring-4 ring-primary-50' : 
                              'bg-white border-gray-300 text-gray-300'
                            }`}>
                              {isCompleted ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                            </div>
                            <div className="mt-3 text-center">
                              <p className={`text-[10px] font-semibold tracking-wide uppercase ${
                                isCompleted ? 'text-primary-700' : 
                                isCurrent ? 'text-gray-900' : 'text-gray-400'
                              }`}>{milestone}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-600">
                     <div>
                       <span className="font-semibold text-gray-900">{currentIdx}</span> / {MILESTONES.length} Tasks Completed
                     </div>
                     <div>
                       <span className="font-semibold text-gray-900">{MILESTONES.length - currentIdx}</span> Tasks Pending
                     </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ProgressTracking;
