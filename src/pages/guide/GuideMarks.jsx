import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useGuideAnalytics } from '@/hooks/useGuideAnalytics';
import { useData } from '@/contexts/DataContext';
import { Loader2, Award, AlertCircle, Edit2, CheckCircle2, Lock } from 'lucide-react';

const GuideMarks = () => {
  const navigate = useNavigate();
  const { getSupervisedTeams, dataLoading } = useGuideAnalytics();
  const { evaluations, getActiveReviewCycle } = useData();
  const activeCycle = getActiveReviewCycle();
  const teams = getSupervisedTeams();

  const getEvaluationStatus = (teamId) => {
    if (!activeCycle) return { status: 'No Active Cycle', variant: 'secondary' };
    
    // Find guide's evaluation for this team in active cycle
    const evalDoc = evaluations.find(e => 
      e.teamId === teamId && 
      (e.reviewCycleId === activeCycle.id || e.reviewCycle === activeCycle.name) && 
      e.role === 'guide'
    );

    if (!evalDoc) return { status: 'Pending', variant: 'warning' };
    
    switch(evalDoc.status) {
      case 'Draft': return { status: 'Draft', variant: 'secondary' };
      case 'Submitted': return { status: 'Submitted', variant: 'primary' };
      case 'Locked': return { status: 'Locked', variant: 'danger' };
      case 'Published': return { status: 'Published', variant: 'success' };
      default: return { status: evalDoc.status, variant: 'primary' };
    }
  };

  const columns = [
    { header: 'Team ID', accessor: 'id', render: (row) => <span className="font-bold text-gray-900">{row.id}</span> },
    { header: 'Project', accessor: 'project.title', render: (row) => <div className="max-w-[250px] truncate">{row.project?.title || 'N/A'}</div> },
    { header: 'Evaluation Status', render: (row) => {
      const { status, variant } = getEvaluationStatus(row.id);
      return <Badge variant={variant}>{status}</Badge>;
    }},
    { header: 'Actions', render: (row) => {
      if (!activeCycle) return null;
      const { status } = getEvaluationStatus(row.id);
      
      const isReadOnly = status === 'Locked' || status === 'Published';
      
      return (
        <Button 
          variant={isReadOnly ? 'outline' : 'primary'} 
          size="sm" 
          onClick={() => navigate(`/guide/evaluate/${row.id}`)}
          className="flex items-center gap-2"
        >
          {isReadOnly ? <><Lock className="w-4 h-4"/> View Evaluation</> : <><Edit2 className="w-4 h-4"/> Evaluate</>}
        </Button>
      );
    }}
  ];

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="Guide Evaluation Marks">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={guideNavigation} title="Guide Evaluation Marks">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Award className="h-6 w-6 text-primary-600" /> Guide Evaluations
            </h1>
            <p className="text-sm text-gray-500 mt-1">Submit marks for your supervised teams strictly for the active review cycle.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Active Review Cycle</span>
            {activeCycle ? (
              <span className="text-lg font-bold text-primary-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {activeCycle.name}
              </span>
            ) : (
              <span className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> None Active
              </span>
            )}
          </div>
        </div>

        {!activeCycle && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold">Evaluation Period Closed</p>
              <p className="text-sm mt-1">There is no active review cycle currently open. You cannot submit or edit marks outside of an active review cycle.</p>
            </div>
          </div>
        )}

        <Card title="Supervised Teams - Evaluation Status">
          {teams.length > 0 ? (
            <Table columns={columns} data={teams} />
          ) : (
            <div className="py-12">
              <EmptyState
                icon={Award}
                title="No Teams Assigned"
                description="You have no assigned teams to evaluate."
              />
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default GuideMarks;
