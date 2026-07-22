import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/firebase/services/studentService';
import { guideService } from '@/firebase/services/guideService';
import { Loader2, UserCheck, Mail, Phone, Book, Clock } from 'lucide-react';

const MyGuide = () => {
  const { currentUser } = useAuth();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchGuide(currentUser.uid);
    }
  }, [currentUser]);

  const fetchGuide = async (uid) => {
    try {
      setLoading(true);
      const studentData = await studentService.getById(uid);
      if (studentData?.guideId) {
        const guideData = await guideService.getById(studentData.guideId);
        setGuide(guideData);
      }
    } catch (err) {
      console.error('Error fetching guide:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - My Guide">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!guide) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - My Guide">
        <div className="p-6 max-w-4xl mx-auto py-12">
          <EmptyState 
            icon={UserCheck}
            title="No Guide Assigned" 
            description="You have not been assigned to a guide yet. This process is usually handled by the administrator." 
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - My Guide">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary-600" /> My Assigned Guide
          </h1>
          <p className="text-sm text-gray-500 mt-1">Information regarding your official project mentor.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-t-4 border-t-primary-500">
            <div className="flex flex-col items-center text-center pt-4">
              <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl mb-4 shadow-sm border-4 border-white ring-1 ring-gray-100 uppercase">
                {guide.name ? guide.name.charAt(0) : 'G'}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{guide.name || 'Guide Name'}</h2>
              <p className="text-sm font-medium text-primary-600 mb-6">{guide.designation || 'Faculty Member'}</p>
              
              <div className="w-full flex justify-between items-center py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500 flex items-center"><Book className="h-4 w-4 mr-2" /> Department</span>
                <span className="text-sm font-medium text-gray-900">{guide.department || 'N/A'}</span>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card title="Contact Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Email Address</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{guide.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Phone Number</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{guide.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Upcoming Meetings">
              <div className="mt-4 border border-dashed border-gray-300 rounded-lg py-8 flex flex-col items-center text-center bg-gray-50">
                <Clock className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900">No scheduled meetings</p>
                <p className="text-xs text-gray-500 mt-1">Your guide has not scheduled any upcoming formal reviews.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyGuide;
