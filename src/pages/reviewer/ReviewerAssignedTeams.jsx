import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import EmptyState from '@/components/common/EmptyState';
import { useReviewerAnalytics } from '@/hooks/useReviewerAnalytics';
import { Users, Search, Target, ArrowRight, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const ReviewerAssignedTeams = () => {
  const navigate = useNavigate();
  const { getAssignedTeams, dataLoading } = useReviewerAnalytics();
  const { getGuideById, getFacultyById } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const teams = getAssignedTeams();

  const filteredTeams = teams.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.project?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="Assigned Teams">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="Assigned Teams">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                <Users className="w-6 h-6 text-primary-600" /> Assigned Teams Workspace
              </h1>
              <p className="text-gray-600">Track and monitor the progress of teams explicitly assigned to you for the active review cycle.</p>
            </div>
            <div className="w-full md:w-80 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by Team ID or Project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredTeams.map(team => {
              const guide = team.guideId ? getGuideById(team.guideId) : null;
              const faculty = team.facultyId ? getFacultyById(team.facultyId) : null;
              
              return (
                <Card key={team.id} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow p-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-bold text-gray-900">{team.id}</h2>
                          <Badge variant={team.project?.status === 'Completed' ? 'success' : 'primary'}>
                            {team.project?.status || 'In Progress'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mt-2">
                          <Target className="w-4 h-4 text-primary-500" /> {team.project?.title || 'Unknown Project'}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         <span className="text-xs text-gray-500 uppercase font-semibold">Active Cycle</span>
                         <Badge variant="primary">{team.reviewCycleName}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Guide</p>
                        <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-1">{guide?.name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Classroom Faculty</p>
                        <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-1">{faculty?.name || 'Unassigned'}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                       <span className="text-sm font-bold text-gray-700">Evaluation: <Badge variant={team.evaluationStatus === 'Pending' ? 'warning' : 'success'}>{team.evaluationStatus}</Badge></span>
                       <Button variant="ghost" size="sm" onClick={() => navigate(`/reviewer/evaluate/${team.id}`)} className="text-primary-600">
                         Evaluate Team <ArrowRight className="w-4 h-4 ml-1" />
                       </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-12 bg-white rounded-xl border border-gray-200">
            <EmptyState 
              icon={Users}
              title="No Teams Assigned"
              description="You have no teams explicitly mapped to you in the current active review cycle."
            />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ReviewerAssignedTeams;
