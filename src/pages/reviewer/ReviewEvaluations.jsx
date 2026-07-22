import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { reviewService } from '@/firebase/services/reviewService';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardList } from 'lucide-react';

const ReviewEvaluations = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await reviewService.getAll();
        // Assuming review objects have reviewerId to filter by the assigned reviewer
        const myReviews = currentUser ? data.filter(r => r.reviewerId === currentUser.uid) : data;
        setReviews(myReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [currentUser]);

  const columns = [
    { header: 'Project Name', accessor: 'projectName' },
    { header: 'Student Name', accessor: 'studentName' },
    { header: 'Marks', accessor: 'marks' },
    { header: 'Comments', accessor: 'comments' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'Completed' ? 'success' : 'warning'}>
          {row.status || 'Pending'}
        </Badge>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Review Evaluations</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and view your assigned project evaluations.</p>
        </div>
      </div>

      <Card padding="p-0">
        {!loading && reviews.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={ClipboardList}
              title="No evaluations found"
              description="You do not have any evaluations assigned at this moment."
            />
          </div>
        ) : (
          <Table 
            columns={columns} 
            data={reviews} 
            isLoading={loading}
          />
        )}
      </Card>
    </div>
  );
};

export default ReviewEvaluations;
