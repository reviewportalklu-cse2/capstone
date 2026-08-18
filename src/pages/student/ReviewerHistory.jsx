import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { Loader2, History, Users } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

const ReviewerHistory = () => {
  const { getStudentReviewerHistory, getStudentEvaluations, dataLoading } = useStudentAnalytics();
  
  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Reviewer History">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const history = getStudentReviewerHistory();
  const evaluations = getStudentEvaluations();

  // Enhance history with evaluation data
  const enhancedHistory = history.map(h => {
    const ev = evaluations.find(e => e.reviewCycleId === h.reviewCycleId && e.reviewerId === h.reviewerId);
    return {
      ...h,
      evaluationSubmitted: !!ev,
      marksAwarded: ev ? ev.totalScore : '-',
      status: ev ? 'Evaluated' : (h.status === 'Active' ? 'Active' : 'Pending/Removed')
    };
  });

  const columns = [
    { header: 'Review Cycle', accessor: 'cycleName', render: (row) => <span className="font-bold text-gray-900">{row.cycleName}</span> },
    { header: 'Assigned Reviewer', accessor: 'reviewerName', render: (row) => <span className="font-medium text-primary-600">{row.reviewerName}</span> },
    { header: 'Assignment Date', accessor: 'assignedDate', render: (row) => new Date(row.assignedDate).toLocaleDateString() },
    { header: 'Removal Date', accessor: 'removedDate', render: (row) => row.removedDate ? new Date(row.removedDate).toLocaleDateString() : <span className="text-gray-400">-</span> },
    { header: 'Evaluation', accessor: 'evaluationSubmitted', render: (row) => (
      row.evaluationSubmitted ? <Badge variant="success">Submitted</Badge> : <Badge variant="default">Not Submitted</Badge>
    )},
    { header: 'Marks Awarded', accessor: 'marksAwarded', render: (row) => <span className="font-bold">{row.marksAwarded}</span> },
    { header: 'Status', accessor: 'status', render: (row) => (
      <Badge variant={row.status === 'Active' ? 'primary' : row.status === 'Evaluated' ? 'success' : 'default'}>{row.status}</Badge>
    )}
  ];

  return (
    <DashboardLayout navigationItems={studentNavigation} title="Reviewer Assignment History">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Users className="w-6 h-6 text-primary-600" /> Reviewer Rotations
          </h1>
          <p className="text-gray-600">A complete, read-only audit log of the external reviewers assigned to evaluate your team across different review cycles.</p>
        </div>

        <Card title="Assignment Ledger" className="shadow-sm">
          {enhancedHistory.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <Table columns={columns} data={enhancedHistory} />
            </div>
          ) : (
            <div className="py-12 border border-dashed border-gray-200 mt-4 rounded-lg">
              <EmptyState 
                icon={History}
                title="No Reviewer History"
                description="Your team has not been assigned any formal reviewers yet."
              />
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default ReviewerHistory;
