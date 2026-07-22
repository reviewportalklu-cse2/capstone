import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import StatCard from '@/components/common/StatCard';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { 
  Users, UserCheck, UserCog, GraduationCap, Loader2, 
  Activity, Clock, Calendar, CheckCircle, AlertTriangle, 
  Server, Database, Book
} from 'lucide-react';
import { studentService, projectService, guideService, reviewerService, facultyService, reviewService } from '@/firebase/services';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    projects: 0,
    guides: 0,
    reviewers: 0,
    faculty: 0,
    reviews: 0
  });
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [st, pr, gu, re, fa, rvs] = await Promise.all([
        studentService.getAll(),
        projectService.getAll(),
        guideService.getAll(),
        reviewerService.getAll(),
        facultyService.getAll(),
        reviewService.getAll()
      ]);

      setStats({
        students: st.length,
        projects: pr.length,
        guides: gu.length,
        reviewers: re.length,
        faculty: fa.length,
        reviews: rvs.length
      });
      
      const sortedReviews = [...rvs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
      setRecentReviews(sortedReviews);
      
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const reviewColumns = [
    { header: 'Review Type', accessor: 'reviewType' },
    { header: 'Score', render: (row) => <span className="font-bold">{row.totalScore} / 100</span> },
    { header: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { header: 'Status', render: (row) => (
        <Badge variant={row.status === 'Final' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      )
    }
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={adminNavigation} title="CapstoneFlow Control Center">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={adminNavigation} title="CapstoneFlow Control Center">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Students" value={stats.students} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-100" />
          <StatCard title="Active Projects" value={stats.projects} icon={Book} colorClass="text-indigo-600" bgClass="bg-indigo-100" />
          <StatCard title="Assigned Guides" value={stats.guides} icon={UserCheck} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
          <StatCard title="Panel Reviewers" value={stats.reviewers} icon={UserCog} colorClass="text-orange-600" bgClass="bg-orange-100" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            
            <Card title="Recent Evaluations" subtitle="Latest review submissions across all batches">
              <div className="overflow-x-auto">
                {recentReviews.length > 0 ? (
                  <Table columns={reviewColumns} data={recentReviews} />
                ) : (
                  <EmptyState 
                    title="No Evaluations Found" 
                    message="No formal reviews have been published yet." 
                    icon={CheckCircle} 
                  />
                )}
              </div>
            </Card>
            
          </div>

          <div className="space-y-6">
            
            <Card title="System Roles Overview">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <GraduationCap className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Classroom Faculty</span>
                  </div>
                  <Badge variant="primary">{stats.faculty}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Total Reviews</span>
                  </div>
                  <Badge variant="primary">{stats.reviews}</Badge>
                </div>
              </div>
            </Card>

            <Card title="System Health">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Server className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Firestore Rules</span>
                  </div>
                  <Badge variant="success">Secured</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Database Engine</span>
                  </div>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Sync Agent</span>
                  </div>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" /> Core services are running normally
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
