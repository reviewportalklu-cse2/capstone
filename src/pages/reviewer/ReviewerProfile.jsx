import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { reviewerService } from '@/firebase/services/reviewerService';
import { Loader2, UserCog, Save, CheckCircle, AlertCircle } from 'lucide-react';

const ReviewerProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    designation: '',
    phone: '',
    employeeId: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProfile(currentUser.uid);
    }
  }, [currentUser]);

  const fetchProfile = async (uid) => {
    try {
      setLoading(true);
      const data = await reviewerService.getById(uid);
      if (data) {
        setFormData({
          name: data.name || '',
          email: data.email || currentUser.email || '',
          department: data.department || '',
          designation: data.designation || '',
          phone: data.phone || '',
          employeeId: data.employeeId || ''
        });
      } else {
        setFormData(prev => ({ ...prev, email: currentUser.email || '' }));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const dataToSave = { ...formData, id: currentUser.uid, updatedAt: new Date().toISOString() };
      
      const exists = await reviewerService.getById(currentUser.uid);
      if (exists) {
        await reviewerService.update(currentUser.uid, dataToSave);
      } else {
        await reviewerService.create({ ...dataToSave, id: currentUser.uid });
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Profile update failed:", err);
      setError("Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - Profile">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary-600" /> My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your professional details and contact information.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-200">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <Input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Dr. Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <Input 
                  disabled
                  value={formData.email}
                  className="bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">Email is synchronized with Firebase Authentication.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <Input 
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  placeholder="e.g. EMP-9021"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                >
                  <option value="">-- Select Department --</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="External">External Assessor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <Input 
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  placeholder="e.g. Senior Reviewer"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitting ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReviewerProfile;
