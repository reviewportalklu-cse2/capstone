import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/firebase/services/notificationService';
import { Loader2, Bell, Check, Trash2 } from 'lucide-react';

const StudentNotifications = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchNotifications(currentUser.uid);
    }
  }, [currentUser]);

  const fetchNotifications = async (uid) => {
    try {
      setLoading(true);
      const data = await notificationService.getByUserId(uid);
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.update(id, { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => notificationService.update(n.id, { read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - Notifications">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - Notifications">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary-600" /> Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Updates on your evaluations, meetings, and system alerts.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="flex items-center gap-2">
              <Check className="w-4 h-4" /> Mark All Read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              icon={Bell}
              title="All Caught Up!" 
              description="You have no notifications at this time." 
            />
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-colors border-l-4 ${notification.read ? 'border-l-gray-300 opacity-75' : 'border-l-primary-500 shadow-sm'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${notification.read ? 'bg-gray-100' : 'bg-primary-50 text-primary-600'}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-base font-bold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2 font-medium">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!notification.read && (
                    <button 
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 px-2 py-1 rounded"
                    >
                      <Check className="w-3 h-3" /> Mark Read
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentNotifications;
