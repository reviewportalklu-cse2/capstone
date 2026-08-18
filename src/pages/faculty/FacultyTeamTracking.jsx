import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { facultyNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import EmptyState from '@/components/common/EmptyState';
import { useFacultyAnalytics } from '@/hooks/useFacultyAnalytics';
import { Users, Search, Target, Clock, Filter, Loader2, ArrowRight } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const FacultyTeamTracking = () => {
  const navigate = useNavigate();
  const { getAssignedTeams, dataLoading } = useFacultyAnalytics();
  const { getGuideById, getReviewerById } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const teams = getAssignedTeams();

  const filteredTeams = teams.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.project?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="Team Tracking">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="Team Tracking Workspace">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                <Users className="w-6 h-6 text-primary-600" /> Team Tracking Workspace
              </h1>
              <p className="text-gray-600">Oversee all teams assigned to your classroom, monitor attendance, and track review completions.</p>
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
              const reviewer = team.reviewerId ? getReviewerById(team.reviewerId) : null;
              
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
                          {team.hasPendingEvaluations && <Badge variant="warning">Pending Eval</Badge>}
                        </div>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mt-2">
                          <Target className="w-4 h-4 text-primary-500" /> {team.project?.title || 'Unknown Project'}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         <span className="text-xs text-gray-500 uppercase font-semibold">Attendance</span>
                         <Badge variant={team.attendancePercent >= 75 ? 'success' : 'danger'}>{team.attendancePercent}%</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Assigned Guide</p>
                        <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-1">{guide?.name || team.guideName || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Assigned Reviewer</p>
                        <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-1">{reviewer?.name || team.reviewerName || 'Unassigned'}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="font-semibold text-gray-600">Review Completion Progress</span>
                        <span className="font-bold text-primary-600">{team.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${team.progressPercent}%` }}></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                       <span className="text-sm text-gray-500 font-medium">{team.members?.length || 0} Students Assigned</span>
                       <Button variant="ghost" size="sm" onClick={() => navigate(`/faculty/evaluations`)} className="text-primary-600">
                         View Evaluations <ArrowRight className="w-4 h-4 ml-1" />
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
              title="No Teams Found"
              description="No assigned teams match your search or you have no teams assigned to your classroom."
            />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default FacultyTeamTracking;
