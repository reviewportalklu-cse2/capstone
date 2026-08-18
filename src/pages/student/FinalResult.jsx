import React, { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useOutcomeEngine } from '@/hooks/useOutcomeEngine';
import { useData } from '@/contexts/DataContext';
import { Award, Lock, Download, AlertTriangle } from 'lucide-react';

const FinalResult = () => {
  const navigationItems = studentNavigation;
  const { currentUser } = useAuth();
  const { settings, dataLoading } = useData();
  const { calculateStudentResult, generateSemesterRankings } = useOutcomeEngine();

  const isPublished = useMemo(() => {
    const pubSettings = settings?.find(s => s.id === 'resultPublication');
    return pubSettings?.isPublished || false; // default false
  }, [settings]);

  // Determine current student's data
  const studentResult = useMemo(() => {
    if (dataLoading || !currentUser) return null;
    const { students } = generateSemesterRankings();
    return students.find(s => s.id === currentUser.uid || s.email === currentUser.email);
  }, [generateSemesterRankings, currentUser, dataLoading]);

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="Official Semester Result">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isPublished) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="Official Semester Result">
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="text-center p-12 bg-gray-50 border-gray-200 shadow-sm">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gray-200 text-gray-500 rounded-full">
                <Lock size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Results Not Yet Published</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              The official semester results have not yet been published by the department. You will be notified once they are available for viewing.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!studentResult) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="Official Semester Result">
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="p-6 bg-red-50 text-red-600 flex items-center gap-3">
            <AlertTriangle size={24} />
            <span className="font-medium">Could not locate your academic records. Please contact administration.</span>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navigationItems} title="Official Semester Result">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 p-8 rounded-xl shadow-lg text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-full">
              <Award size={48} className="text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Official Semester Result</h1>
              <p className="text-primary-100 mt-1">Academic Year 2023-2024 | Odd Semester</p>
            </div>
          </div>
          <div className="text-center md:text-right bg-white/10 p-4 rounded-lg">
            <p className="text-sm text-primary-200 uppercase tracking-wide">Final Status</p>
            <h2 className={`text-3xl font-bold ${studentResult.status === 'Pass' ? 'text-emerald-400' : 'text-red-400'}`}>
              {studentResult.status}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <Card className="md:col-span-1 flex flex-col justify-center items-center text-center border-t-4 border-t-primary-500 shadow-md py-10">
            <p className="text-gray-500 font-medium mb-2">Overall Percentage</p>
            <div className="text-6xl font-black text-gray-900 mb-2">{studentResult.finalScore}<span className="text-3xl text-gray-400">%</span></div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-gray-500">Grade:</span>
              <span className="text-2xl font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-md">{studentResult.grade}</span>
            </div>
          </Card>

          {/* Breakdown Card */}
          <Card className="md:col-span-2 shadow-sm" title="Score Breakdown">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-gray-700">Guide Contribution</span>
                  <span className="text-gray-900">{studentResult.weightedGuide} / 30%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(studentResult.weightedGuide / 30) * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-gray-700">Faculty Contribution</span>
                  <span className="text-gray-900">{studentResult.weightedFaculty} / 20%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(studentResult.weightedFaculty / 20) * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-gray-700">Reviewer Contribution</span>
                  <span className="text-gray-900">{studentResult.weightedReviewer} / 50%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(studentResult.weightedReviewer / 50) * 100}%` }}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Attendance Record</span>
                <Badge variant={studentResult.attendance >= 75 ? 'success' : 'danger'}>{studentResult.attendance}%</Badge>
              </div>
              
              {studentResult.penalty > 0 && (
                <div className="bg-red-50 text-red-700 p-3 rounded flex items-center justify-between text-sm">
                  <span className="font-medium">Attendance Penalty Applied</span>
                  <span className="font-bold">-{studentResult.penalty}%</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Rankings Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex items-center gap-4 bg-gray-50 border-gray-200 shadow-sm">
            <div className="p-4 bg-primary-100 text-primary-700 rounded-lg">
              <Award size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Semester Rank</p>
              <h3 className="text-3xl font-bold text-gray-900">#{studentResult.rank}</h3>
            </div>
          </Card>
          
          <Card className="flex items-center gap-4 bg-gray-50 border-gray-200 shadow-sm">
            <div className="p-4 bg-indigo-100 text-indigo-700 rounded-lg">
              <Award size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Department Rank</p>
              <h3 className="text-3xl font-bold text-gray-900">#{studentResult.rank}</h3>
            </div>
          </Card>
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Official PDF
          </Button>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default FinalResult;
