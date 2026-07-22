import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/firebase/services/studentService';
import { Loader2, Users, Layers } from 'lucide-react';

const MyBatches = () => {
  const { currentUser } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchBatches(currentUser.uid);
    }
  }, [currentUser]);

  const fetchBatches = async (uid) => {
    try {
      setLoading(true);
      const students = await studentService.getByReviewerId(uid);
      
      // Group by batch
      const batchMap = {};
      students.forEach(s => {
        const b = s.batch || 'Unassigned Batch';
        if (!batchMap[b]) {
          batchMap[b] = { name: b, count: 0, completed: 0 };
        }
        batchMap[b].count++;
        if (s.status === 'Completed') batchMap[b].completed++;
      });

      const batchList = Object.values(batchMap).map(b => ({
        ...b,
        progress: Math.round((b.completed / b.count) * 100)
      }));

      setBatches(batchList);
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to fetch batches");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={reviewerNavigation} title="KL CSE Capstone Portal - My Batches">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const columns = [
    { header: 'Batch Name', accessor: 'name', render: (row) => <span className="font-semibold text-gray-900">{row.name}</span> },
    { header: 'Total Students', accessor: 'count' },
    { header: 'Evaluated', accessor: 'completed' },
    { header: 'Progress', render: (row) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
          <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${row.progress}%` }}></div>
        </div>
        <span className="text-sm font-medium">{row.progress}%</span>
      </div>
    )}
  ];

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="KL CSE Capstone Portal - My Batches">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary-600" /> My Assigned Batches
          </h1>
          <p className="text-sm text-gray-500 mt-1">Overview of the batches you are responsible for evaluating.</p>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <Card>
          {batches.length > 0 ? (
            <Table columns={columns} data={batches} />
          ) : (
            <div className="py-12">
              <EmptyState icon={Users} title="No Batches Found" description="You have not been assigned to any batches." />
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyBatches;
