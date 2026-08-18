import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { FirestoreService } from '@/firebase/services/firestore';
import { Loader2, User, Mail, Phone, Building2, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const GuideProfile = () => {
  const { currentUser, domainUser } = useAuth();
  const { getGuideById, dataLoading } = useData();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: 'Project Guide',
    employeeId: ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (domainUser) {
      setProfile({
        name: domainUser.name || '',
        email: domainUser.email || currentUser?.email || '',
        phone: domainUser.phone || '',
        department: domainUser.department || 'Computer Science',
        designation: domainUser.designation || 'Project Guide',
        employeeId: domainUser.employeeId || domainUser.guideId || domainUser.id || 'G001'
      });
    } else if (currentUser?.uid && !dataLoading) {
      const guideData = getGuideById(currentUser.uid);
      if (guideData) {
        setProfile({
          name: guideData.name || '',
          email: guideData.email || currentUser.email,
          phone: guideData.phone || '',
          department: guideData.department || 'Computer Science',
          designation: guideData.designation || 'Project Guide',
          employeeId: guideData.employeeId || guideData.id
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email: currentUser.email || '',
          name: currentUser.displayName || currentUser.email.split('@')[0]
        }));
      }
    }
  }, [domainUser, currentUser, getGuideById, dataLoading]);

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
      if (domainUser?.id) {
        await FirestoreService.updateDocument('guides', domainUser.id, {
          name: profile.name,
          phone: profile.phone,
          department: profile.department,
          updatedAt: new Date().toISOString()
        });
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

  if (dataLoading && !domainUser) {
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
              <div className="flex flex-col items-center p-4">
                <div className="w-24 h-24 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm font-bold text-xl">
                  <User className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">{profile.name || 'Guide Profile'}</h3>
                <p className="text-sm font-medium text-gray-500 mb-4">{profile.designation}</p>
                <Badge variant="primary" className="w-full justify-center py-1.5 font-mono">
                  ID: {profile.employeeId ? profile.employeeId.toUpperCase() : 'GUIDE'}
                </Badge>
              </div>
            </Card>

            <Card title="Security & Device">
              <div className="space-y-4 pt-2">
                <Button variant="outline" className="w-full flex justify-center items-center gap-2 text-sm text-gray-700 border-gray-300">
                  <Shield className="w-4 h-4" /> Manage MFA & Security
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
