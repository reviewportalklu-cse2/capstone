import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useReviewerAnalytics } from '@/hooks/useReviewerAnalytics';
import { Users, ShieldCheck, CheckCircle2, Clock, Loader2, AlertCircle, AlertTriangle, PlayCircle } from 'lucide-react';

const ReviewerDashboard = () => {
  const { domainUser } = useAuth();
  const navigate = useNavigate();
  
  const { 
    dashboardStats = {},
    getAssignedTeams = () => [],
    getReviewerTimeline = () => [],
    dataLoading
  } = useReviewerAnalytics();

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="Reviewer Workspace">
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!domainUser || !dashboardStats) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="Reviewer Workspace">
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            No reviewer profile or data found.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const timeline = getReviewerTimeline().slice(0, 5);
  const activeTeams = getAssignedTeams();
  const pendingTeams = activeTeams.filter(t => t.evaluationStatus === 'Pending' || t.evaluationStatus === 'Draft').slice(0, 5);

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="Reviewer Workspace">
      <div className="space-y-8 max-w-7xl mx-auto pb-10 px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 shadow-lg text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div>
              <h1 className="text-3xl font-bold mb-2">Reviewer Evaluation Workspace</h1>
              <p className="text-slate-300 text-lg">
                Welcome back, {domainUser.name}. Here is your evaluation queue for the active review cycle.
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20 text-right">
              <p className="text-sm text-slate-300 uppercase tracking-wider font-semibold mb-1">Active Cycle</p>
              <p className="text-xl font-bold">{dashboardStats.activeCycle}</p>
            </div>
          </div>
        </div>

        {/* Workload Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            title="Assigned Teams" 
            value={dashboardStats.activeAssignedTeams} 
            icon={Users} 
            colorClass="text-blue-600" 
            bgClass="bg-blue-50" 
          />
          <StatCard 
            title="Pending Reviews" 
            value={dashboardStats.pendingReviews} 
            icon={PlayCircle} 
            colorClass="text-orange-600" 
            bgClass="bg-orange-50" 
          />
          <StatCard 
            title="Completed Reviews" 
            value={dashboardStats.completedReviews} 
            icon={CheckCircle2} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50" 
          />
          <StatCard 
            title="Average Marks Awarded" 
            value={dashboardStats.averageMarksAwarded} 
            icon={ShieldCheck} 
            colorClass="text-purple-600" 
            bgClass="bg-purple-50" 
          />
        </div>

        {/* Main Workspace Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <Card title="Pending Review Queue" icon={<Clock className="text-primary-600" />}>
              {pendingTeams.length > 0 ? (
                <div className="divide-y divide-gray-100 mt-2">
                  {pendingTeams.map((team, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">{team.id}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-primary-100 text-primary-800">
                            {team.evaluationStatus}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{team.project?.title || 'Unknown Project'}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <button 
                          onClick={() => navigate('/reviewer/evaluations')}
                          className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          Start Review &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">All caught up! No pending evaluations in the active cycle.</p>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card title="Reviewer Activity Timeline">
              {timeline.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent mt-4">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-primary-100 text-primary-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                      </div>
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900 text-xs">{event.title}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500">{event.details}</p>
                        <time className="text-[10px] text-slate-400 mt-1 block">{new Date(event.date).toLocaleDateString()}</time>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">No recent activity found.</p>
              )}
            </Card>
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReviewerDashboard;
