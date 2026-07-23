import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import StatCard from '@/components/common/StatCard';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  FileText,
  Activity,
  ArrowRight,
  Clock
} from 'lucide-react';
import { projectService } from '@/firebase/services/projectService';
import { studentService } from '@/firebase/services/studentService';
import { meetingService } from '@/firebase/services/meetingService';
import { remarkService } from '@/firebase/services/remarkService';
import { FirestoreService } from '@/firebase/services/firestore';

const GuideDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [pendingRemarks, setPendingRemarks] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const uid = currentUser.uid;
    const unsubs = [];
    
    setLoading(true);
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 4) setLoading(false);
    };

    unsubs.push(FirestoreService.subscribeQuery('projects', [{ field: 'guideId', operator: '==', value: uid }], (allProjects) => {
      setProjects(allProjects);
      checkLoaded();
    }, () => checkLoaded()));

    unsubs.push(FirestoreService.subscribeQuery('students', [{ field: 'guideId', operator: '==', value: uid }], (allStudents) => {
      setStudents(allStudents);
      checkLoaded();
    }, () => checkLoaded()));

    unsubs.push(FirestoreService.subscribeQuery('meetings', [{ field: 'guideId', operator: '==', value: uid }], (allMeetings) => {
      const upcoming = allMeetings.filter(m => new Date(m.date) >= new Date(new Date().setHours(0,0,0,0)));
      setMeetings(upcoming.slice(0, 3));
      checkLoaded();
    }, () => checkLoaded()));

    unsubs.push(FirestoreService.subscribeQuery('remarks', [{ field: 'authorId', operator: '==', value: uid }], (allRemarks) => {
      setPendingRemarks(allRemarks);
      checkLoaded();
    }, () => checkLoaded()));

    return () => unsubs.forEach(unsub => unsub && unsub());
  }, [currentUser]);

  const pendingGuidanceProjects = projects.filter(p => !pendingRemarks.some(r => r.projectId === p.id)).slice(0, 3);

  if (loading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Mentoring Workspace">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Mentoring Workspace">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
          <EmptyState 
            icon={AlertCircle}
            title="Error Loading Dashboard"
            description={error}
            action={<Button onClick={() => window.location.reload()}>Retry</Button>}
          />
        </div>
      </DashboardLayout>
    );
  }

  const studentColumns = [
    { header: 'Project / Group', accessor: 'title', render: (row) => <div className="font-medium text-gray-900">{row.title || 'Untitled Project'}</div> },
    { header: 'Stage', render: (row) => <span className="text-sm font-medium text-gray-700">{row.currentMilestone || 'Development'}</span> },
    { 
      header: 'Health', 
      render: (row) => (
        <Badge variant={row.status === 'Completed' ? 'success' : 'warning'}>
          {row.status === 'Completed' ? 'On Track' : 'Needs Attention'}
        </Badge>
      )
    },
    { 
      header: 'Progress', 
      render: (row) => (
        <div className="w-full flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${row.status === 'Completed' ? 'bg-success' : 'bg-primary-500'}`} style={{ width: row.status === 'Completed' ? '100%' : '65%' }}></div>
          </div>
          <span className="text-xs font-medium text-gray-500">{row.status === 'Completed' ? '100%' : '65%'}</span>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Mentoring Workspace">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mentoring Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your guidance, review submissions, and track student milestones.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="shadow-sm" onClick={() => navigate('/guide/meetings')}>
               Schedule Meeting
             </Button>
             <Button className="shadow-sm" onClick={() => navigate('/guide/notifications')}>
               New Broadcast
             </Button>
          </div>
        </div>

        {/* Workflow Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard 
            title="Pending Actions" 
            value={pendingGuidanceProjects.length.toString()} 
            icon={AlertCircle} 
            colorClass="text-orange-600" 
            bgClass="bg-orange-50"
          />
          <StatCard 
            title="Active Projects" 
            value={projects.length.toString()} 
            icon={FileText} 
            colorClass="text-blue-600" 
            bgClass="bg-blue-50"
          />
          <StatCard 
            title="Upcoming Meetings" 
            value={meetings.length.toString()} 
            icon={Calendar} 
            colorClass="text-purple-600" 
            bgClass="bg-purple-50"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div className="xl:col-span-2 space-y-6">
            
            {/* Pending Guidance */}
            <Card title="Pending Guidance" className="shadow-sm border-gray-200/60">
              <div className="space-y-4 mt-2">
                {pendingGuidanceProjects.length > 0 ? pendingGuidanceProjects.map((proj) => (
                  <div key={proj.id} className="flex items-start justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Provide Initial Remark</h4>
                        <p className="text-xs text-gray-500 mt-1">{proj.title || proj.id}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/guide/remarks')} className="flex items-center text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Resolve <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )) : (
                  <div className="py-8">
                    <EmptyState 
                      icon={CheckCircle2}
                      title="All Caught Up!"
                      description="No pending actions. You're all caught up!"
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Assigned Students Progress */}
            <Card title="Project Progress Overview" className="shadow-sm border-gray-200/60 overflow-x-auto">
              {projects.length > 0 ? (
                <Table columns={studentColumns} data={projects} />
              ) : (
                <div className="py-8">
                  <EmptyState icon={FileText} title="No Projects" description="You have no assigned projects yet." />
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            {/* Upcoming Meetings */}
            <Card title="Upcoming Meetings" className="shadow-sm border-gray-200/60">
              <div className="space-y-4 mt-2">
                {meetings.length > 0 ? meetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="mt-0.5 bg-primary-50 text-primary-600 p-2 rounded-lg flex flex-col items-center justify-center min-w-[3rem]">
                      <span className="text-xs font-bold leading-none">{new Date(meeting.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{meeting.title || 'Review Meeting'}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1 gap-2">
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {meeting.time || '10:00 AM'}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-6">
                    <EmptyState 
                      icon={Calendar}
                      title="No Meetings"
                      description="No meetings scheduled."
                    />
                  </div>
                )}
                <Button variant="ghost" onClick={() => navigate('/guide/meetings')} className="w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border-t border-gray-100 mt-2 pt-4 rounded-none">
                  View Calendar
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card title="Recent Activity" className="shadow-sm border-gray-200/60">
               <div className="py-6">
                <EmptyState 
                  icon={Activity}
                  title="No Activity"
                  description="No recent activity logged."
                />
              </div>
            </Card>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default GuideDashboard;
