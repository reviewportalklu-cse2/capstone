import React, { useState, useEffect } from 'react';
import { useEvaluationCenterData } from '@/hooks/useEvaluationCenterData';
import { evaluationCenterService } from '@/firebase/services/evaluationCenterService';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PendingTracker = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await evaluationCenterService.getAllTeamsWithEvaluations();
      setTeams(data);
    } catch (err) {
      console.error("Failed to load pending evaluations:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const isPending = (val) => val === null || val === undefined;

  const guidePending = teams.filter(t => isPending(t.guideMarks));
  const facultyPending = teams.filter(t => isPending(t.facultyMarks));
  const r1Pending = teams.filter(t => isPending(t.review1Score));
  const r2Pending = teams.filter(t => isPending(t.review2Score));
  const r3Pending = teams.filter(t => isPending(t.review3Score));

  const getFilteredData = () => {
    if (filterType === 'Guide') return guidePending;
    if (filterType === 'Faculty') return facultyPending;
    if (filterType === 'Review 1') return r1Pending;
    if (filterType === 'Review 2') return r2Pending;
    if (filterType === 'Review 3') return r3Pending;
    return teams.filter(t => isPending(t.guideMarks) || isPending(t.facultyMarks) || isPending(t.review1Score) || isPending(t.review2Score) || isPending(t.review3Score));
  };

  const pendingList = getFilteredData();

  const columns = [
    {
      key: 'team',
      header: 'Team Details',
      render: (row) => (
        <div>
          <div className="font-bold text-gray-900 text-sm">{row.teamId}</div>
          <div className="text-xs text-primary-700 font-semibold">{row.projectTitle || row.teamName}</div>
        </div>
      )
    },
    {
      key: 'pendingItems',
      header: 'Pending Evaluations',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {isPending(row.guideMarks) && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Guide Marks</span>}
          {isPending(row.facultyMarks) && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Faculty Internal</span>}
          {isPending(row.review1Score) && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Review 1</span>}
          {isPending(row.review2Score) && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Review 2</span>}
          {isPending(row.review3Score) && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Review 3</span>}
        </div>
      )
    },
    {
      key: 'assignedMentors',
      header: 'Responsible Evaluator',
      render: (row) => (
        <div className="text-xs text-gray-700">
          <div><span className="text-gray-400">Guide:</span> <span className="font-medium text-gray-800">{row.guideName || 'Unassigned'}</span></div>
          <div><span className="text-gray-400">Reviewer:</span> <span className="font-medium text-gray-800">{row.reviewerName || 'Unassigned'}</span></div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="xs" variant="primary" onClick={() => navigate(`/admin/evaluation-center/team/${row.id}`)}>
          View & Remind
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Guide Pending', count: guidePending.length, key: 'Guide', color: 'amber' },
          { label: 'Faculty Pending', count: facultyPending.length, key: 'Faculty', color: 'purple' },
          { label: 'Review 1 Pending', count: r1Pending.length, key: 'Review 1', color: 'blue' },
          { label: 'Review 2 Pending', count: r2Pending.length, key: 'Review 2', color: 'indigo' },
          { label: 'Review 3 Pending', count: r3Pending.length, key: 'Review 3', color: 'rose' }
        ].map(item => (
          <div
            key={item.key}
            onClick={() => setFilterType(item.key)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterType === item.key ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-500/20' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xs text-gray-500 font-medium">{item.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{item.count}</div>
          </div>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Pending Evaluation Tracker Queue ({pendingList.length})
          </h3>
          <Button size="xs" variant="outline" onClick={() => setFilterType('All')}>Show All Pending</Button>
        </div>
        <Table columns={columns} data={pendingList} />
      </Card>

    </div>
  );
};

export default PendingTracker;
