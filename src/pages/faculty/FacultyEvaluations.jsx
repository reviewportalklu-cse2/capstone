import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { facultyNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useFacultyAnalytics } from '@/hooks/useFacultyAnalytics';
import { useData } from '@/contexts/DataContext';
import { Loader2, FileText, CheckCircle2, AlertCircle, Edit2, Clock, AlertTriangle } from 'lucide-react';

const FacultyEvaluations = () => {
  const navigate = useNavigate();
  const { getAssignedTeams, getPendingFacultyEvaluations, dataLoading } = useFacultyAnalytics();
  const { evaluations, getActiveReviewCycle } = useData();
  const [activeTab, setActiveTab] = useState('active');

  const activeCycle = getActiveReviewCycle();
  const teams = getAssignedTeams();
  const pendingEvals = getPendingFacultyEvaluations();

  const getEvaluationStatus = (teamId) => {
    if (!activeCycle) return { status: 'No Active Cycle', variant: 'secondary' };
    
    // Find faculty's evaluation for this team in active cycle
    const evalDoc = evaluations.find(e => 
      e.teamId === teamId && 
      (e.reviewCycleId === activeCycle.id || e.reviewCycle === activeCycle.name) && 
      e.role === 'faculty'
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

  const activeColumns = [
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
          onClick={() => navigate(`/faculty/evaluate/${row.id}`)}
          className="flex items-center gap-2"
        >
          {isReadOnly ? 'View Evaluation' : <><Edit2 className="w-4 h-4"/> Evaluate Team</>}
        </Button>
      );
    }}
  ];

  const pendingColumns = [
    { header: 'Team', accessor: 'teamId', render: (row) => <span className="font-bold text-gray-900">{row.teamId}</span> },
    { header: 'Student', accessor: 'studentName', render: (row) => <span className="font-medium text-gray-700">{row.studentName}</span> },
    { header: 'Review Cycle', accessor: 'cycleName', render: (row) => <Badge variant="secondary">{row.cycleName}</Badge> },
    { header: 'Deadline', accessor: 'deadline', render: (row) => (
      <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
        <Clock className="w-4 h-4"/> {new Date(row.deadline).toLocaleDateString()}
      </span>
    )},
    { header: 'Actions', render: (row) => (
      <Button 
        variant="primary" 
        size="sm" 
        onClick={() => navigate(`/faculty/evaluate/${row.teamId}?cycle=${row.cycleName}`)}
      >
        Complete Pending
      </Button>
    )}
  ];

  const absenteePending = pendingEvals.filter(p => p.type === 'Absentee');

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="Faculty Evaluations">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="Faculty Evaluations">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary-600" /> Faculty Evaluations & Reviews
            </h1>
            <p className="text-sm text-gray-500 mt-1">Submit marks for your assigned teams and manage pending absentee reviews.</p>
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

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6 pb-2">
          <button 
            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'active' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Cycle Evaluations
          </button>
          <button 
            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending (Absentee) Workflow
            {absenteePending.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{absenteePending.length}</span>}
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
              {teams.length > 0 ? (
                <Table columns={activeColumns} data={teams} />
              ) : (
                <div className="py-12">
                  <EmptyState
                    icon={FileText}
                    title="No Teams Assigned"
                    description="You have no assigned teams to evaluate."
                  />
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold">Absentee Evaluation Workflow</p>
                  <p className="text-sm mt-1">These students were marked absent during a previous review cycle. You must complete their pending evaluation before the deadline to ensure their progression.</p>
                </div>
              </div>
            <Card title="Pending Evaluations">
              {absenteePending.length > 0 ? (
                <Table columns={pendingColumns} data={absenteePending} />
              ) : (
                <div className="py-12 bg-white rounded-lg border border-gray-100">
                  <EmptyState
                    icon={CheckCircle2}
                    title="No Pending Evaluations"
                    description="All students in your assigned teams have completed their required evaluations."
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

export default FacultyEvaluations;
