import React from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { Calendar, ClipboardList } from 'lucide-react';

const EvaluationTimeline = ({ teamData }) => {
  return (
    <Card title="Evaluation Timeline" icon={ClipboardList}>
      <div className="space-y-6">
        {teamData.reviews.length > 0 ? (
          <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {teamData.reviews
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((review, idx) => (
                <div key={review.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mb-8 last:mb-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 ring-4 ring-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 bg-indigo-500 border-indigo-500 text-white">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="primary">{review.reviewType}</Badge>
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(review.createdAt || review.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Evaluator</p>
                        <p className="text-sm font-bold text-gray-900">{review.reviewerName || 'Reviewer'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total Score</p>
                        <p className="text-lg font-black text-indigo-600">{review.totalScore}</p>
                      </div>
                    </div>
                    {review.remarks && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-100">
                        "{review.remarks}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-lg">
            No formal reviews have been conducted for this team yet.
          </div>
        )}
      </div>
    </Card>
  );
};

export default EvaluationTimeline;
