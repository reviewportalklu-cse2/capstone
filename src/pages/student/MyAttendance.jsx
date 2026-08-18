import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { Loader2, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

const MyAttendance = () => {
  const { getStudentAttendance, dataLoading } = useStudentAnalytics();
  
  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Attendance Portal">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const attendance = getStudentAttendance();
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const attendancePercentage = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;
  
  const pendingEvals = attendance.filter(a => a.status === 'Absent' && a.pendingEvaluation === true);

  const columns = [
    { header: 'Date', accessor: 'date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Review Cycle', accessor: 'cycleName', render: (row) => row.cycleName || 'General Review' },
    { header: 'Status', accessor: 'status', render: (row) => (
      <Badge variant={row.status === 'Present' ? 'success' : 'danger'}>{row.status}</Badge>
    )},
    { header: 'Evaluator', accessor: 'markedBy', render: (row) => <span className="text-gray-600">{row.markedBy}</span> }
  ];

  return (
    <DashboardLayout navigationItems={studentNavigation} title="Attendance Portal">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 bg-gradient-to-br from-indigo-900 to-indigo-700 border-0 text-white flex flex-col justify-center items-center py-10 shadow-lg">
            <p className="text-indigo-200 uppercase tracking-wider font-bold mb-2">Overall Attendance</p>
            <h2 className="text-6xl font-black">{attendancePercentage}%</h2>
            <div className="mt-4 flex gap-4 text-sm font-medium">
              <span className="bg-white/20 px-3 py-1 rounded-full text-emerald-100">Present: {presentCount}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-red-200">Absent: {attendance.length - presentCount}</span>
            </div>
          </Card>
          
          <div className="md:col-span-2 space-y-6">
            {pendingEvals.length > 0 ? (
              <Card className="bg-red-50 border-red-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900 mb-1">Pending Evaluations Detected</h3>
                    <p className="text-red-700 text-sm mb-4">You have missed scheduled reviews. You must complete pending evaluations within the 1-week deadline to avoid academic penalties.</p>
                    
                    <div className="space-y-3">
                      {pendingEvals.map((pending, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border border-red-100 flex flex-wrap justify-between items-center gap-3">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{pending.cycleName}</p>
                            <p className="text-xs text-gray-500">Missed on: {new Date(pending.date).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="warning" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Deadline Pending
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-emerald-50 border-emerald-200 shadow-sm flex items-center gap-4 h-full">
                <div className="bg-emerald-100 p-4 rounded-full flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900 mb-1">Excellent Standing</h3>
                  <p className="text-emerald-700 text-sm">You have no missed reviews or pending evaluations. Keep up the good work!</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* History Table */}
        <Card title="Attendance History" className="shadow-sm">
          {attendance.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <Table columns={columns} data={attendance} />
            </div>
          ) : (
            <div className="py-12">
              <EmptyState 
                icon={Calendar}
                title="No Attendance Records"
                description="Your attendance records for formal reviews will appear here."
              />
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default MyAttendance;
