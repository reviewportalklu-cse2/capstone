import React, { useMemo } from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { History, UserCircle, Calendar, CheckCircle } from 'lucide-react';

const ReviewerRotationTimeline = ({ teamData }) => {
  const { reviewerHistory, evaluations } = teamData;

  const timelineEvents = useMemo(() => {
    if (!reviewerHistory) return [];

    // Combine assignments with corresponding evaluations
    return reviewerHistory.map(assignment => {
      const relatedEval = (evaluations || []).find(
        e => e.reviewCycleId === assignment.reviewCycleId && e.evaluatorId === assignment.reviewerId
      );

      return {
        ...assignment,
        evaluation: relatedEval
      };
    }).sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate));

  }, [reviewerHistory, evaluations]);

  if (!timelineEvents.length) {
    return (
      <Card title="Reviewer Rotation History" icon={History}>
        <div className="text-center p-6 text-gray-500">
          No reviewer assignment history found for this team.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Reviewer Rotation History" icon={History}>
      <div className="relative border-l border-gray-200 ml-3 space-y-8 pb-4 mt-2">
        {timelineEvents.map((event, idx) => (
          <div key={event.id || idx} className="relative pl-6">
            <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-white ${event.status === 'Active' ? 'bg-primary-500' : 'bg-gray-300'}`}>
              <UserCircle className="w-4 h-4 text-white" />
            </span>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                {event.reviewerName}
                <Badge variant={event.status === 'Active' ? 'success' : 'secondary'}>
                  {event.status}
                </Badge>
              </h3>
              <time className="text-xs text-gray-500 flex items-center gap-1 mt-1 sm:mt-0">
                <Calendar className="w-3 h-3" />
                {new Date(event.assignedDate).toLocaleDateString()}
              </time>
            </div>
            
            <div className="text-xs text-gray-600 mb-2">
              <p>Assigned for: <span className="font-semibold text-gray-900">{event.reviewCycleId}</span></p>
              {event.removedDate && (
                <p>Removed on: {new Date(event.removedDate).toLocaleDateString()}</p>
              )}
            </div>

            {event.evaluation ? (
              <div className="bg-gray-50 p-3 rounded border border-gray-100 mt-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1 text-emerald-600 font-medium text-xs">
                    <CheckCircle className="w-4 h-4" /> Evaluation Submitted
                  </div>
                  <Badge variant="primary">Avg: {event.evaluation.teamAverage}</Badge>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><span className="font-semibold text-gray-700">Strengths:</span> {event.evaluation.remarks?.strengths || 'N/A'}</p>
                  <p><span className="font-semibold text-gray-700">Improvements:</span> {event.evaluation.remarks?.weaknesses || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-2 text-xs text-yellow-700 rounded border border-yellow-100 mt-2">
                No evaluation submitted during this assignment.
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ReviewerRotationTimeline;
