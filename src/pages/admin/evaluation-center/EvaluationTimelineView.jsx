import React, { useState, useEffect } from 'react';
import { evaluationCenterService } from '@/firebase/services/evaluationCenterService';
import Card from '@/components/common/Card';
import { Calendar, CheckCircle2, Clock, Loader2 } from 'lucide-react';

const EvaluationTimelineView = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const data = await evaluationCenterService.getAllTeamsWithEvaluations();
      setTeams(data);
    } catch (err) {
      console.error("Failed to load timeline events:", err);
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

  return (
    <Card className="p-6">
      <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary-600" /> Live University Evaluation Event Stream
      </h3>
      <div className="space-y-6 border-l-2 border-primary-200 ml-4 pl-6 relative">
        {teams.map((t, idx) => (
          <div key={idx} className="relative space-y-1">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary-600 border-2 border-white"></div>
            <div className="font-bold text-sm text-gray-900">{t.teamId} - {t.teamName}</div>
            <div className="text-xs text-gray-500">Stage: <span className="font-semibold text-gray-800">{t.approvalStage}</span> • Department: {t.department}</div>
            <div className="text-xs font-semibold text-primary-700">Guide: {t.guideName} • Reviewer: {t.reviewerName}</div>
            <div className="text-xs text-gray-600">Final Aggregated Weighted Score: <span className="font-bold text-green-700">{t.finalScore}/100 ({t.grade})</span></div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EvaluationTimelineView;
