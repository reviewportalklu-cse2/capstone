import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Badge from '@/components/common/Badge';
import { useData } from '@/contexts/DataContext';
import { FirestoreService } from '@/firebase/services/firestore';
import { ShieldCheck, Lock, Clock, AlertTriangle, Users, Save, CheckCircle2, Loader2, Key } from 'lucide-react';

const SecuritySettings = () => {
  const { settings, auditLogs, dataLoading } = useData();
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 30,
    accountLockMinutes: 15,
    requireSpecialCharPassword: true
  });

  // Load settings document from settings collection or initialize
  useEffect(() => {
    if (settings && settings.length > 0) {
      const secDoc = settings.find(s => s.id === 'security' || s.key === 'security');
      if (secDoc) {
        setFormData(prev => ({
          ...prev,
          maxLoginAttempts: secDoc.maxLoginAttempts || 5,
          sessionTimeoutMinutes: secDoc.sessionTimeoutMinutes || 30,
          accountLockMinutes: secDoc.accountLockMinutes || 15,
          requireSpecialCharPassword: secDoc.requireSpecialCharPassword !== false
        }));
      }
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        key: 'security',
        updatedAt: new Date().toISOString()
      };

      await FirestoreService.set('settings', 'security', payload, { merge: true });

      await FirestoreService.create('auditLogs', {
        action: 'SECURITY_SETTINGS_UPDATED',
        timestamp: new Date().toISOString(),
        details: payload
      });

      setSuccessMsg('Security policies updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Error saving security settings:", err);
      alert("Failed to save security settings.");
    } finally {
      setSaving(false);
    }
  };

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={adminNavigation} title="Security Settings">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  // Derived Metrics
  const loginAudits = auditLogs.filter(a => a.action === 'LOGIN_SUCCESS' || a.action === 'LOGIN_FAILED');
  const successfulLogins = auditLogs.filter(a => a.action === 'LOGIN_SUCCESS').length;
  const failedLogins = auditLogs.filter(a => a.action === 'LOGIN_FAILED').length;
  const securityEvents = auditLogs.filter(a => a.action?.includes('SECURITY') || a.action?.includes('PASSWORD')).length;

  return (
    <DashboardLayout navigationItems={adminNavigation} title="Security Settings">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary-600" /> Enterprise Security Dashboard & Policies
            </h1>
            <p className="text-sm text-gray-500 mt-1">Configure session timeout, account lockout rules, and login security controls.</p>
          </div>
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}
        </div>

        {/* Security Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            title="Total Logins Audited" 
            value={loginAudits.length.toString()} 
            icon={Users} 
            colorClass="text-blue-600" 
            bgClass="bg-blue-50" 
          />
          <StatCard 
            title="Successful Logins" 
            value={successfulLogins.toString()} 
            icon={ShieldCheck} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50" 
          />
          <StatCard 
            title="Failed Login Attempts" 
            value={failedLogins.toString()} 
            icon={AlertTriangle} 
            colorClass="text-red-600" 
            bgClass="bg-red-50" 
          />
          <StatCard 
            title="Security Audit Events" 
            value={securityEvents.toString()} 
            icon={Key} 
            colorClass="text-purple-600" 
            bgClass="bg-purple-50" 
          />
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Session & Authentication Policy */}
            <Card title="Session & Authentication Rules">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Session Inactivity Timeout (Minutes)</label>
                  <Input 
                    type="number"
                    value={formData.sessionTimeoutMinutes}
                    onChange={e => setFormData({...formData, sessionTimeoutMinutes: parseInt(e.target.value) || 30})}
                    min="5"
                    max="120"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Automatic logout threshold on user inactivity.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Max Failed Login Attempts</label>
                  <Input 
                    type="number"
                    value={formData.maxLoginAttempts}
                    onChange={e => setFormData({...formData, maxLoginAttempts: parseInt(e.target.value) || 5})}
                    min="3"
                    max="10"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Threshold before account lock is enforced.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Lockout Duration (Minutes)</label>
                  <Input 
                    type="number"
                    value={formData.accountLockMinutes}
                    onChange={e => setFormData({...formData, accountLockMinutes: parseInt(e.target.value) || 15})}
                    min="5"
                    max="60"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Temporary lock period after repeated failures.</p>
                </div>

                <div className="flex flex-col justify-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.requireSpecialCharPassword}
                      onChange={e => setFormData({...formData, requireSpecialCharPassword: e.target.checked})}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-gray-700">Require Special Character in Password</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1">Enforce complex passwords for password resets.</p>
                </div>

              </div>
            </Card>

          </div>

          <div className="lg:col-span-1 space-y-6">
            
            <Card title="Save Security Policy">
              <div className="space-y-4 mt-4 text-sm text-gray-600">
                <p>Updating security settings will immediately apply updated session and lockout rules across the system.</p>

                <Button 
                  type="submit" 
                  isLoading={saving} 
                  className="w-full flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="w-4 h-4" /> Save Security Policies
                </Button>
              </div>
            </Card>

            <Card title="Security Status Summary">
              <div className="space-y-3 mt-3 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Session Max</span>
                  <span className="font-bold text-gray-800">{formData.sessionTimeoutMinutes} Mins</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Max Attempts</span>
                  <span className="font-bold text-gray-800">{formData.maxLoginAttempts} Tries</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Lockout Duration</span>
                  <span className="font-bold text-gray-800">{formData.accountLockMinutes} Mins</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Password Policy</span>
                  <Badge variant={formData.requireSpecialCharPassword ? 'success' : 'secondary'}>
                    {formData.requireSpecialCharPassword ? 'Strict' : 'Standard'}
                  </Badge>
                </div>
              </div>
            </Card>

          </div>

        </form>

      </div>
    </DashboardLayout>
  );
};

export default SecuritySettings;
