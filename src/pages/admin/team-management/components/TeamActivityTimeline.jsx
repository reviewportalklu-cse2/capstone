import React from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { Activity, Clock } from 'lucide-react';

const TeamActivityTimeline = ({ teamData }) => {
  return (
    <Card title="Activity Timeline" icon={Activity}>
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {teamData.auditLogs.length > 0 ? (
          <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200">
            {teamData.auditLogs
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mb-4 last:mb-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 bg-gray-200 border-2 border-white shadow-sm z-10 text-gray-500">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-gray-100 bg-white shadow-sm text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-gray-900">{log.action}</p>
                      <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-600">{log.details}</p>
                    <div className="mt-2 text-[10px] text-gray-500 font-medium">
                      By: {log.userRole}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No activity logged for this team yet.
          </div>
        )}
      </div>
    </Card>
  );
};

export default TeamActivityTimeline;
