import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useGuideAnalytics } from '@/hooks/useGuideAnalytics';
import { 
  Users, Calendar, Clock, AlertTriangle, FileText, ArrowRight, Loader2, CheckCircle, Activity, Target
} from 'lucide-react';

const GuideDashboard = () => {
  const navigate = useNavigate();
  const { 
    guide,
    dashboardStats, 
    getPendingEvaluations,
    getGuideTimeline,
    getGuideMeetings,
    dataLoading 
  } = useGuideAnalytics();

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="Guide Evaluation Dashboard">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!guide) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="Guide Evaluation Dashboard">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
          <EmptyState 
            icon={AlertTriangle}
            title="Profile Not Found"
            description="No active guide profile associated with this account."
          />
        </div>
      </DashboardLayout>
    );
  }

  const pendingEvaluations = getPendingEvaluations();
  const meetings = getGuideMeetings().slice(0, 4);
  const timeline = getGuideTimeline().slice(0, 5);

  return (
    <DashboardLayout navigationItems={guideNavigation} title="Guide Evaluation Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Workspace Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border border-slate-700">
          <div className="flex items-center gap-5">
            <div className="bg-white/10 p-4 rounded-full border border-white/20">
              <Users className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Welcome, Guide {guide.name}</h1>
              <p className="text-slate-300 text-sm">Supervise your teams, manage meetings, and submit formal evaluations.</p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end w-full md:w-auto bg-white/5 p-4 rounded-lg border border-white/10">
             <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Active Review Cycle</span>
             <span className="text-white font-bold text-lg flex items-center gap-2">
               <Clock className="w-5 h-5 text-amber-400" /> {dashboardStats?.activeCycle || 'None'}
             </span>
          </div>
        </div>

        {/* KPI Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary-50 border-primary-100 p-4">
              <p className="text-xs text-primary-600 font-medium uppercase">Teams Supervised</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.totalTeams}</h3>
            </Card>
            <Card className="bg-emerald-50 border-emerald-100 p-4">
              <p className="text-xs text-emerald-600 font-medium uppercase">Students Supervised</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.totalStudents}</h3>
            </Card>
            <Card className="bg-amber-50 border-amber-100 p-4">
              <p className="text-xs text-amber-600 font-medium uppercase">Pending Evaluations</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.pendingEvaluations}</h3>
            </Card>
            <Card className="bg-purple-50 border-purple-100 p-4">
              <p className="text-xs text-purple-600 font-medium uppercase">Meetings This Week</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.meetingsThisWeek}</h3>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div className="xl:col-span-2 space-y-6">
            
            {/* Action Required: Pending Evaluations */}
            <Card title="Action Required: Pending Evaluations" className="shadow-sm border-orange-200 bg-orange-50/30">
              <div className="space-y-4 mt-2">
                {pendingEvaluations.length > 0 ? pendingEvaluations.map((pending, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-orange-200 bg-white shadow-sm hover:shadow transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-gray-900">Evaluate {pending.teamId}</h4>
                          <Badge variant="warning">{pending.cycleName}</Badge>
                        </div>
                        <p className="text-xs text-gray-600">{pending.projectTitle}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => navigate('/guide/marks')} className="flex items-center">
                      Evaluate <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )) : (
                  <div className="py-8 bg-white rounded-lg border border-gray-100">
                    <EmptyState 
                      icon={CheckCircle}
                      title="All Caught Up!"
                      description="You have completed all evaluations for the active review cycle."
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Team Timeline */}
            <Card title="Recent Activity Timeline" className="shadow-sm">
              <div className="space-y-6 mt-4">
                {timeline.length > 0 ? (
                  <div className="relative border-l-2 border-gray-200 ml-4 py-2 space-y-6">
                    {timeline.map((event, index) => (
                      <div key={index} className="relative pl-6 group">
                        <span className="absolute -left-[11px] top-1 bg-white h-5 w-5 rounded-full ring-4 ring-white border-2 border-primary-500 flex items-center justify-center">
                          {event.type === 'meeting' ? <Clock className="w-3 h-3 text-primary-500" /> : 
                           event.type === 'evaluation' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : 
                           <Target className="w-3 h-3 text-blue-500" />}
                        </span>
                        
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(event.date).toLocaleString()}
                          </p>
                          <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-100 text-sm text-gray-700">
                            {event.details}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6">
                    <EmptyState 
                      icon={Activity}
                      title="No Activity"
                      description="No recent activity logged for your supervised teams."
                    />
                  </div>
                )}
              </div>
            </Card>

          </div>

          <div className="space-y-6">
            
            {/* Upcoming Meetings */}
            <Card title="Upcoming Meetings" className="shadow-sm">
              <div className="space-y-4 mt-2">
                {meetings.length > 0 ? meetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                    <div className="bg-primary-50 text-primary-600 p-2 rounded-lg flex flex-col items-center min-w-[3.5rem] border border-primary-100">
                      <span className="text-xs font-semibold uppercase">{new Date(meeting.meetingDate).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-black leading-none">{new Date(meeting.meetingDate).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{meeting.teamId}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1" title={meeting.agenda}>{meeting.agenda}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-6">
                    <EmptyState 
                      icon={Calendar}
                      title="No Meetings"
                      description="No meetings scheduled."
                    />
                  </div>
                )}
                <Button variant="outline" onClick={() => navigate('/guide/meetings')} className="w-full mt-2">
                  Manage Meetings
                </Button>
              </div>
            </Card>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default GuideDashboard;
