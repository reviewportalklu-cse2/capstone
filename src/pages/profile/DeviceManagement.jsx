import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Table from '@/components/common/Table';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { mfaService } from '@/firebase/services/mfaService';
import { adminNavigation, guideNavigation, facultyNavigation, reviewerNavigation, studentNavigation } from '@/constants/navigation';
import { ShieldCheck, Smartphone, Monitor, Trash2, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const DeviceManagement = () => {
  const { currentUser, activeRole, userRole } = useAuth();
  const currentRole = activeRole || userRole;

  const [trustedDevices, setTrustedDevices] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (currentUser?.uid) {
      loadSecurityData(currentUser.uid);
    }
  }, [currentUser]);

  const loadSecurityData = async (uid) => {
    setLoading(true);
    try {
      const [devices, history] = await Promise.all([
        mfaService.getTrustedDevices(uid),
        mfaService.getLoginHistory(uid)
      ]);
      setTrustedDevices(devices);
      setLoginHistory(history);
    } catch (err) {
      console.error("Error loading device security data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this trusted device? You will be asked for an OTP on your next login from this browser.")) return;
    
    setActionLoading(id);
    try {
      await mfaService.removeTrustedDevice(id, currentUser.uid);
      setTrustedDevices(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Error revoking device:", err);
      alert("Failed to revoke device.");
    } finally {
      setActionLoading(null);
    }
  };

  // Determine navigation based on activeRole
  const navItems = React.useMemo(() => {
    switch(currentRole) {
      case 'admin': return adminNavigation;
      case 'guide': return guideNavigation;
      case 'classroom_faculty':
      case 'faculty': return facultyNavigation;
      case 'reviewer': return reviewerNavigation;
      default: return studentNavigation;
    }
  }, [currentRole]);

  const deviceColumns = [
    { 
      header: 'Device & Browser', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{row.browser || 'Recognized Browser'}</p>
            <p className="text-xs text-gray-400">ID: {row.deviceId ? row.deviceId.substring(0, 12) + '...' : 'Unknown'}</p>
          </div>
        </div>
      ) 
    },
    { 
      header: 'Trusted Since', 
      render: (row) => <span className="text-xs text-gray-600 font-medium">{new Date(row.trustedAt).toLocaleDateString()}</span> 
    },
    { 
      header: 'Expires On', 
      render: (row) => <span className="text-xs text-gray-600 font-medium">{new Date(row.expiresAt).toLocaleDateString()}</span> 
    },
    { 
      header: 'Status', 
      render: (row) => {
        const isCurrent = row.deviceId === mfaService.getDeviceId();
        return (
          <Badge variant={isCurrent ? 'success' : 'secondary'}>
            {isCurrent ? 'This Device' : 'Trusted'}
          </Badge>
        );
      } 
    },
    { 
      header: 'Actions', 
      render: (row) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleRevokeDevice(row.id)}
          isLoading={actionLoading === row.id}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Revoke
        </Button>
      ) 
    }
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={navItems} title="Device Security">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navItems} title="Device Security">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary-600" /> Device Management & Security History
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage trusted devices authorized to bypass two-factor authentication.</p>
        </div>

        {/* Current Active Session Info */}
        <Card title="Current Session Identity">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary-50/50 rounded-xl border border-primary-100 gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-xl text-primary-700">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{mfaService.getBrowserInfo()}</h4>
                <p className="text-xs text-gray-500 mt-0.5">Authenticated as {currentUser?.email} ({currentRole})</p>
              </div>
            </div>
            <Badge variant="success" className="px-3 py-1 text-xs">Active Session</Badge>
          </div>
        </Card>

        {/* Recognized Trusted Devices */}
        <Card title="Recognized Trusted Devices">
          {trustedDevices.length === 0 ? (
            <div className="py-8">
              <EmptyState 
                icon={Smartphone}
                title="No Trusted Devices"
                description="You do not have any saved trusted devices. Check 'Trust this device for 30 days' during MFA login to save a browser."
              />
            </div>
          ) : (
            <Table columns={deviceColumns} data={trustedDevices} />
          )}
        </Card>

        {/* Recent Login History */}
        <Card title="Recent Login & Authentication Events">
          {loginHistory.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No recent login events recorded.</p>
          ) : (
            <div className="divide-y divide-gray-100 mt-2">
              {loginHistory.slice(0, 10).map((evt, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-full ${evt.success !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {evt.success !== false ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{evt.action || (evt.success !== false ? 'Successful Login' : 'Failed Login Attempt')}</p>
                      <p className="text-gray-400">{evt.browser || 'Standard Browser'}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 font-mono">
                    {new Date(evt.loginTime || evt.logoutTime || evt.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default DeviceManagement;
