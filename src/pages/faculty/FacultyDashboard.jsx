import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { facultyNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ClipboardList, CheckCircle, Clock, Loader2, AlertCircle, TrendingUp, BookOpen, UserCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { studentService } from '@/firebase/services/studentService';
import { facultyService } from '@/firebase/services/facultyService';
import { FirestoreService } from '@/firebase/services/firestore';

const FacultyDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [facultyData, setFacultyData] = useState(null);
  const [students, setStudents] = useState([]);
  
  // Custom workload state
  const [workload, setWorkload] = useState({
    totalAssigned: 0,
    evaluated: 0,
    pending: 0,
    upcomingDeadlines: 0,
  });

  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const uid = currentUser.uid;
    const unsubs = [];
    
    setLoading(true);
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 2) setLoading(false);
    };

    facultyService.getById(uid).then(faculty => {
      setFacultyData(faculty);
      checkLoaded();
    }).catch(err => {
      console.error(err);
      checkLoaded();
    });

    unsubs.push(FirestoreService.subscribeQuery('students', [{ field: 'facultyId', operator: '==', value: uid }], (myStudents) => {
      let evaluated = 0;
      let pending = 0;
      
      const enrichedStudents = myStudents.map(s => {
        const hasMarks = Math.random() > 0.4;
        if (hasMarks) evaluated++;
        else pending++;
        return { 
          ...s, 
          status: hasMarks ? 'Evaluated' : 'Pending',
          lastUpdate: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString()
        };
      });

      setWorkload({
        totalAssigned: myStudents.length,
        evaluated,
        pending,
        upcomingDeadlines: Math.floor(Math.random() * 5) + 1
      });

      setStudents(enrichedStudents);

      // Dummy data for performance distribution
      setPerformanceData([
        { range: '0-40', count: Math.floor(Math.random() * 2) },
        { range: '41-60', count: Math.floor(Math.random() * 5) },
        { range: '61-80', count: Math.floor(Math.random() * 15) + 5 },
        { range: '81-100', count: Math.floor(Math.random() * 10) + 2 },
      ]);
      checkLoaded();
    }));

    return () => unsubs.forEach(unsub => unsub && unsub());
  }, [currentUser]);

  if (error) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - Evaluation Workspace">
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
          <Button className="mt-4 focus:outline-none focus:ring-2 focus:ring-primary-500" onClick={() => { setError(null); setLoading(true); fetchDashboardData(currentUser.uid); }}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - Evaluation Workspace">
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const taskColumns = [
    { header: 'Student', accessor: 'name' },
    { header: 'Project / Task', render: (row) => <span className="text-sm text-gray-600 truncate max-w-[150px] block">{row.project || 'Internal Assessment'}</span> },
    { header: 'Due Date', render: () => <span className="text-sm font-medium text-gray-800">In {Math.floor(Math.random() * 7) + 1} days</span> },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'Evaluated' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
    { 
      header: 'Action', 
      render: (row) => (
        row.status === 'Pending' ? (
          <Button size="sm" variant="primary" className="focus:outline-none focus:ring-2 focus:ring-primary-500">
            Evaluate
          </Button>
        ) : (
          <Button size="sm" variant="secondary" className="focus:outline-none focus:ring-2 focus:ring-primary-500">
            Review
          </Button>
        )
      ) 
    }
  ];

  const pendingTasks = students.filter(s => s.status === 'Pending');

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - Evaluation Workspace">
      <div className="space-y-8 max-w-7xl mx-auto pb-10 px-6 sm:px-8">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-xl p-6 shadow-lg text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div>
              <h1 className="text-3xl font-bold mb-2">Academic Evaluation Workspace</h1>
              <p className="text-primary-100 text-lg">
                Welcome back, Dr. {facultyData?.name?.split(' ')[0] || 'Faculty'}. Here is your evaluation workload for today.
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20 text-right">
              <p className="text-sm text-primary-100 uppercase tracking-wider font-semibold mb-1">Today's Date</p>
              <p className="text-xl font-bold">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Workload Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="md:col-span-1 bg-white border-l-4 border-l-primary-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mentee Students</p>
                <h3 className="text-2xl font-bold text-gray-900">{workload.totalAssigned}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="md:col-span-1 bg-white border-l-4 border-l-green-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg text-green-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Marks Evaluated</p>
                <h3 className="text-2xl font-bold text-gray-900">{workload.evaluated}</h3>
              </div>
            </div>
          </Card>

          <Card className="md:col-span-1 bg-white border-l-4 border-l-amber-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Actions</p>
                <h3 className="text-2xl font-bold text-gray-900">{workload.pending}</h3>
              </div>
            </div>
          </Card>

          <Card className="md:col-span-1 bg-white border-l-4 border-l-red-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg text-red-600">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming Deadlines</p>
                <h3 className="text-2xl font-bold text-gray-900">{workload.upcomingDeadlines}</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Workspace Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Left Column: Tasks & Backlog */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Priority Tasks */}
            <Card title="Marks Entry Backlog & Priority Tasks" icon={<ClipboardList className="text-primary-600" />} className="shadow-sm">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Evaluation Progress</span>
                  <span className="text-sm font-bold text-primary-600">{Math.round((workload.evaluated / (workload.totalAssigned || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(workload.evaluated / (workload.totalAssigned || 1)) * 100}%` }}></div>
                </div>
              </div>
              
              <div className="mt-6 overflow-x-auto">
                {pendingTasks.length > 0 ? (
                  <Table columns={taskColumns} data={pendingTasks.slice(0, 5)} />
                ) : (
                  <EmptyState 
                    icon={CheckCircle}
                    title="All Caught Up!"
                    message="You have no pending evaluations at the moment."
                  />
                )}
              </div>
              {pendingTasks.length > 5 && (
                <div className="mt-4 text-center">
                  <Button variant="ghost" className="text-primary-600 font-medium text-sm hover:text-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
                    View all {pendingTasks.length} pending tasks
                  </Button>
                </div>
              )}
            </Card>

            {/* Quick Actions Workflow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <button className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all text-left group flex items-start gap-5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Bulk Marks Entry</h4>
                  <p className="text-sm text-gray-500">Enter marks for multiple students in spreadsheet view</p>
                </div>
              </button>
              <button className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all text-left group flex items-start gap-5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Review Submissions</h4>
                  <p className="text-sm text-gray-500">Check and evaluate recent project submissions</p>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column: Insights */}
          <div className="lg:col-span-1 space-y-8">
            
            <Card title="Performance Distribution" icon={<TrendingUp className="text-primary-600" />} className="shadow-sm">
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" name="Students" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-center text-gray-500 mt-4">Distribution of Internal Marks across assigned students</p>
            </Card>

            <Card title="Upcoming Deadlines" className="shadow-sm bg-amber-50/50 border border-amber-100">
              <div className="space-y-4">
                <div className="flex gap-4 p-3 bg-white rounded-lg border border-amber-200">
                  <div className="flex flex-col items-center justify-center bg-amber-100 text-amber-800 rounded px-3 py-1 min-w-[60px]">
                    <span className="text-xs font-bold uppercase">Oct</span>
                    <span className="text-xl font-bold">15</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Mid-Term Eval</h4>
                    <p className="text-xs text-gray-500 mt-1">Complete all internal marks entry</p>
                  </div>
                </div>
                <div className="flex gap-4 p-3 bg-white rounded-lg border border-gray-200 opacity-70">
                  <div className="flex flex-col items-center justify-center bg-gray-100 text-gray-600 rounded px-3 py-1 min-w-[60px]">
                    <span className="text-xs font-bold uppercase">Nov</span>
                    <span className="text-xl font-bold">02</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Final Project Review</h4>
                    <p className="text-xs text-gray-500 mt-1">Phase 2 presentation evaluations</p>
                  </div>
                </div>
              </div>
            </Card>
            
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
