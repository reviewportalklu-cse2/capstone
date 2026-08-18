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
import { ShieldCheck, Lock, Smartphone, Clock, AlertTriangle, Users, Save, CheckCircle2, Loader2, Key } from 'lucide-react';

const SecuritySettings = () => {
  const { settings, auditLogs, dataLoading } = useData();
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    mfaEnabled: true,
    mandatoryRoles: ['admin', 'guide', 'classroom_faculty', 'reviewer'],
    trustedDeviceDays: 30,
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
          ...secDoc
        }));
      }
    }
  }, [settings]);

  const handleRoleToggle = (roleKey) => {
    setFormData(prev => ({
      ...prev,
      mandatoryRoles: prev.mandatoryRoles.includes(roleKey)
        ? prev.mandatoryRoles.filter(r => r !== roleKey)
        : [...prev.mandatoryRoles, roleKey]
    }));
  };

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

      await FirestoreService.set('settings', 'security', payload);

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
  const failedLogins = auditLogs.filter(a => a.action === 'LOGIN_FAILED' || a.action === 'MFA_OTP_FAILED').length;
  const mfaVerifications = auditLogs.filter(a => a.action === 'MFA_OTP_VERIFIED').length;
  const trustedDeviceEvents = auditLogs.filter(a => a.action === 'TRUSTED_DEVICE_ADDED').length;

  return (
    <DashboardLayout navigationItems={adminNavigation} title="Security Settings">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary-600" /> Enterprise Security Dashboard & Policies
            </h1>
            <p className="text-sm text-gray-500 mt-1">Configure Multi-Factor Authentication (MFA), device trust, and login security controls.</p>
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
            title="Failed Login Attempts" 
            value={failedLogins.toString()} 
            icon={AlertTriangle} 
            colorClass="text-red-600" 
            bgClass="bg-red-50" 
          />
          <StatCard 
            title="MFA Verifications" 
            value={mfaVerifications.toString()} 
            icon={ShieldCheck} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50" 
          />
          <StatCard 
            title="Active Trusted Devices" 
            value={trustedDeviceEvents.toString()} 
            icon={Smartphone} 
            colorClass="text-purple-600" 
            bgClass="bg-purple-50" 
          />
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* MFA Policy Configuration */}
            <Card title="Multi-Factor Authentication (MFA) Policies">
              <div className="space-y-6 mt-4">
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Global MFA Status</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Enforce two-factor security verification on login</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.mfaEnabled} 
                      onChange={e => setFormData({...formData, mfaEnabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Mandatory MFA Roles</label>
                  <p className="text-xs text-gray-500 mb-3">Roles selected below will be required to pass 6-digit OTP verification upon login.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'admin', label: 'Admin' },
                      { key: 'guide', label: 'Guide / Mentor' },
                      { key: 'classroom_faculty', label: 'Faculty' },
                      { key: 'reviewer', label: 'Reviewer' },
                      { key: 'student', label: 'Student' }
                    ].map(item => {
                      const isMandatory = formData.mandatoryRoles.includes(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleRoleToggle(item.key)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between h-20 ${
                            isMandatory ? 'bg-primary-50 border-primary-300 text-primary-900 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className={`text-[10px] uppercase tracking-wider font-extrabold ${isMandatory ? 'text-primary-700' : 'text-gray-400'}`}>
                            {isMandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </Card>

            {/* Trusted Device & Session Policy */}
            <Card title="Device Trust & Session Rules">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Trusted Device Duration (Days)</label>
                  <Input 
                    type="number"
                    value={formData.trustedDeviceDays}
                    onChange={e => setFormData({...formData, trustedDeviceDays: parseInt(e.target.value) || 30})}
                    min="1"
                    max="90"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Number of days a recognized browser can bypass OTP.</p>
                </div>

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
                  <label className="block text-xs font-bold text-gray-700 mb-1">Max OTP Failed Attempts</label>
                  <Input 
                    type="number"
                    value={formData.maxLoginAttempts}
                    onChange={e => setFormData({...formData, maxLoginAttempts: parseInt(e.target.value) || 5})}
                    min="3"
                    max="10"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Threshold before active OTP session is locked.</p>
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

              </div>
            </Card>

          </div>

          <div className="lg:col-span-1 space-y-6">
            
            <Card title="Save Security Policy">
              <div className="space-y-4 mt-4 text-sm text-gray-600">
                <p>Updating security settings will immediately apply updated MFA enforcement and device trust rules across the system.</p>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Mandatory MFA changes will take effect on next login for affected user roles.</span>
                </div>

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
                  <span className="text-gray-500">MFA Policy</span>
                  <Badge variant={formData.mfaEnabled ? 'success' : 'warning'}>
                    {formData.mfaEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Enforced Roles</span>
                  <span className="font-bold text-gray-800">{formData.mandatoryRoles.length} Roles</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Device Bypass</span>
                  <span className="font-bold text-gray-800">{formData.trustedDeviceDays} Days</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Session Max</span>
                  <span className="font-bold text-gray-800">{formData.sessionTimeoutMinutes} Mins</span>
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
