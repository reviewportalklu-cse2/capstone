import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Badge from '@/components/common/Badge';
import { notificationService, auditService } from '@/firebase/services';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Bell, Loader2, Users, AlertCircle } from 'lucide-react';

const AdminNotifications = () => {
  const navigationItems = useAdminNavigation();

  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    priority: 'normal'
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = FirestoreService.subscribeAll('notifications', (notifs) => {
      setHistory(notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10));
    }, (err) => {
      console.error(err);
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
      // In a real system, a backend cloud function would fan out these notifications
      // to the target users. For now, we'll write a system notification document.
      const payload = {
        title: formData.title,
        message: formData.message,
        targetRole: formData.targetRole,
        priority: formData.priority,
        senderId: currentUser.uid,
        senderRole: 'admin',
        createdAt: new Date().toISOString(),
        read: false
      };

      await notificationService.create(payload);
      
      await auditService.log(
        currentUser.uid, 
        'BROADCAST_NOTIFICATION', 
        'Notification', 
        null, 
        payload
      );

      setSuccess(true);
      setFormData({ title: '', message: '', targetRole: 'all', priority: 'normal' });
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="System Wide Announcements">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <Card title="Broadcast Message" subtitle="Send an announcement to specific user roles or everyone.">
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Message broadcasted successfully!
              </div>
            )}
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Title</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Server Maintenance Notice" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 border resize-y"
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})} 
                  placeholder="Type your announcement here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    value={formData.targetRole}
                    onChange={e => setFormData({...formData, targetRole: e.target.value})}
                  >
                    <option value="all">All Users</option>
                    <option value="student">Students Only</option>
                    <option value="guide">Guides Only</option>
                    <option value="reviewer">Reviewers Only</option>
                    <option value="faculty">Faculty Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {loading ? 'Sending...' : 'Broadcast Message'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card title="Broadcast History" className="h-full">
            <div className="space-y-4">
              {history.length > 0 ? history.map(item => (
                <div key={item.id} className="pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                    {item.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.message}</p>
                  <div className="flex justify-between items-center text-xs">
                    <Badge variant="default" className="text-[10px] py-0">{item.targetRole}</Badge>
                    <span className="text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-sm text-gray-500 flex flex-col items-center">
                  <Bell className="w-8 h-8 text-gray-300 mb-2" />
                  No recent broadcasts
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

// Simple stub for CheckCircle to avoid import errors since it wasn't in lucide-react list above
const CheckCircle = ({className}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default AdminNotifications;
