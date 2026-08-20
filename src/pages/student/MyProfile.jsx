import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { studentService } from '@/firebase/services/studentService';
import { Loader2, UserCog, Save, CheckCircle, AlertCircle, Hash, Book, Award, Users, Target, Clock } from 'lucide-react';

const MyProfile = () => {
  const { currentUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: '',
    section: '',
    batch: '',
    semester: '',
    phone: ''
  });

  const { 
    student, team, project, guide, classroomFaculty, 
    dashboardStats, dataLoading 
  } = useStudentAnalytics();

  useEffect(() => {
    if (dataLoading || !currentUser?.uid) return;
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || currentUser.email || '',
        rollNumber: student.rollNo || student.rollNumber || '',
        department: student.department || '',
        section: student.section || '',
        batch: student.batch || '',
        semester: student.semester || '',
        phone: student.phone || ''
      });
    } else {
      setFormData(prev => ({ ...prev, email: currentUser.email || '' }));
    }
  }, [currentUser, student, dataLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const dataToSave = { ...formData, updatedAt: new Date().toISOString() };
      
      const exists = await studentService.getById(currentUser.uid);
      if (exists) {
        await studentService.update(currentUser.uid, dataToSave);
      } else {
        await studentService.create({ ...dataToSave, id: currentUser.uid });
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

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="My Profile">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={studentNavigation} title="My Profile">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary-600" /> My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal details and view your comprehensive academic standing.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-t-4 border-t-primary-500 shadow-sm">
              <div className="flex flex-col items-center text-center pt-4">
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl mb-4 shadow-sm border-4 border-white ring-1 ring-gray-100 uppercase">
                  {formData.name ? formData.name.charAt(0) : 'S'}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{formData.name || 'Student'}</h2>
                <p className="text-sm text-gray-500 mb-2">{formData.email}</p>
                <Badge variant="primary" className="mb-6">{team?.id || 'Unassigned'}</Badge>
                
                <div className="w-full flex justify-between items-center py-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Hash className="h-4 w-4" /> Roll No</span>
                  <span className="text-sm font-medium text-gray-900">{formData.rollNumber || 'N/A'}</span>
                </div>
                <div className="w-full flex justify-between items-center py-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Book className="h-4 w-4" /> Dept</span>
                  <span className="text-sm font-medium text-gray-900">{formData.department || 'N/A'}</span>
                </div>
              </div>
            </Card>

            <Card title="Academic Mentorship" className="shadow-sm">
              <div className="space-y-4 mt-2">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><UserCog className="w-4 h-4 text-blue-500"/> Guide</span>
                  <span className="text-sm font-bold text-gray-900">{guide?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500"/> Faculty</span>
                  <span className="text-sm font-bold text-gray-900">{classroomFaculty?.name || 'N/A'}</span>
                </div>
              </div>
            </Card>

            <Card title="Progress Snapshot" className="shadow-sm bg-gray-50 border border-gray-200">
              <div className="space-y-3 mt-2">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Progress</span>
                    <Badge variant="primary">{dashboardStats?.progressPercent || 0}%</Badge>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${dashboardStats?.progressPercent || 0}%` }}></div>
                 </div>
                 
                 <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Attendance</span>
                    <Badge variant={dashboardStats?.attendancePercent >= 75 ? 'success' : 'danger'}>{dashboardStats?.attendancePercent || 0}%</Badge>
                 </div>
                 
                 <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Current Standing</span>
                    <span className="font-bold text-gray-900">{dashboardStats?.currentGrade || 'N/A'}</span>
                 </div>
              </div>
            </Card>
          </div>

          <Card className="lg:col-span-2 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Personal Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <Input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <Input 
                    disabled
                    value={formData.email}
                    className="bg-gray-50 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <Input 
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
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
                  <Input 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <Input 
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    placeholder="e.g. A"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  >
                    <option value="">-- Select Semester --</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <Input 
                    value={formData.batch}
                    onChange={(e) => setFormData({...formData, batch: e.target.value})}
                    placeholder="e.g. 2024-2025"
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
      </div>
    </DashboardLayout>
  );
};

export default MyProfile;
