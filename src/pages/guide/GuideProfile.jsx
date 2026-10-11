import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useGuideAnalytics } from '@/hooks/useGuideAnalytics';
import { FirestoreService } from '@/firebase/services/firestore';
import { Loader2, User, Mail, Phone, Building2, Shield, CheckCircle, AlertTriangle, Users, Target, BookOpen, ShieldCheck } from 'lucide-react';

const formatRoleName = (roleKey) => {
  switch (String(roleKey).toLowerCase()) {
    case 'guide': return 'Project Guide';
    case 'classroom_faculty':
    case 'faculty': return 'Classroom Faculty';
    case 'reviewer': return 'Reviewer';
    case 'admin': return 'Administrator';
    case 'student': return 'Student';
    default: return roleKey;
  }
};

const GuideProfile = () => {
  const { currentUser, domainUser, availableRoles = [], activeRole, userRole, loading: authLoading } = useAuth();
  const { guides = [], dataLoading } = useData();
  const { getSupervisedTeams } = useGuideAnalytics();

  const supervisedTeams = getSupervisedTeams() || [];
  const assignedTeamsCount = supervisedTeams.length;
  const assignedStudentsCount = supervisedTeams.reduce((sum, t) => sum + (t.members?.length || 0), 0);
  const assignedProjectsCount = supervisedTeams.filter(t => t.project?.title || t.projectId).length;

  // Multi-key lookup to find guide document in data.guides
  const matchedGuide = useMemo(() => {
    if (!guides || guides.length === 0) return null;
    const lookupKeys = [
      currentUser?.email,
      domainUser?.email,
      domainUser?.employeeId,
      domainUser?.guideId,
      domainUser?.id,
      domainUser?.domainId,
      currentUser?.uid
    ].filter(Boolean).map(k => String(k).toLowerCase());

    for (const key of lookupKeys) {
      const match = guides.find(g => {
        const gEmail = String(g.email || g.Email || '').toLowerCase();
        const gEmpId = String(g.employeeId || g['Employee ID'] || g.guideId || g.id || '').toLowerCase();
        const gUid = String(g.uid || '').toLowerCase();
        return gEmail === key || gEmpId === key || gUid === key;
      });
      if (match) return match;
    }
    return null;
  }, [guides, currentUser, domainUser]);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    designation: 'Project Guide',
    employeeId: ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const src = matchedGuide || domainUser;
    if (src || currentUser) {
      const rawEmpId = src?.employeeId ?? src?.['Employee ID'] ?? domainUser?.employeeId ?? src?.guideId ?? src?.id ?? '';
      setProfile({
        name: src?.name || src?.['Guide Name'] || src?.Name || currentUser?.displayName || currentUser?.email?.split('@')[0] || '',
        email: src?.email || src?.Email || currentUser?.email || '',
        phone: src?.phone || src?.Phone || '',
        department: src?.department || src?.Department || 'Computer Science',
        designation: (src?.designation || src?.Designation) ? (src.designation || src.Designation) : 'Project Guide',
        employeeId: rawEmpId != null ? String(rawEmpId) : ''
      });
    }
  }, [domainUser, matchedGuide, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const updatePayload = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        department: profile.department.trim(),
        updatedAt: new Date().toISOString()
      };

      // Security ownership validation: Ensure guide document strictly matches authenticated user
      const authorizedEmpId = domainUser?.employeeId || matchedGuide?.employeeId;
      const targetGuideId = matchedGuide?.id || (authorizedEmpId ? String(authorizedEmpId) : null);

      if (targetGuideId) {
        const isMatchedValid = matchedGuide ? (
          (matchedGuide.email && matchedGuide.email.toLowerCase() === currentUser?.email?.toLowerCase()) ||
          (matchedGuide.uid && matchedGuide.uid === currentUser?.uid) ||
          (authorizedEmpId && String(matchedGuide.employeeId || matchedGuide.id) === String(authorizedEmpId))
        ) : true;

        if (!isMatchedValid) {
          throw new Error("Security violation: You can only update your own evaluator profile.");
        }

        await FirestoreService.set('guides', targetGuideId, updatePayload, { merge: true });
      }

      if (currentUser?.uid) {
        await FirestoreService.set('users', currentUser.uid, updatePayload, { merge: true });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating guide profile:", err);
      setError("Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  const displayRoles = useMemo(() => {
    const roles = (domainUser?.availableRoles && domainUser.availableRoles.length > 0)
      ? domainUser.availableRoles
      : (availableRoles && availableRoles.length > 0 ? availableRoles : [activeRole || userRole || 'guide']);
    return [...new Set(roles)];
  }, [domainUser, availableRoles, activeRole, userRole]);

  if ((authLoading || (dataLoading && guides.length === 0)) && !domainUser) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Profile">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Profile">
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Guide Profile & Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your supervisor details and account preferences.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <div className="flex flex-col items-center p-4 text-center">
                <div className="w-24 h-24 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm font-bold text-xl">
                  <User className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">{profile.name || 'Guide Profile'}</h3>
                <p className="text-sm font-medium text-gray-500 mb-3">{profile.designation}</p>
                <Badge variant="primary" className="w-full justify-center py-1.5 font-mono text-xs font-bold">
                  ID: {profile.employeeId ? String(profile.employeeId).toUpperCase() : 'GUIDE'}
                </Badge>

                {/* Assigned Evaluator Roles */}
                <div className="w-full mt-4 pt-4 border-t border-gray-100 text-left">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Roles</label>
                  <div className="flex flex-wrap gap-1.5">
                    {displayRoles.map(r => (
                      <Badge 
                        key={r} 
                        variant={r === (activeRole || 'guide') ? 'primary' : 'secondary'} 
                        className="text-[11px] font-semibold"
                      >
                        {formatRoleName(r)} {r === (activeRole || 'guide') ? ' (Active)' : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Supervision Statistics">
              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
                  <Users className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 uppercase font-semibold">Teams</p>
                  <p className="text-lg font-bold text-gray-900">{assignedTeamsCount}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <User className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 uppercase font-semibold">Students</p>
                  <p className="text-lg font-bold text-gray-900">{assignedStudentsCount}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <Target className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 uppercase font-semibold">Projects</p>
                  <p className="text-lg font-bold text-gray-900">{assignedProjectsCount}</p>
                </div>
              </div>
            </Card>

            <Card title="Security & Device">
              <div className="space-y-4 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/devices'}
                  className="w-full flex justify-center items-center gap-2 text-sm text-gray-700 border-gray-300"
                >
                  <Shield className="w-4 h-4" /> Account Security & Sessions
                </Button>
              </div>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card title="Personal Information">
              <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                {success && (
                  <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm flex items-center gap-2 mb-4">
                    <CheckCircle className="w-4 h-4" />
                    Profile updated successfully!
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="profileName"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className="pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="profileEmail"
                        name="email"
                        value={profile.email}
                        disabled
                        className="pl-10 bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="profilePhone"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        className="pl-10 text-sm"
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Department</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="profileDepartment"
                        name="department"
                        value={profile.department}
                        onChange={handleChange}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-5 border-t border-gray-100 mt-6">
                  <Button type="submit" disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default GuideProfile;
