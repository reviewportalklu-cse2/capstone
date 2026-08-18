import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import { useData } from '@/contexts/DataContext';
import { notificationService } from '@/firebase/services/notificationService';
import { Bell, Send, CheckCircle2, History, Loader2, AlertCircle, Trash2 } from 'lucide-react';

const AdminNotificationCenter = () => {
  const { notifications, dataLoading, teams } = useData();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'Announcement',
    priority: 'Information',
    recipientType: 'global', // global, role, team, individual
    roles: [],
    targetTeams: []
  });

  const handleRoleToggle = (role) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleTeamToggle = (teamId) => {
    setFormData(prev => ({
      ...prev,
      targetTeams: prev.targetTeams.includes(teamId) 
        ? prev.targetTeams.filter(t => t !== teamId)
        : [...prev.targetTeams, teamId]
    }));
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return alert("Title and message required");
    
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        category: formData.category,
        priority: formData.priority,
        recipientType: formData.recipientType,
        roleIds: formData.recipientType === 'role' ? formData.roles : [],
        teamIds: formData.recipientType === 'team' ? formData.targetTeams : [],
        senderId: 'ADMIN',
        senderRole: 'Admin'
      };

      await notificationService.broadcast(payload);
      alert("Notification Broadcasted Successfully!");
      setFormData({
        title: '', message: '', category: 'Announcement', priority: 'Information', recipientType: 'global', roles: [], targetTeams: []
      });
      setActiveTab('history');
    } catch (err) {
      console.error(err);
      alert("Failed to broadcast notification.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notification globally?")) {
      await notificationService.delete(id);
      alert("Notification deleted.");
    }
  };

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={adminNavigation} title="Notification Center">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const allNotifications = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const activeTeams = teams.filter(t => t.status === 'Active');

  const historyColumns = [
    { header: 'Date', render: (row) => <span className="text-sm">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { header: 'Title', accessor: 'title', render: (row) => <span className="font-bold text-gray-900">{row.title}</span> },
    { header: 'Priority', render: (row) => {
      let variant = 'secondary';
      if (row.priority === 'Critical') variant = 'danger';
      else if (row.priority === 'High') variant = 'warning';
      else if (row.priority === 'Medium') variant = 'primary';
      return <Badge variant={variant}>{row.priority}</Badge>;
    }},
    { header: 'Target', render: (row) => (
      <span className="text-xs font-semibold uppercase px-2 py-1 bg-gray-100 rounded text-gray-600">
        {row.recipientType}
      </span>
    )},
    { header: 'Status', render: (row) => <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {row.status || 'Delivered'}</span> },
    { header: 'Actions', render: (row) => (
      <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700">
        <Trash2 className="w-4 h-4" />
      </Button>
    )}
  ];

  return (
    <DashboardLayout navigationItems={adminNavigation} title="Notification Center">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
            <Bell className="w-6 h-6 text-primary-600" /> Enterprise Notification Center
          </h1>
          <p className="text-gray-600">Broadcast communications securely across the Capstone platform.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6 pb-2">
          <button 
            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'compose' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('compose')}
          >
            <Send className="w-4 h-4" /> Compose Broadcast
          </button>
          <button 
            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4" /> Broadcast History
          </button>
        </div>

        {activeTab === 'compose' ? (
          <form onSubmit={handleBroadcast} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card title="Message Details">
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Notification Title</label>
                    <Input 
                      value={formData.title} 
                      onChange={(e) => setFormData({...formData, title: e.target.value})} 
                      placeholder="e.g., Important: Mid-Term Reviews Scheduled"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message Content</label>
                    <textarea 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm p-3 border"
                      rows="5"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Enter the detailed message here..."
                      required
                    />
                  </div>
                </div>
              </Card>

              <Card title="Target Audience">
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Target Type</label>
                    <div className="flex gap-4">
                      {['global', 'role', 'team'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="target" 
                            value={type} 
                            checked={formData.recipientType === type}
                            onChange={() => setFormData({...formData, recipientType: type})}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <span className="capitalize font-medium text-gray-700">{type === 'global' ? 'All System Users' : type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.recipientType === 'role' && (
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Target Roles</label>
                      <div className="flex flex-wrap gap-3">
                        {['Student', 'Guide', 'Faculty', 'Reviewer'].map(role => (
                          <label key={role} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                            <input 
                              type="checkbox" 
                              checked={formData.roles.includes(role)}
                              onChange={() => handleRoleToggle(role)}
                              className="text-primary-600 rounded"
                            />
                            <span className="text-sm font-medium">{role}s</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.recipientType === 'team' && (
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Target Teams</label>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 flex flex-wrap gap-2">
                        {activeTeams.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleTeamToggle(t.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${formData.targetTeams.includes(t.id) ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                          >
                            {t.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card title="Settings & Delivery">
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border p-2"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option>Announcement</option>
                      <option>Evaluation</option>
                      <option>Meeting</option>
                      <option>Review Cycle</option>
                      <option>System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                    <select 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm border p-2"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="Information">Information (Blue)</option>
                      <option value="Medium">Medium (Purple)</option>
                      <option value="High">High (Orange)</option>
                      <option value="Critical">Critical (Red)</option>
                    </select>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-100">
                    <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />} 
                      Send Broadcast Now
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <Card title="Sent Broadcasts & Notifications">
              <Table columns={historyColumns} data={allNotifications} />
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminNotificationCenter;
