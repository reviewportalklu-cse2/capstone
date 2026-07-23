import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Download, FileText, Loader2, BarChart2, PieChart } from 'lucide-react';
import { studentService, projectService, reviewService } from '@/firebase/services';
import { exportToCsv } from '@/utils/csvExport';

const AdminReports = () => {
  const navigationItems = useAdminNavigation();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [students, projects, reviews] = await Promise.all([
        studentService.getAll(),
        projectService.getAll(),
        reviewService.getAll()
      ]);

      // Generate a consolidated performance report
      const data = students.map(student => {
        const proj = projects.find(p => p.id === student.projectId);
        const stReviews = reviews.filter(r => r.studentId === student.id);
        
        let avgScore = 0;
        if (stReviews.length > 0) {
          const sum = stReviews.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
          avgScore = Math.round(sum / stReviews.length);
        }

        return {
          rollNo: student.rollNo,
          name: student.name,
          batch: student.batch,
          project: proj?.title || 'No Project',
          reviewsCompleted: stReviews.length,
          averageScore: avgScore,
          status: avgScore >= 75 ? 'Excellent' : avgScore >= 50 ? 'Average' : avgScore > 0 ? 'Needs Improvement' : 'Pending'
        };
      });

      setReportData(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportToCsv('capstoneflow_performance_report.csv', reportData);
  };

  const columns = [
    { header: 'Roll No', accessor: 'rollNo' },
    { header: 'Student Name', accessor: 'name' },
    { header: 'Batch', accessor: 'batch' },
    { header: 'Project Title', accessor: 'project' },
    { header: 'Reviews', accessor: 'reviewsCompleted' },
    { 
      header: 'Avg Score', 
      render: (row) => (
        <span className="font-bold text-gray-900">{row.averageScore > 0 ? `${row.averageScore}%` : '-'}</span>
      )
    },
    { 
      header: 'Performance', 
      render: (row) => {
        const variant = 
          row.status === 'Excellent' ? 'success' : 
          row.status === 'Average' ? 'primary' : 
          row.status === 'Needs Improvement' ? 'danger' : 'default';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    }
  ];

  return (
    <DashboardLayout navigationItems={navigationItems} title="University Performance Reports">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-primary-50 to-white">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900">Student Progress Report</h3>
            <p className="text-sm text-gray-500 mt-2">Comprehensive view of all students, their projects, and review scores.</p>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-indigo-50 to-white">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900">Batch Analytics</h3>
            <p className="text-sm text-gray-500 mt-2">Aggregated performance metrics sorted by academic batch.</p>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-emerald-50 to-white">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900">Custom Export</h3>
            <p className="text-sm text-gray-500 mt-2">Generate CSV exports for accreditation and university record keeping.</p>
            <Button onClick={handleExport} className="mt-4 w-full justify-center text-sm">
              <Download className="w-4 h-4 mr-2" /> Download Report
            </Button>
          </Card>
        </div>

        <Card title="Student Performance Overview" className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : (
            <Table columns={columns} data={reportData} />
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
