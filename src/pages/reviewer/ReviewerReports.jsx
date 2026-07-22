import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/firebase/services/studentService';
import { reviewService } from '@/firebase/services/reviewService';
import { Loader2, FileBarChart, Download, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const ReviewerReports = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [stageData, setStageData] = useState([]);
  const [scoreData, setScoreData] = useState([]);
  const [stats, setStats] = useState({ totalAssigned: 0, totalReviews: 0, avgScore: 0 });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchReports(currentUser.uid);
    }
  }, [currentUser]);

  const fetchReports = async (uid) => {
    try {
      setLoading(true);
      const [students, reviews] = await Promise.all([
        studentService.getByReviewerId(uid),
        reviewService.getByReviewerId(uid)
      ]);

      setStats({
        totalAssigned: students.length,
        totalReviews: reviews.length,
        avgScore: reviews.length > 0 ? Math.round(reviews.reduce((acc, r) => acc + (r.totalScore || 0), 0) / reviews.length) : 0
      });

      // Stage Data
      let r1 = 0, r2 = 0, r3 = 0, completed = 0;
      students.forEach(s => {
        if (s.reviewStage === 'Review 2') r1++;
        else if (s.reviewStage === 'Review 3') r2++;
        else if (s.status === 'Completed') completed++;
        else r1++; // Default to starting at R1
      });

      setStageData([
        { name: 'Review 1 Pending', value: r1, color: '#3b82f6' },
        { name: 'Review 2 Pending', value: r2, color: '#f59e0b' },
        { name: 'Review 3 Pending', value: r3, color: '#8b5cf6' },
        { name: 'Fully Completed', value: completed, color: '#10b981' },
      ]);

      // Score distribution (bucketing avg scores)
      const buckets = { '0-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
      reviews.forEach(r => {
        const s = r.totalScore || 0;
        if (s <= 40) buckets['0-40']++;
        else if (s <= 60) buckets['41-60']++;
        else if (s <= 80) buckets['61-80']++;
        else buckets['81-100']++;
      });
      
      setScoreData([
        { range: '0-40', count: buckets['0-40'] },
        { range: '41-60', count: buckets['41-60'] },
        { range: '61-80', count: buckets['61-80'] },
        { range: '81-100', count: buckets['81-100'] },
      ]);

    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to load reporting data.");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

  if (loading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - My Reports">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - My Reports">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileBarChart className="h-6 w-6 text-primary-600" /> Evaluation Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">Analytics and insights on your assigned students and reviews.</p>
          </div>
          <Button variant="outline" className="flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Export Report (PDF)
          </Button>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg text-primary-700">
                <FileBarChart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Assigned Students</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalAssigned}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Reviews</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalReviews}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700">
                <PieChartIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Average Score</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.avgScore} / 100</h3>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Student Review Stages">
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Score Distribution (All Reviews)">
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Number of Reviews" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ReviewerReports;
