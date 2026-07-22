import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { facultyNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { marksService } from '@/firebase/services/marksService';
import { studentService } from '@/firebase/services/studentService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, FileBarChart, Download, FileSpreadsheet, Users, Activity } from 'lucide-react';

const FacultyReports = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalAssigned: 0,
    evaluatedCount: 0,
    averageMarks: 0,
    marksDistribution: {
      excellent: 0, // 80-100
      good: 0,      // 60-79
      average: 0,   // 40-59
      poor: 0       // 0-39
    }
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchReports(currentUser.uid);
    }
  }, [currentUser]);

  const fetchReports = async (uid) => {
    try {
      setLoading(true);
      const [students, marks] = await Promise.all([
        studentService.getByFacultyId(uid),
        marksService.getFacultyMarksByFacultyId(uid)
      ]);

      const totalAssigned = students.length;
      const evaluatedCount = marks.length;
      
      let totalScore = 0;
      const distribution = { excellent: 0, good: 0, average: 0, poor: 0 };

      marks.forEach(m => {
        const percentage = (Number(m.marks) / Number(m.total)) * 100;
        totalScore += percentage;
        
        if (percentage >= 80) distribution.excellent++;
        else if (percentage >= 60) distribution.good++;
        else if (percentage >= 40) distribution.average++;
        else distribution.poor++;
      });

      const averageMarks = evaluatedCount > 0 ? (totalScore / evaluatedCount).toFixed(1) : 0;

      setReportData({
        totalAssigned,
        evaluatedCount,
        averageMarks,
        marksDistribution: distribution
      });
    } catch (error) {
      console.error("Error generating reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateExport = (type) => {
    alert(`Generating ${type} report... (Simulated)`);
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="CapstoneFlow - My Reports">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const { totalAssigned, evaluatedCount, averageMarks, marksDistribution } = reportData;
  const pendingCount = totalAssigned - evaluatedCount;

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="CapstoneFlow - My Reports">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileBarChart className="h-6 w-6 text-primary-600" /> Evaluation Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">Analytics and performance summaries for your assigned classes.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => simulateExport('PDF')} className="flex items-center gap-2 bg-white">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
            <Button onClick={() => simulateExport('Excel')} className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </Button>
          </div>
        </div>

        {totalAssigned === 0 ? (
          <Card>
            <div className="py-12">
              <EmptyState
                icon={FileBarChart}
                title="No Data Available"
                description="You do not have any assigned students to generate reports for."
              />
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard 
                title="Total Assigned" 
                value={totalAssigned.toString()} 
                icon={Users} 
                colorClass="text-blue-600" 
                bgClass="bg-blue-50" 
              />
              <StatCard 
                title="Evaluated Students" 
                value={evaluatedCount.toString()} 
                icon={FileBarChart} 
                colorClass="text-green-600" 
                bgClass="bg-green-50" 
              />
              <StatCard 
                title="Pending Evaluations" 
                value={pendingCount.toString()} 
                icon={Activity} 
                colorClass="text-orange-600" 
                bgClass="bg-orange-50" 
              />
              <StatCard 
                title="Average Score (%)" 
                value={averageMarks.toString() + '%'} 
                icon={Activity} 
                colorClass="text-purple-600" 
                bgClass="bg-purple-50" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Marks Distribution">
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Excellent (80-100%)</span>
                    <span className="font-semibold">{marksDistribution.excellent} Students</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: `${evaluatedCount > 0 ? (marksDistribution.excellent/evaluatedCount)*100 : 0}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Good (60-79%)</span>
                    <span className="font-semibold">{marksDistribution.good} Students</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${evaluatedCount > 0 ? (marksDistribution.good/evaluatedCount)*100 : 0}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Average (40-59%)</span>
                    <span className="font-semibold">{marksDistribution.average} Students</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-warning h-2 rounded-full" style={{ width: `${evaluatedCount > 0 ? (marksDistribution.average/evaluatedCount)*100 : 0}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Needs Improvement (&lt;40%)</span>
                    <span className="font-semibold">{marksDistribution.poor} Students</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-danger h-2 rounded-full" style={{ width: `${evaluatedCount > 0 ? (marksDistribution.poor/evaluatedCount)*100 : 0}%` }}></div>
                  </div>
                </div>
              </Card>

              <Card title="Evaluation Status">
                <div className="flex items-center justify-center h-48">
                  {evaluatedCount === totalAssigned ? (
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <FileBarChart className="w-8 h-8" />
                      </div>
                      <p className="font-semibold text-gray-900">All evaluations completed</p>
                      <p className="text-xs text-gray-500">100% completion rate</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                        <Activity className="w-8 h-8" />
                      </div>
                      <p className="font-semibold text-gray-900">{pendingCount} Evaluations Pending</p>
                      <p className="text-xs text-gray-500">{((evaluatedCount/totalAssigned)*100).toFixed(0)}% completion rate</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacultyReports;
