import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useGuideAnalytics } from '@/hooks/useGuideAnalytics';
import { Loader2, Users, Target, BookOpen, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import { useNavigate } from 'react-router-dom';

const TeamSupervision = () => {
  const { getSupervisedTeams, dataLoading } = useGuideAnalytics();
  const navigate = useNavigate();

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="Team Supervision">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const teams = getSupervisedTeams();

  return (
    <DashboardLayout navigationItems={guideNavigation} title="Team Supervision">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Users className="w-6 h-6 text-primary-600" /> Team Supervision Workspace
          </h1>
          <p className="text-gray-600">Comprehensive overview of all teams under your mentorship, including milestone tracking and evaluation statuses.</p>
        </div>

        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {teams.map(team => (
              <Card key={team.id} className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-bold text-gray-900">{team.id}</h2>
                        <Badge variant={team.project?.status === 'Completed' ? 'success' : 'primary'}>
                          {team.project?.status || 'In Progress'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary-500" /> {team.project?.title || 'No Project Assigned'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => navigate('/guide/meetings')}>
                        <Clock className="w-4 h-4 mr-2" /> Log Meeting
                      </Button>
                      <Button onClick={() => navigate('/guide/marks')}>
                        Evaluate <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" /> Team Members ({team.members?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {team.members && team.members.length > 0 ? (
                        team.members.map(member => (
                          <div key={member.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.rollNo || member.rollNumber}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No students assigned to this team.</p>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-500" /> Milestone Progress
                    </h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Overall Completion</span>
                        <span className="font-bold text-primary-600">{team.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${team.progressPercent}%` }}></div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Evaluations</p>
                          <p className="text-lg font-bold text-gray-900">{team.completedReviews}</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                          <Badge variant="warning">Action Req</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12">
            <EmptyState 
              icon={Users}
              title="No Teams Assigned"
              description="You have not been assigned as a Guide to any teams yet."
            />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default TeamSupervision;
