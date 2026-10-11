import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/firebase/services/auditService';
import { adminNavigation, guideNavigation, facultyNavigation, reviewerNavigation, studentNavigation } from '@/constants/navigation';
import { ShieldCheck, Smartphone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const DeviceManagement = () => {
  const { currentUser, activeRole, userRole } = useAuth();
  const currentRole = activeRole || userRole;

  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      loadSecurityData(currentUser.uid);
    }
  }, [currentUser]);

  const loadSecurityData = async (uid) => {
    setLoading(true);
    try {
      const history = await auditService.getLoginHistory(uid);
      setLoginHistory(history);
    } catch (err) {
      console.error("Error loading device security data:", err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <DashboardLayout navigationItems={navItems} title="Device & Session Security">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navItems} title="Device & Session Security">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary-600" /> Device & Session Activity
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review active browser environment and authenticated session history.</p>
        </div>

        {/* Current Active Session Info */}
        <Card title="Current Session Identity">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary-50/50 rounded-xl border border-primary-100 gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-xl text-primary-700">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{auditService.getBrowserInfo()}</h4>
                <p className="text-xs text-gray-500 mt-0.5">Authenticated as {currentUser?.email} ({currentRole})</p>
              </div>
            </div>
            <Badge variant="success" className="px-3 py-1 text-xs">Active Session</Badge>
          </div>
        </Card>

        {/* Recent Login History */}
        <Card title="Recent Authentication & Login Events">
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
