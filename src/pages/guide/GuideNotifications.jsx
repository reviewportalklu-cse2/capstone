import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/firebase/services/notificationService';
import { useData } from '@/contexts/DataContext';
import { Loader2, Bell, Check, Filter, Trash2 } from 'lucide-react';

const GuideNotifications = () => {
  const { currentUser } = useAuth();
  const { getNotificationsByRole, dataLoading } = useData();
  const [activeTab, setActiveTab] = useState('All');
  const [filterUnread, setFilterUnread] = useState(false);

  const categories = ['All', 'Evaluations', 'Meeting', 'Project', 'General', 'System'];

  const notifications = getNotificationsByRole();

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markRead(id, currentUser.uid);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.readBy?.includes(currentUser.uid));
      await Promise.all(unread.map(n => notificationService.markRead(n.id, currentUser.uid)));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="Notifications">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const unreadCount = notifications.filter(n => !n.readBy?.includes(currentUser.uid)).length;

  let filteredNotifications = notifications;
  if (activeTab !== 'All') {
    filteredNotifications = filteredNotifications.filter(n => n.category === activeTab);
  }
  if (filterUnread) {
    filteredNotifications = filteredNotifications.filter(n => !n.readBy?.includes(currentUser.uid));
  }

  return (
    <DashboardLayout navigationItems={guideNavigation} title="Notifications">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary-600" /> Notifications Inbox
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Updates on team progress, meetings, and system alerts.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="flex items-center gap-2">
              <Check className="w-4 h-4" /> Mark All Read
            </Button>
          )}
        </div>

        <Card className="p-0 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <nav className="flex space-x-4 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              {categories.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    whitespace-nowrap py-2 px-3 rounded-md font-medium text-sm transition-colors
                    ${activeTab === tab
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={filterUnread}
                  onChange={(e) => setFilterUnread(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                Unread Only
              </label>
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="py-12">
                <EmptyState 
                  icon={Bell}
                  title="All Caught Up!" 
                  description="You have no notifications in this category." 
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => {
                  const isRead = notification.readBy?.includes(currentUser.uid);
                  let priorityColor = 'text-primary-600';
                  let priorityBg = 'bg-primary-100';
                  if (notification.priority === 'Critical') { priorityColor = 'text-red-600'; priorityBg = 'bg-red-100'; }
                  else if (notification.priority === 'High') { priorityColor = 'text-orange-600'; priorityBg = 'bg-orange-100'; }

                  return (
                    <div 
                      key={notification.id} 
                      className={`p-6 transition-colors flex flex-col md:flex-row items-start justify-between gap-4 border-l-4 ${isRead ? 'border-l-transparent bg-white hover:bg-gray-50' : 'border-l-primary-500 bg-primary-50/30 hover:bg-primary-50/50'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full flex-shrink-0 ${isRead ? 'bg-gray-100' : `${priorityBg} ${priorityColor} shadow-sm`}`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-base font-bold ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              {notification.category}
                            </span>
                            {notification.priority === 'Critical' && <span className="text-[10px] font-bold uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded">Critical</span>}
                          </div>
                          <p className={`text-sm mt-1 ${isRead ? 'text-gray-500' : 'text-gray-700'}`}>{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2 font-medium">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-white border border-primary-200 px-3 py-1.5 rounded-full shadow-sm hover:shadow"
                        >
                          <Check className="w-4 h-4" /> Mark Read
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GuideNotifications;
