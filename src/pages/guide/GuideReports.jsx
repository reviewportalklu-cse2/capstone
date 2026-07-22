import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { projectService } from '@/firebase/services/projectService';
import { studentService } from '@/firebase/services/studentService';
import { remarkService } from '@/firebase/services/remarkService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, FileBarChart, Download, FileSpreadsheet, Users, Activity, MessageSquare } from 'lucide-react';

const GuideReports = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalProjects: 0,
    totalStudents: 0,
    completedProjects: 0,
    totalRemarks: 0,
    milestoneDistribution: {}
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchReports(currentUser.uid);
    }
  }, [currentUser]);

  const fetchReports = async (uid) => {
    try {
      setLoading(true);
      const [projects, students, remarks] = await Promise.all([
        projectService.getProjectsByGuide(uid),
        studentService.getByGuideId(uid),
        remarkService.getRemarksByAuthor(uid)
      ]);

      const milestoneDist = {};
      projects.forEach(p => {
        const ms = p.currentMilestone || 'Not Started';
        milestoneDist[ms] = (milestoneDist[ms] || 0) + 1;
      });

      setReportData({
        totalProjects: projects.length,
        totalStudents: students.length,
        completedProjects: projects.filter(p => p.status === 'Completed').length,
        totalRemarks: remarks.length,
        milestoneDistribution: milestoneDist
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
      <DashboardLayout navigationItems={guideNavigation} title="CapstoneFlow - Reports">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const { totalProjects, totalStudents, completedProjects, totalRemarks, milestoneDistribution } = reportData;

  return (
    <DashboardLayout navigationItems={guideNavigation} title="CapstoneFlow - Reports">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileBarChart className="h-6 w-6 text-primary-600" /> Analytics & Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">Exportable summaries of student progress and mentoring performance.</p>
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

        {totalProjects === 0 ? (
          <Card>
            <div className="py-12">
              <EmptyState
                icon={FileBarChart}
                title="No Data Available"
                description="You do not have any assigned projects to generate reports for."
              />
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard 
                title="Total Students" 
                value={totalStudents.toString()} 
                icon={Users} 
                colorClass="text-blue-600" 
                bgClass="bg-blue-50" 
              />
              <StatCard 
                title="Total Projects" 
                value={totalProjects.toString()} 
                icon={FileBarChart} 
                colorClass="text-purple-600" 
                bgClass="bg-purple-50" 
              />
              <StatCard 
                title="Completed Projects" 
                value={completedProjects.toString()} 
                icon={Activity} 
                colorClass="text-success" 
                bgClass="bg-success/10" 
              />
              <StatCard 
                title="Feedback Provided" 
                value={totalRemarks.toString()} 
                icon={MessageSquare} 
                colorClass="text-orange-600" 
                bgClass="bg-orange-50" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Milestone Distribution">
                <div className="space-y-4 mt-4">
                  {Object.entries(milestoneDistribution).map(([ms, count]) => (
                    <div key={ms}>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-medium text-gray-700">{ms}</span>
                        <span className="font-semibold">{count} Projects</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${(count/totalProjects)*100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Guide Performance Summary">
                <div className="flex flex-col justify-center h-full space-y-4 p-4 text-sm text-gray-700">
                  <p><strong>Guidance Load:</strong> Managing {totalStudents} students across {totalProjects} independent projects.</p>
                  <p><strong>Feedback Velocity:</strong> Total of {totalRemarks} recorded remarks and interventions provided.</p>
                  <p><strong>Success Rate:</strong> {((completedProjects/totalProjects)*100).toFixed(1)}% of assigned projects have reached completion.</p>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GuideReports;
