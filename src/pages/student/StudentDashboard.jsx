import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { 
  CheckCircle, Clock, Loader2, AlertTriangle, User, Award, Users, Target, BookOpen
} from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

const StudentDashboard = () => {
  const { 
    student, team, project, guide, classroomFaculty, currentReviewer, 
    dashboardStats, getStudentEvaluations, dataLoading 
  } = useStudentAnalytics();

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Student Evaluation Dashboard">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Student Evaluation Dashboard">
        <div className="flex h-64 flex-col items-center justify-center text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className="text-red-600 font-medium">No student profile found for this account.</p>
        </div>
      </DashboardLayout>
    );
  }

  const evaluations = getStudentEvaluations();

  return (
    <DashboardLayout navigationItems={studentNavigation} title="Student Evaluation Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Workspace Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border border-slate-700">
          <div className="flex items-center gap-5">
            <div className="bg-white/10 p-4 rounded-full border border-white/20">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Welcome back, {student.name || 'Student'}</h1>
              <div className="text-slate-300 text-sm flex flex-wrap items-center gap-4">
                <span><strong className="text-slate-400 font-medium mr-1">Roll No:</strong> {student.rollNo || 'N/A'}</span>
                <span><strong className="text-slate-400 font-medium mr-1">Team ID:</strong> {team?.id || 'Unassigned'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end w-full md:w-auto bg-white/5 p-4 rounded-lg border border-white/10">
             <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Active Review Cycle</span>
             <span className="text-white font-bold text-lg flex items-center gap-2">
               <Clock className="w-5 h-5 text-amber-400" /> {dashboardStats?.currentReviewCycle || 'None'}
             </span>
          </div>
        </div>

        {/* KPI Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-primary-50 border-primary-100 p-4">
              <p className="text-xs text-primary-600 font-medium uppercase">Overall Progress</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.progressPercent}%</h3>
            </Card>
            <Card className="bg-indigo-50 border-indigo-100 p-4">
              <p className="text-xs text-indigo-600 font-medium uppercase">Average Marks</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.averageMarks}</h3>
            </Card>
            <Card className="bg-emerald-50 border-emerald-100 p-4">
              <p className="text-xs text-emerald-600 font-medium uppercase">Attendance</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.attendancePercent}%</h3>
            </Card>
            <Card className="bg-amber-50 border-amber-100 p-4">
              <p className="text-xs text-amber-600 font-medium uppercase">Current Grade</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.currentGrade}</h3>
            </Card>
            <Card className="bg-blue-50 border-blue-100 p-4">
              <p className="text-xs text-blue-600 font-medium uppercase">Completed Reviews</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.completedReviews}</h3>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            
            {/* Project Details Snapshot */}
            <Card title="Project Snapshot" className="shadow-sm border-gray-200">
              <div className="mt-4">
                {project ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Title</p>
                      <h3 className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary-500" /> {project.title}
                      </h3>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Description</p>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">{project.description}</p>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Target} title="No Project Found" description="You have not created or been assigned a project yet." />
                )}
              </div>
            </Card>

            {/* Recent Evaluations */}
            <Card title="Recent Evaluations" className="shadow-sm border-gray-200">
              {evaluations && evaluations.length > 0 ? (
                <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Cycle</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {evaluations.slice(0, 3).map((ev, i) => (
                        <tr key={ev.id || i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary-500" /> {ev.cycleName}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {new Date(ev.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800">
                                {ev.totalScore || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="success">{ev.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 py-6 border border-dashed border-gray-300 rounded-lg">
                  <EmptyState 
                    icon={CheckCircle}
                    title="No Evaluations Yet"
                    description="Your evaluations will appear here once submitted."
                  />
                </div>
              )}
            </Card>

          </div>

          <div className="space-y-6">
            
            <Card title="Academic Mentorship" className="shadow-sm border-gray-200">
              <div className="space-y-4 mt-4">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <div className="bg-blue-100 p-2.5 rounded-lg flex-shrink-0 shadow-sm border border-blue-200">
                    <User className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 uppercase tracking-wide font-bold">Assigned Guide</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{guide?.name || 'Pending Assignment'}</p>
                    <p className="text-xs text-gray-500 mt-1">{guide?.department || ''}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                  <div className="bg-emerald-100 p-2.5 rounded-lg flex-shrink-0 shadow-sm border border-emerald-200">
                    <Users className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 uppercase tracking-wide font-bold">Classroom Faculty</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{classroomFaculty?.name || 'Pending Assignment'}</p>
                    <p className="text-xs text-gray-500 mt-1">{classroomFaculty?.department || ''}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 transition-colors">
                  <div className="bg-purple-100 p-2.5 rounded-lg flex-shrink-0 shadow-sm border border-purple-200">
                    <Award className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 uppercase tracking-wide font-bold">Current Reviewer</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{currentReviewer?.name || 'Pending Assignment'}</p>
                    <p className="text-xs text-gray-500 mt-1">{currentReviewer?.department || 'Evaluation Committee'}</p>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
