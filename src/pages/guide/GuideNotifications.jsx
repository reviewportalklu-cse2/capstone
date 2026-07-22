import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/firebase/services/notificationService';
import { Loader2, Bell, CheckCircle, Trash2, MailOpen, AlertTriangle } from 'lucide-react';

const GuideNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchNotifications(currentUser.uid);
    }
  }, [currentUser]);

  const fetchNotifications = async (uid) => {
    try {
      setLoading(true);
      const data = await notificationService.getByUserId(uid);
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(sorted);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.update(id, { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => notificationService.update(n.id, { read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="CapstoneFlow - Notifications">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout navigationItems={guideNavigation} title="CapstoneFlow - Notifications">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary-600" /> Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Updates on student submissions, meetings, and reviews.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
              <CheckCircle className="w-4 h-4 mr-2" /> Mark All Read
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <Card padding="p-0">
          {notifications.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={Bell}
                title="All caught up!"
                description="You have no notifications at this time."
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 flex gap-4 transition-colors hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${!notification.read ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-sm ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                    <div className="flex gap-4 mt-3">
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs font-medium text-primary-600 hover:text-primary-800 flex items-center gap-1 focus:outline-none"
                        >
                          <MailOpen className="w-3 h-3" /> Mark Read
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 focus:outline-none"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default GuideNotifications;
