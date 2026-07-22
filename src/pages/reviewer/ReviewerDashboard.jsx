import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Clock, Loader2, PlayCircle, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { studentService } from '@/firebase/services/studentService';
import { reviewService } from '@/firebase/services/reviewService';
import { scheduleService } from '@/firebase/services/scheduleService';

const ReviewerDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, total: 0 });
  const [schedule, setSchedule] = useState([]);
  const [pendingRemarks, setPendingRemarks] = useState([]);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDashboardData(currentUser.uid);
    }
  }, [currentUser]);

  const fetchDashboardData = async (uid) => {
    try {
      setLoading(true);
      setError(null);
      
      const [allStudents, allReviews, allSchedules] = await Promise.all([
        studentService.getByReviewerId(uid),
        reviewService.getByReviewerId(uid),
        scheduleService.getByReviewerId(uid)
      ]);

      // Queue Processing: Find students needing review
      const queueData = allStudents.map(s => {
        // Simple logic for priority:
        let priority = 'Low';
        if (s.reviewStage === 'Review 1') priority = 'High';
        else if (s.reviewStage === 'Review 2') priority = 'Medium';
        
        return {
          id: s.uid,
          name: s.name,
          project: s.projectTitle || 'Capstone Project',
          batch: s.batch || 'N/A',
          reviewStage: s.reviewStage || 'Review 1',
          priority: priority,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        };
      });
      setQueue(queueData.slice(0, 5)); // show top 5

      const completed = allStudents.filter(s => s.status === 'Completed').length;
      const total = allStudents.length;
      const pending = total - completed;

      setStats({ completed, total, pending });

      setProgressData([
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
      ]);

      // Map Schedule
      const enrichedSchedule = allSchedules.map(item => {
        const s = allStudents.find(student => student.uid === item.studentId);
        return {
          id: item.id,
          time: item.time || '10:00 AM',
          student: s?.name || 'Unknown Student',
          project: s?.projectTitle || 'Unknown Project',
          type: item.type || 'Review Meeting'
        };
      });
      setSchedule(enrichedSchedule);
      
      // Simulate Pending Remarks based on reviews needing finalization
      const drafts = allReviews.filter(r => r.status === 'Draft');
      setPendingRemarks(drafts.map(d => ({
        id: d.id,
        text: `Finalize marks for ${allStudents.find(s => s.uid === d.studentId)?.name || 'Student'}`,
        time: 'Pending'
      })));

    } catch (error) {
      console.error("Error fetching reviewer dashboard:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - Reviewer Workspace">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - Reviewer Workspace">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
          <Button onClick={() => fetchDashboardData(currentUser?.uid)}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const queueColumns = [
    { header: 'Student', accessor: 'name', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { header: 'Project', accessor: 'project', render: (row) => <span className="text-gray-600 truncate max-w-[200px] block">{row.project}</span> },
    { header: 'Batch', accessor: 'batch' },
    { 
      header: 'Priority', 
      render: (row) => (
        <Badge variant={row.priority === 'High' ? 'danger' : row.priority === 'Medium' ? 'warning' : 'primary'}>
          {row.priority}
        </Badge>
      )
    },
    { header: 'Due Date', accessor: 'dueDate' },
    { 
      header: 'Action', 
      render: (row) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(row.reviewStage === 'Review 3' ? '/reviewer/review3' : row.reviewStage === 'Review 2' ? '/reviewer/review2' : '/reviewer/review1')} 
          className="flex items-center font-medium"
        >
          Evaluate <ArrowRight className="ml-1 w-4 h-4" />
        </Button>
      ) 
    }
  ];

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - Reviewer Workspace">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 md:p-8 text-white shadow-xl">
          <div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">CapstoneFlow Workspace</h1>
            <p className="text-slate-300 text-lg">Welcome back. You have <span className="font-semibold text-white">{stats.pending}</span> evaluations pending.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button onClick={() => navigate('/reviewer/review1')} className="px-5 py-2.5 shadow-sm flex items-center">
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Next Review
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div className="xl:col-span-2 space-y-6">
            
            {/* Upcoming Schedule */}
            <Card title="Today's Review Schedule" className="shadow-sm border-gray-200">
              <div className="space-y-4 mt-2">
                {schedule.length > 0 ? schedule.map(item => (
                  <div key={item.id} className="flex items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex flex-col items-center justify-center bg-primary-50 text-primary-700 rounded-lg p-3 w-20 flex-shrink-0">
                      <Clock className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">{item.time}</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{item.student}</h4>
                      <p className="text-sm text-gray-500">{item.project} &bull; {item.type}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-6"><EmptyState icon={Clock} title="Free Schedule" description="No reviews scheduled for today." /></div>
                )}
              </div>
            </Card>

            {/* Assigned Review Queue */}
            <Card title="Assigned Review Queue" className="shadow-sm border-gray-200">
              <div className="overflow-x-auto mt-2">
                {queue.length > 0 ? (
                  <Table columns={queueColumns} data={queue} />
                ) : (
                  <div className="py-8">
                    <EmptyState 
                      icon={Clock}
                      title="No pending reviews"
                      description="You have no assigned students in your queue right now."
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            
            {/* Evaluation Progress Ring */}
            <Card title="Evaluation Progress" className="shadow-sm border-gray-200">
              <div className="h-64 relative flex flex-col items-center justify-center mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={progressData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {progressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} Students`, name]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-gray-900">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Completed</span>
                </div>
              </div>
              <div className="flex justify-between mt-4 text-sm px-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                  <span className="text-gray-600">Done ({stats.completed})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-gray-600">Pending ({stats.pending})</span>
                </div>
              </div>
            </Card>

            {/* Pending Remarks */}
            <Card title="Pending Remarks / Drafts" className="shadow-sm border-gray-200">
              <div className="space-y-4 mt-2">
                {pendingRemarks.length > 0 ? pendingRemarks.map(remark => (
                  <div key={remark.id} className="flex items-start p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-amber-900">{remark.text}</p>
                      <span className="text-xs text-amber-700 mt-1 block">{remark.time}</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-4 text-center text-sm text-gray-500">No pending drafts.</div>
                )}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReviewerDashboard;
