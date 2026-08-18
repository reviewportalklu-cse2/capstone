import React, { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BookOpen, AlertTriangle, MessageSquare, CheckCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';

const EvaluationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudentEvaluations, dataLoading, rubrics, rubricCriteria } = useStudentAnalytics();
  
  const evaluations = getStudentEvaluations();
  const evaluation = useMemo(() => evaluations.find(e => e.id === id), [evaluations, id]);
  
  const rubric = useMemo(() => {
    if (!evaluation) return null;
    return rubrics.find(r => r.id === evaluation.rubricId) || null;
  }, [evaluation, rubrics]);

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Evaluation Details">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!evaluation) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Evaluation Details">
        <div className="max-w-4xl mx-auto mt-12 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Evaluation Not Found</h2>
          <Button onClick={() => navigate('/student/evaluations')} variant="outline">Back to Evaluations</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Map criteria details
  const criteriaList = (rubricCriteria || []).filter(c => c.rubricId === evaluation.rubricId);
  const evaluationCriteriaData = Object.entries(evaluation.criteriaScores || {}).map(([cId, score]) => {
    const crit = criteriaList.find(c => c.id === cId);
    return {
      criterion: crit?.name || 'Unknown Criterion',
      description: crit?.description || '',
      maxMarks: crit?.maxMarks || 0,
      weight: crit?.weight || 0,
      marksAwarded: score,
    };
  });

  const columns = [
    { header: 'Criterion', accessor: 'criterion', render: (row) => (
      <div>
        <p className="font-bold text-gray-900">{row.criterion}</p>
        <p className="text-xs text-gray-500 truncate max-w-[200px]" title={row.description}>{row.description}</p>
      </div>
    )},
    { header: 'Weight (%)', accessor: 'weight' },
    { header: 'Max Marks', accessor: 'maxMarks' },
    { header: 'Marks Awarded', accessor: 'marksAwarded', render: (row) => <span className="font-bold text-primary-600">{row.marksAwarded}</span> }
  ];

  return (
    <DashboardLayout navigationItems={studentNavigation} title="Evaluation Details">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={() => navigate('/student/evaluations')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-600" /> Evaluation Breakdown
          </h1>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg border-0 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-1">Review Cycle</p>
              <h2 className="text-3xl font-bold">{evaluation.cycleName}</h2>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-300">
                <span>Date: {new Date(evaluation.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>Rubric: {rubric?.name || 'Standard'}</span>
              </div>
            </div>
            <div className="bg-white/10 p-6 rounded-xl border border-white/20 text-center min-w-[150px]">
              <p className="text-sm text-gray-300 uppercase tracking-widest font-medium mb-1">Total Score</p>
              <p className="text-5xl font-black text-amber-400">{evaluation.totalScore}</p>
              <Badge variant="success" className="mt-3 w-full justify-center">Completed</Badge>
            </div>
          </div>
        </Card>

        {/* Rubric Breakdown Table */}
        <Card title="Rubric Breakdown" className="shadow-sm">
          <div className="overflow-x-auto mt-4">
            <Table columns={columns} data={evaluationCriteriaData} />
          </div>
        </Card>

        {/* Remarks Section */}
        <Card title="Evaluator Remarks" className="shadow-sm">
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex gap-4 items-start">
              <MessageSquare className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">General Remarks</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{evaluation.remarks || <span className="text-gray-400 italic">No remarks provided.</span>}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer Meta Data */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
          <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> Immutable Academic Record</span>
          <span>Evaluation ID: {evaluation.id}</span>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default EvaluationDetails;
