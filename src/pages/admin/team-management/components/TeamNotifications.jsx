import React from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { Bell } from 'lucide-react';

const TeamNotifications = ({ teamData }) => {
  return (
    <Card title="Team Notifications" icon={Bell}>
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {teamData.notifications.length > 0 ? (
          teamData.notifications
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((notification) => (
              <div key={notification.id} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={notification.read ? 'default' : 'primary'} className="text-[10px]">
                    {notification.type || 'Alert'}
                  </Badge>
                  <span className="text-[10px] text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">{notification.title}</h4>
                <p className="text-xs text-gray-600">{notification.message}</p>
              </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No notifications sent to this team yet.
          </div>
        )}
      </div>
    </Card>
  );
};

export default TeamNotifications;
