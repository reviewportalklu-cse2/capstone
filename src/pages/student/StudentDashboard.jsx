import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { 
  CheckCircle, Clock, Loader2, AlertTriangle, User, Award, Users, Target, BookOpen, Calendar, ShieldCheck, UserCheck
} from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

const StudentDashboard = () => {
  const { 
    student, team, teamMembers, project, guide, classroomFaculty, reviewSchedule,
    dashboardStats, getStudentEvaluations, dataLoading 
  } = useStudentAnalytics();

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Student Portal Dashboard">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Student Portal Dashboard">
        <div className="flex h-64 flex-col items-center justify-center text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className="text-red-600 font-medium">No student profile found for this account.</p>
        </div>
      </DashboardLayout>
    );
  }

  const evaluations = getStudentEvaluations();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return <Badge variant="success">Completed</Badge>;
      case 'In Progress': return <Badge variant="warning">In Progress</Badge>;
      case 'Upcoming': return <Badge variant="primary">Upcoming</Badge>;
      default: return <Badge variant="secondary">Not Scheduled</Badge>;
    }
  };

  return (
    <DashboardLayout navigationItems={studentNavigation} title="Student Portal Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        
        {/* Workspace Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border border-slate-700">
          <div className="flex items-center gap-5">
            <div className="bg-white/10 p-4 rounded-full border border-white/20">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Welcome back, {student.name || 'Student'}</h1>
              <div className="text-slate-300 text-sm flex flex-wrap items-center gap-4">
                <span><strong className="text-slate-400 font-medium mr-1">Roll No:</strong> {student.rollNo || student.rollNumber || 'N/A'}</span>
                <span><strong className="text-slate-400 font-medium mr-1">Department:</strong> {student.department || 'CSE'}</span>
                <span><strong className="text-slate-400 font-medium mr-1">Team ID:</strong> {team?.id || 'Unassigned'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end w-full md:w-auto bg-white/5 p-4 rounded-lg border border-white/10">
             <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Active Review Cycle</span>
             <span className="text-white font-bold text-lg flex items-center gap-2">
               <Clock className="w-5 h-5 text-amber-400" /> {dashboardStats?.currentReviewCycle || 'Review 1'}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            
            {/* My Team & Team Members */}
            <Card title={`MY TEAM — ${team?.id || 'Unassigned'}`} icon={Users} className="shadow-sm border-gray-200">
              <div className="mt-4 space-y-4">
                <div className="bg-primary-50/50 p-4 rounded-lg border border-primary-100">
                  <p className="text-xs text-primary-600 uppercase tracking-wide font-bold">Project Title</p>
                  <h3 className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary-600" /> {project?.title || 'Capstone Project Title'}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2">{project?.description || 'Project details and scope'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Team Roster ({teamMembers.length} Members)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((m, idx) => (
                        <div key={m.id || idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{m.name}</p>
                              <p className="text-xs text-gray-500">ID: {m.rollNo || m.id}</p>
                            </div>
                          </div>
                          {String(m.id).toLowerCase() === String(student.id).toLowerCase() && (
                            <Badge variant="primary" className="text-[10px]">You</Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No other team members found.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Review Schedule & Status */}
            <Card title="REVIEW SCHEDULE & STATUS" icon={Calendar} className="shadow-sm border-gray-200">
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviewSchedule.map((rc) => (
                  <div key={rc.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 text-base">{rc.reviewName}</h4>
                      {getStatusBadge(rc.status)}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1 bg-white p-2.5 rounded-lg border border-gray-100 font-mono">
                      <p><span className="font-semibold text-gray-700">Date:</span> {rc.startDate}</p>
                      <p><span className="font-semibold text-gray-700">Time:</span> {rc.startTime} – {rc.endTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* My Evaluations (Read Only) */}
            <Card title="MY EVALUATION RESULTS" icon={ShieldCheck} className="shadow-sm border-gray-200">
              {evaluations && evaluations.length > 0 ? (
                <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Cycle</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluated Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Avg Score</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {evaluations.map((ev, i) => (
                        <tr key={ev.id || i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary-500" /> {ev.cycleName}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {ev.date ? new Date(ev.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800">
                              {ev.teamAverage || ev.totalScore || 0}
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
                    title="No Evaluations Recorded Yet"
                    description="Your evaluations will appear here once finalized by your Guide and Faculty."
                  />
                </div>
              )}
            </Card>

          </div>

          <div className="space-y-6">
            
            {/* Academic Mentorship (Guide & Faculty ONLY - ZERO Reviewer info exposed) */}
            <Card title="ACADEMIC MENTORSHIP" icon={UserCheck} className="shadow-sm border-gray-200">
              <div className="space-y-4 mt-4">
                {/* MY GUIDE */}
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 uppercase tracking-wide font-bold">MY GUIDE</p>
                      <h4 className="text-base font-bold text-gray-900">{guide?.name || 'Guide Not Assigned'}</h4>
                    </div>
                  </div>
                  {guide ? (
                    <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-blue-100/60 font-mono">
                      <p><span className="font-semibold text-gray-700">Guide ID:</span> {guide.id || guide.guideId || 'G001'}</p>
                      <p><span className="font-semibold text-gray-700">Emp ID:</span> {guide.employeeId || 'emp001'}</p>
                      <p><span className="font-semibold text-gray-700">Email:</span> {guide.email || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic pt-1">Guide pending assignment by Admin.</p>
                  )}
                </div>

                {/* MY FACULTY */}
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600 uppercase tracking-wide font-bold">MY FACULTY</p>
                      <h4 className="text-base font-bold text-gray-900">{classroomFaculty?.name || 'Faculty Not Assigned'}</h4>
                    </div>
                  </div>
                  {classroomFaculty ? (
                    <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-emerald-100/60 font-mono">
                      <p><span className="font-semibold text-gray-700">Faculty ID:</span> {classroomFaculty.id || classroomFaculty.facultyId || 'F001'}</p>
                      <p><span className="font-semibold text-gray-700">Emp ID:</span> {classroomFaculty.employeeId || 'fac401'}</p>
                      <p><span className="font-semibold text-gray-700">Email:</span> {classroomFaculty.email || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic pt-1">Faculty pending assignment by Admin.</p>
                  )}
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
