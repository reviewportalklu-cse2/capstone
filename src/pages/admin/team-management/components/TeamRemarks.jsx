import React from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { MessageSquare, User } from 'lucide-react';

const TeamRemarks = ({ teamData }) => {
  return (
    <Card title="Latest Remarks" icon={MessageSquare}>
      <div className="space-y-4">
        {teamData.remarks.length > 0 ? (
          teamData.remarks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5) // Show only latest 5 on overview
            .map((remark) => (
              <div key={remark.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{remark.authorName || 'Evaluator'}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="default" className="text-[10px] uppercase tracking-wide">{remark.authorRole}</Badge>
                    <span className="text-[10px] text-gray-400">
                      {new Date(remark.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic border-l-2 border-primary-200 pl-3 ml-1">
                  "{remark.text}"
                </p>
              </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">
            No remarks found for this team.
          </div>
        )}
      </div>
    </Card>
  );
};

export default TeamRemarks;
