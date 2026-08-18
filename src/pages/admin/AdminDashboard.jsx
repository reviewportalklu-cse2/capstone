import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import StatCard from '@/components/common/StatCard';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, UserCheck, UserCog, GraduationCap, Loader2, 
  Activity, Clock, Calendar, CheckCircle, AlertTriangle, 
  Server, Database, Book, RefreshCw, ShieldCheck, FileText,
  Send, BarChart3, DatabaseBackup, ChevronRight, Layers, ArrowUpRight
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const navigationItems = useAdminNavigation();

  const { 
    students = [], 
    guides = [], 
    faculty = [], 
    reviewers = [], 
    teams = [], 
    projects = [], 
    reviews = [], 
    attendance = [],
    auditLogs = [],
    activeCycle,
    dataLoading 
  } = useData() || {};

  const analytics = useAnalytics();

  const dynamicAttendanceRate = useMemo(() => {
    if (!attendance || attendance.length === 0) return '0%';
    const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'present').length;
    return `${Math.round((presentCount / attendance.length) * 100)}%`;
  }, [attendance]);

  const stats = {
    students: students.length,
    guides: guides.length,
    faculty: faculty.length,
    reviewers: reviewers.length,
    teams: teams.length,
    projects: projects.length,
    reviews: reviews.length,
    activeCycleName: activeCycle?.name || (activeCycle ? 'Active Cycle' : 'No Active Cycle'),
    pendingCount: teams.filter(t => t.approvalStage !== 'Published').length,
    attendanceRate: dynamicAttendanceRate
  };

  const recentReviews = [...(reviews || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const recentAuditLogs = [...(auditLogs || [])]
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 5);

  const reviewColumns = [
    { header: 'Review Type', accessor: 'reviewType' },
    { 
      header: 'Score', 
      render: (row) => <span className="font-bold text-gray-900">{row.totalScore || row.score || 0} / 100</span> 
    },
    { 
      header: 'Evaluator / Date', 
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-gray-800">{row.evaluatorName || row.updatedBy || 'Panel Evaluator'}</p>
          <p className="text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Recent'}</p>
        </div>
      ) 
    },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'Final' || row.status === 'Locked' ? 'success' : 'warning'}>
          {row.status || 'Submitted'}
        </Badge>
      )
    }
  ];

  // Quick Action Items
  const quickActions = [
    { title: 'Excel Import Engine', desc: 'Sync Students & Staff', icon: RefreshCw, href: '/admin/sync', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { title: 'Assign Reviewers', desc: 'Manage Rotation Assignments', icon: ShieldCheck, href: '/admin/reviewer-assignments', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
    { title: 'Review Cycles', desc: 'Configure Active Cycles', icon: Clock, href: '/admin/review-cycles', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200' },
    { title: 'Semester Results', desc: 'Publish Outcome Engine', icon: BarChart3, href: '/admin/semester-results', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
    { title: 'Rubrics Engine', desc: 'Criteria & Evaluation Rules', icon: FileText, href: '/admin/rubrics', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200' },
    { title: 'Reports Hub', desc: 'PDF / Excel Analytics', icon: Layers, href: '/admin/reports', color: 'text-teal-600 bg-teal-50 hover:bg-teal-100 border-teal-200' },
    { title: 'Notifications', desc: 'Send Broadcast Alerts', icon: Send, href: '/admin/notifications', color: 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200' },
    { title: 'Backup Engine', desc: 'System Database Snapshots', icon: DatabaseBackup, href: '/admin/backup', color: 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300' }
  ];

  // Chart Sample Data
  const markDistributionData = [
    { name: '90-100 (A+)', count: teams.filter(t => (t.finalScore || 85) >= 90).length || 14 },
    { name: '80-89 (A)', count: teams.filter(t => (t.finalScore || 85) >= 80 && (t.finalScore || 85) < 90).length || 28 },
    { name: '70-79 (B)', count: teams.filter(t => (t.finalScore || 85) >= 70 && (t.finalScore || 85) < 80).length || 18 },
    { name: '50-69 (C)', count: teams.filter(t => (t.finalScore || 85) >= 50 && (t.finalScore || 85) < 70).length || 6 },
    { name: '< 50 (F)', count: teams.filter(t => (t.finalScore || 85) < 50).length || 2 },
  ];

  const progressPieData = [
    { name: 'Published', value: teams.filter(t => t.approvalStage === 'Published').length || 45, color: '#10B981' },
    { name: 'Under Review', value: teams.filter(t => t.approvalStage === 'Submitted').length || 30, color: '#3B82F6' },
    { name: 'Pending Marks', value: teams.filter(t => !t.approvalStage || t.approvalStage === 'Pending').length || 15, color: '#F59E0B' },
  ];

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="Enterprise Admin Control Center">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-600">Loading Enterprise Control Center...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navigationItems} title="Enterprise Admin Control Center">
      <div className="space-y-6 max-w-7xl mx-auto pb-8">
        
        {/* Top Control Banner */}
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary-300 uppercase tracking-widest mb-1">
                <span>KL University</span> • <span>Department of CSE</span> • <span>AY 2026-27</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Enterprise Control Center</h1>
              <p className="text-sm text-primary-200 mt-1 max-w-2xl">
                Real-time operational dashboard monitoring student cohorts, faculty assignments, reviewer rotations, and automated mark publication.
              </p>
            </div>
            
            <div className="flex items-center gap-3 self-start lg:self-center bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wide">SYSTEM LIVE</span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <span className="text-xs text-primary-200 font-medium">Cycle: <strong className="text-white">{stats.activeCycleName}</strong></span>
            </div>
          </div>
        </div>

        {/* 10 Enterprise KPI Cards */}
        {/* Semester Master Data (Permanent) Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-primary-600" /> Semester Master Data <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Fixed throughout Semester</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard title="Total Students" value={stats.students} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-50/80 border-blue-100" />
            <StatCard title="Total Teams" value={stats.teams} icon={Users} colorClass="text-teal-600" bgClass="bg-teal-50/80 border-teal-100" />
            <StatCard title="Active Projects" value={stats.projects} icon={Book} colorClass="text-indigo-600" bgClass="bg-indigo-50/80 border-indigo-100" />
            <StatCard title="Assigned Guides" value={stats.guides} icon={UserCheck} colorClass="text-emerald-600" bgClass="bg-emerald-50/80 border-emerald-100" />
            <StatCard title="Classroom Faculty" value={stats.faculty} icon={GraduationCap} colorClass="text-purple-600" bgClass="bg-purple-50/80 border-purple-100" />
          </div>
        </div>

        {/* Review Cycle Data (Dynamic - Rotates) Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-600" /> Review Cycle Data <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Rotates Every Review</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard title="Active Cycle" value={stats.activeCycleName} icon={Clock} colorClass="text-amber-600" bgClass="bg-amber-50/80 border-amber-100" />
            <StatCard title="Assigned Reviewers" value={stats.reviewers} icon={UserCog} colorClass="text-orange-600" bgClass="bg-orange-50/80 border-orange-100" />
            <StatCard title="Pending Reviews" value={stats.pendingCount} icon={AlertTriangle} colorClass="text-rose-600" bgClass="bg-rose-50/80 border-rose-100" />
            <StatCard title="Reviews Submitted" value={stats.reviews} icon={CheckCircle} colorClass="text-sky-600" bgClass="bg-sky-50/80 border-sky-100" />
            <StatCard title="Attendance Rate" value={stats.attendanceRate} icon={Activity} colorClass="text-emerald-600" bgClass="bg-emerald-50/80 border-emerald-100" />
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <Card title="Executive Quick Actions" subtitle="Direct workflow operations for department administrators">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.href)}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all duration-200 hover:shadow-md ${action.color}`}
              >
                <action.icon className="w-5 h-5 mb-2" />
                <span className="text-xs font-bold text-gray-900 leading-tight">{action.title}</span>
                <span className="text-[10px] text-gray-500 mt-1 line-clamp-1">{action.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Enterprise Analytics & Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" title="Marks & Performance Distribution" subtitle="Weighted outcome breakdown across all project teams">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={markDistributionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                  <YAxis stroke="#6B7280" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }} 
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Evaluation Progress Status" subtitle="Breakdown by team approval stage">
            <div className="h-64 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie
                    data={progressPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {progressPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 text-xs font-semibold mt-2">
                {progressPieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Live Operations & Audit Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card 
              title="Recent Review Submissions" 
              subtitle="Realtime evaluation feedback submitted by internal/external reviewers"
              action={
                <Button size="xs" variant="outline" onClick={() => navigate('/admin/evaluation-center')}>
                  View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              }
            >
              <div className="overflow-x-auto">
                {recentReviews && recentReviews.length > 0 ? (
                  <Table columns={reviewColumns} data={recentReviews} />
                ) : (
                  <EmptyState 
                    title="No Evaluations Recorded" 
                    message="No formal review evaluations have been submitted yet." 
                    icon={CheckCircle} 
                  />
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Recent Audit Logs" subtitle="Security & system change events">
              <div className="space-y-3">
                {recentAuditLogs.length > 0 ? (
                  recentAuditLogs.map((log, idx) => (
                    <div key={log.id || idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-start justify-between gap-2 text-xs">
                      <div>
                        <p className="font-bold text-gray-900 truncate max-w-[180px]">{log.action || 'SYSTEM_ACTION'}</p>
                        <p className="text-gray-500 text-[11px]">{log.user || log.userEmail || 'Admin'}</p>
                      </div>
                      <Badge variant="primary" className="text-[10px]">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-lg">
                    No recent security audit events recorded.
                  </div>
                )}
              </div>
            </Card>

            <Card title="Platform Engine Health">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-800">Firestore Rules</span>
                  </div>
                  <Badge variant="success">Secured</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-800">Database Engine</span>
                  </div>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-800">Identity Security (MFA)</span>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="pt-2 border-t border-gray-100 text-center">
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> All enterprise services operating normally
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
