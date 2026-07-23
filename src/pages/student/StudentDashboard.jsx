import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileBarChart, CheckCircle, Clock, AlertTriangle, Loader2, 
  Calendar, User, Award, Bell, CheckSquare, Target
} from 'lucide-react';
import { studentService } from '@/firebase/services/studentService';
import { projectService } from '@/firebase/services/projectService';
import { guideService } from '@/firebase/services/guideService';
import { reviewerService } from '@/firebase/services/reviewerService';
import { reviewService } from '@/firebase/services/reviewService';
import { notificationService } from '@/firebase/services/notificationService';
import { FirestoreService } from '@/firebase/services/firestore';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [guideData, setGuideData] = useState(null);
  const [reviewerData, setReviewerData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const uid = currentUser.uid;
    const unsubs = [];
    
    setLoading(true);
    setError(null);

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) setLoading(false);
    };

    unsubs.push(FirestoreService.subscribeQuery('students', [{ field: 'uid', operator: '==', value: uid }], (data) => {
      if (data.length > 0) {
        const student = data[0];
        setStudentData(student);
        
        if (student.guideId) {
          guideService.getById(student.guideId).then(g => setGuideData(g));
        }
        if (student.reviewerId) {
          reviewerService.getById(student.reviewerId).then(r => setReviewerData(r));
        }
      }
      checkLoaded();
    }));

    unsubs.push(FirestoreService.subscribeQuery('projects', [{ field: 'members', operator: 'array-contains', value: uid }], (data) => {
      setProjectData(data[0] || null);
      checkLoaded();
    }));

    // Subscribe to reviews by looking at team Id? Wait, review collection has studentId. We can fallback to studentId or teamId
    unsubs.push(FirestoreService.subscribeQuery('reviews', [{ field: 'studentId', operator: '==', value: uid }], (data) => {
      setReviews(data);
      checkLoaded();
    }));

    unsubs.push(FirestoreService.subscribeQuery('notifications', [{ field: 'targetRole', operator: 'in', value: ['all', 'student', uid] }], (data) => {
      // Filter for this user's notifications + global + role
      setNotifications(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }));

    return () => unsubs.forEach(unsub => unsub && unsub());
  }, [currentUser]);

  if (loading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="KL CSE Capstone Portal - Academic Progress">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="KL CSE Capstone Portal - Academic Progress">
        <div className="flex h-64 flex-col items-center justify-center text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Hardcode phases relative to current reviewStage to simulate timeline
  const currentStage = studentData?.reviewStage || 'Review 1';
  const milestones = [
    { id: 1, title: 'Project Proposal', status: currentStage !== 'Review 1' ? 'completed' : 'current', date: 'Oct 15' },
    { id: 2, title: 'Architecture & Design (Review 1)', status: currentStage === 'Review 2' || currentStage === 'Review 3' || currentStage === 'Completed' ? 'completed' : (currentStage === 'Review 1' ? 'upcoming' : 'upcoming'), date: 'Nov 12' },
    { id: 3, title: 'Prototype Implementation (Review 2)', status: currentStage === 'Review 3' || currentStage === 'Completed' ? 'completed' : (currentStage === 'Review 2' ? 'current' : 'upcoming'), date: 'Jan 20' },
    { id: 4, title: 'Final Deployment (Review 3)', status: currentStage === 'Completed' ? 'completed' : (currentStage === 'Review 3' ? 'current' : 'upcoming'), date: 'Mar 10' }
  ];

  return (
    <DashboardLayout navigationItems={studentNavigation} title="KL CSE Capstone Portal - Academic Progress">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Workspace Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border border-slate-700">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Student Workspace</h1>
            <p className="text-slate-300 text-lg flex items-center gap-2">
              <User className="h-5 w-5" /> 
              {studentData?.name || currentUser?.email} <span className="text-slate-500">|</span> Roll: {studentData?.rollNumber || 'N/A'}
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end w-full md:w-auto">
            <span className="text-sm text-slate-400 mb-1 uppercase tracking-wider font-semibold">Project Stage</span>
            <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
               <span className="text-white font-bold">{currentStage}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div className="xl:col-span-2 space-y-6">
            
            {/* Project Details Snapshot */}
            <Card title="My Project Snapshot" className="shadow-sm border-gray-200">
              <div className="mt-4">
                {projectData ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Title</p>
                      <h3 className="text-xl font-bold text-gray-900 mt-1">{projectData.title}</h3>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Description</p>
                      <p className="text-sm text-gray-700 mt-1">{projectData.description}</p>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Target} title="No Project Found" description="You have not created or been assigned a project yet." />
                )}
              </div>
            </Card>

            {/* Project Timeline/Deadlines */}
            <Card title="Project Milestones" className="shadow-sm border-gray-200">
              <div className="relative border-l-2 border-primary-200 ml-4 mt-4 space-y-8 pb-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="relative pl-6 group">
                    {milestone.status === 'completed' && (
                      <span className="absolute -left-[11px] top-1 bg-emerald-500 h-5 w-5 rounded-full ring-4 ring-white flex items-center justify-center transition-transform group-hover:scale-110">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </span>
                    )}
                    {milestone.status === 'current' && (
                      <span className="absolute -left-[11px] top-1 bg-primary-600 h-5 w-5 rounded-full ring-4 ring-white flex items-center justify-center animate-pulse">
                        <Clock className="h-3 w-3 text-white" />
                      </span>
                    )}
                    {milestone.status === 'upcoming' && (
                      <span className="absolute -left-[11px] top-1 bg-gray-200 h-5 w-5 rounded-full ring-4 ring-white border border-gray-300"></span>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <div>
                        <h4 className={`text-sm font-semibold ${milestone.status === 'upcoming' ? 'text-gray-500' : 'text-gray-900'}`}>
                          {milestone.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due: {milestone.date}
                        </p>
                      </div>
                      {milestone.status === 'current' && (
                        <Badge variant="warning" className="mt-2 sm:mt-0 font-medium">In Progress</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Reviews */}
            <Card title="Review Transcripts" className="shadow-sm border-gray-200">
              {reviews && reviews.length > 0 ? (
                <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reviews.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-bold text-gray-900">{r.reviewType}</td>
                          <td className="px-4 py-4">
                            <Badge variant={r.status === 'Final' ? 'success' : 'default'}>{r.status}</Badge>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {r.status === 'Final' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800">
                                {r.totalScore} / 100
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={r.remarks}>
                            {r.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 py-6 border border-dashed border-gray-300 rounded-lg">
                  <EmptyState 
                    icon={CheckSquare}
                    title="No Evaluations Yet"
                    description="Your formal review scores will appear here after evaluation."
                  />
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            
            <Card title="Mentorship & Evaluation" className="shadow-sm border-gray-200">
              <div className="space-y-4 mt-4">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <div className="bg-blue-100 p-2.5 rounded-lg flex-shrink-0 shadow-sm border border-blue-200">
                    <User className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 uppercase tracking-wide font-bold">Assigned Guide</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{guideData?.name || 'Pending Assignment'}</p>
                    <p className="text-xs text-gray-500 mt-1">{guideData?.department || ''}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 transition-colors">
                  <div className="bg-purple-100 p-2.5 rounded-lg flex-shrink-0 shadow-sm border border-purple-200">
                    <Award className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 uppercase tracking-wide font-bold">External Reviewer</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{reviewerData?.name || 'Pending Assignment'}</p>
                    <p className="text-xs text-gray-500 mt-1">{reviewerData?.department || 'Evaluation Committee'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Recent Notifications" className="shadow-sm border-gray-200">
              <div className="space-y-3 mt-4">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 4).map(note => (
                    <div key={note.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                      <Bell className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{note.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{note.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent notifications.</p>
                )}
              </div>
            </Card>
            
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
