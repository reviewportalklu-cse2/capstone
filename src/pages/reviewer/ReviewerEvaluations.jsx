import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useReviewerAnalytics } from '@/hooks/useReviewerAnalytics';
import { Loader2, FileText, CheckCircle2, AlertCircle, Edit2, History, Lock } from 'lucide-react';

const ReviewerEvaluations = () => {
  const navigate = useNavigate();
  const { getAssignedTeams, getReviewHistory, dataLoading, dashboardStats } = useReviewerAnalytics();
  const [activeTab, setActiveTab] = useState('active');

  const activeTeams = getAssignedTeams();
  const historyTeams = getReviewHistory();
  const activeCycle = dashboardStats?.activeCycle !== 'None' ? dashboardStats?.activeCycle : null;

  const activeColumns = [
    { header: 'Team ID', accessor: 'id', render: (row) => <span className="font-bold text-gray-900">{row.id}</span> },
    { header: 'Project', accessor: 'project.title', render: (row) => <div className="max-w-[250px] truncate">{row.project?.title || 'N/A'}</div> },
    { header: 'Evaluation Status', render: (row) => {
      let variant = 'primary';
      if (row.evaluationStatus === 'Pending') variant = 'warning';
      if (row.evaluationStatus === 'Draft') variant = 'secondary';
      if (row.evaluationStatus === 'Locked') variant = 'danger';
      if (row.evaluationStatus === 'Published') variant = 'success';
      return <Badge variant={variant}>{row.evaluationStatus}</Badge>;
    }},
    { header: 'Actions', render: (row) => {
      const isReadOnly = row.evaluationStatus === 'Locked' || row.evaluationStatus === 'Published';
      return (
        <Button 
          variant={isReadOnly ? 'outline' : 'primary'} 
          size="sm" 
          onClick={() => navigate(`/reviewer/evaluate/${row.id}`)}
          className="flex items-center gap-2"
        >
          {isReadOnly ? <><Lock className="w-4 h-4"/> View Evaluation</> : <><Edit2 className="w-4 h-4"/> Evaluate Team</>}
        </Button>
      );
    }}
  ];

  const historyColumns = [
    { header: 'Review Cycle', accessor: 'reviewCycleName', render: (row) => <Badge variant="secondary">{row.reviewCycleName}</Badge> },
    { header: 'Team ID', accessor: 'id', render: (row) => <span className="font-bold text-gray-900">{row.id}</span> },
    { header: 'Score Awarded', accessor: 'totalScore', render: (row) => <span className="font-bold text-primary-600">{row.totalScore || 0}</span> },
    { header: 'Evaluation Date', accessor: 'evaluationDate', render: (row) => (
      <span className="text-sm text-gray-500">
        {row.evaluationDate ? new Date(row.evaluationDate).toLocaleDateString() : 'N/A'}
      </span>
    )},
    { header: 'Actions', render: (row) => (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate(`/reviewer/evaluate/${row.id}?cycle=${row.reviewCycleName}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <Lock className="w-4 h-4"/> View Record
      </Button>
    )}
  ];

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="Reviewer Evaluations">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="Reviewer Evaluations">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary-600" /> Reviewer Evaluations & History
            </h1>
            <p className="text-sm text-gray-500 mt-1">Submit marks for your assigned teams during the active cycle, and view your historical evaluation records.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Active Review Cycle</span>
            {activeCycle ? (
              <span className="text-lg font-bold text-primary-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {activeCycle}
              </span>
            ) : (
              <span className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> None Active
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6 pb-2">
          <button 
            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'active' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Cycle Evaluations
          </button>
          <button 
            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4" /> Review History (Read-only)
          </button>
        </div>

        {activeTab === 'active' ? (
          <div className="space-y-6">
            {!activeCycle && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold">Evaluation Period Closed</p>
                  <p className="text-sm mt-1">There is no active review cycle currently open. You cannot submit or edit marks outside of an active review cycle.</p>
                </div>
              </div>
            )}
            <Card title="Active Cycle Teams">
              {activeTeams.length > 0 ? (
                <Table columns={activeColumns} data={activeTeams} />
              ) : (
                <div className="py-12">
                  <EmptyState
                    icon={FileText}
                    title="No Teams Assigned"
                    description="You have no assigned teams to evaluate in the current active review cycle."
                  />
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card title="Historical Review Records (Read-Only)">
              {historyTeams.length > 0 ? (
                <Table columns={historyColumns} data={historyTeams} />
              ) : (
                <div className="py-12 bg-white rounded-lg border border-gray-100">
                  <EmptyState
                    icon={History}
                    title="No Historical Records"
                    description="You do not have any evaluation records from past review cycles."
                  />
                </div>
              )}
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ReviewerEvaluations;
