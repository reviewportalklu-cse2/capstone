import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { Loader2, Target, CheckCircle, Clock } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const ProgressTracker = () => {
  const { team, getStudentEvaluations, dataLoading } = useStudentAnalytics();
  const { reviewCycles } = useData();

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Progress Tracker">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const evaluations = getStudentEvaluations();
  
  // Build dynamic milestones from global Review Cycles
  const milestones = [
    {
      id: 'proposal',
      title: 'Project Proposal & Team Formation',
      status: team ? 'Completed' : 'Pending',
      date: team?.createdAt || null,
      completion: team ? 100 : 0
    }
  ];

  // Map review cycles as milestones
  const activeCycleIndex = reviewCycles.findIndex(c => c.status === 'Active');
  
  reviewCycles.forEach((cycle, index) => {
    const evaluationRecord = evaluations.find(e => e.reviewCycleId === cycle.id);
    let status = 'Pending';
    let completion = 0;
    
    if (evaluationRecord) {
      status = 'Completed';
      completion = 100;
    } else if (cycle.status === 'Active') {
      status = 'In Progress';
      completion = 50;
    } else if (index < activeCycleIndex) {
      status = 'Missed';
      completion = 0;
    }
    
    milestones.push({
      id: cycle.id,
      title: cycle.name,
      status,
      date: evaluationRecord?.date || null,
      completion,
      remarks: evaluationRecord?.remarks || null
    });
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Missed': return 'danger';
      default: return 'default';
    }
  };

  const overallCompletion = Math.round(milestones.reduce((acc, m) => acc + m.completion, 0) / (milestones.length || 1));

  return (
    <DashboardLayout navigationItems={studentNavigation} title="Academic Progress Tracker">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
              <Target className="w-6 h-6 text-primary-600" /> Milestone Tracking
            </h1>
            <p className="text-gray-600 max-w-xl">Monitor your progression across all required project milestones and academic evaluations.</p>
          </div>
          <div className="text-center bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[150px]">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Overall Progress</p>
            <p className="text-4xl font-black text-primary-600 mt-1">{overallCompletion}%</p>
          </div>
        </div>

        <div className="space-y-4">
          {milestones.map((milestone, idx) => (
            <Card key={milestone.id || idx} className="shadow-sm hover:shadow-md transition-shadow overflow-hidden p-0 border border-gray-200">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{milestone.title}</h3>
                    {milestone.date && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Completed on {new Date(milestone.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <Badge variant={getStatusColor(milestone.status)} className="px-3 py-1 text-sm font-bold shadow-sm">
                      {milestone.status}
                    </Badge>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-3 mb-2 border border-gray-200 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      milestone.status === 'Completed' ? 'bg-emerald-500' : 
                      milestone.status === 'In Progress' ? 'bg-amber-400' : 
                      'bg-gray-300'
                    }`} 
                    style={{ width: `${milestone.completion}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  <span>Start</span>
                  <span>{milestone.completion}%</span>
                </div>

                {milestone.remarks && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-700 italic">"{milestone.remarks}"</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ProgressTracker;
