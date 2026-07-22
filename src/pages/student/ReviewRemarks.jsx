import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { remarkService } from '@/firebase/services/remarkService';
import { reviewService } from '@/firebase/services/reviewService';
import { Loader2, MessageSquare, Calendar, User, Search, Filter } from 'lucide-react';

const ReviewRemarks = () => {
  const { currentUser } = useAuth();
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchRemarks(currentUser.uid);
    }
  }, [currentUser]);

  const fetchRemarks = async (uid) => {
    try {
      setLoading(true);
      // Fetch direct guide remarks and external review remarks
      const [directRemarks, reviews] = await Promise.all([
        remarkService.getRemarksByStudent(uid),
        reviewService.getByStudentId(uid)
      ]);

      const normalizedRemarks = [];

      // Add direct remarks
      directRemarks.forEach(r => {
        normalizedRemarks.push({
          id: r.id,
          title: 'Guide Feedback',
          content: r.content || r.comment,
          authorName: r.authorName || 'Assigned Guide',
          authorRole: 'Guide',
          date: r.createdAt,
          type: 'Direct'
        });
      });

      // Add review remarks
      reviews.filter(r => r.status === 'Final').forEach(r => {
        normalizedRemarks.push({
          id: r.id,
          title: `${r.reviewType} Feedback`,
          content: r.remarks,
          authorName: 'Evaluation Committee',
          authorRole: 'Reviewer',
          date: r.createdAt,
          type: 'Formal'
        });
      });

      // Sort chronological descending
      normalizedRemarks.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRemarks(normalizedRemarks);

    } catch (err) {
      console.error('Error fetching remarks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - Remarks">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const filteredRemarks = remarks.filter(r => {
    const matchesSearch = r.content?.toLowerCase().includes(searchTerm.toLowerCase()) || r.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || r.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - Remarks">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary-600" /> Evaluation Remarks
            </h1>
            <p className="text-sm text-gray-500 mt-1">Review feedback and comments from your Guide and Reviewers.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search remarks..." 
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg text-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Feedbacks</option>
              <option value="Direct">Guide Comments</option>
              <option value="Formal">Formal Reviews</option>
            </select>
          </div>
        </div>

        {filteredRemarks.length === 0 ? (
          <div className="p-6 max-w-4xl mx-auto py-12">
            <EmptyState 
              icon={MessageSquare}
              title="No Remarks Found" 
              description={searchTerm ? "No remarks matched your search criteria." : "You haven't received any remarks from your guide or reviewers yet."} 
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRemarks.map((remark) => (
              <Card key={remark.id} className="border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="bg-primary-50 p-2.5 rounded-lg mr-4 border border-primary-100 flex-shrink-0">
                    {remark.type === 'Direct' ? <User className="h-5 w-5 text-primary-600" /> : <MessageSquare className="h-5 w-5 text-indigo-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                      <h3 className="text-base font-bold text-gray-900 truncate">{remark.title}</h3>
                      <div className="flex items-center text-xs font-medium text-gray-500 mt-1 sm:mt-0 flex-shrink-0">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {new Date(remark.date).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                      From: <span className="text-gray-700">{remark.authorRole}</span> • {remark.authorName}
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 leading-relaxed border border-gray-100">
                      {remark.content || <span className="italic text-gray-400">No content provided</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReviewRemarks;
