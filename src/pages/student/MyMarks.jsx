import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/firebase/services/studentService';
import { reviewService } from '@/firebase/services/reviewService';
import { marksService } from '@/firebase/services/marksService';
import { Loader2, Award, FileText, CheckCircle, Calculator, BookOpen } from 'lucide-react';

const MyMarks = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [facultyMarks, setFacultyMarks] = useState([]);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchMarks(currentUser.uid);
    }
  }, [currentUser]);

  const fetchMarks = async (uid) => {
    try {
      setLoading(true);
      const studentData = await studentService.getById(uid);
      if (studentData) {
        // Fetch formal reviews (Reviewer) and faculty marks (Internal)
        const [revData, facData] = await Promise.all([
          reviewService.getByStudentId(uid),
          marksService.getByRollNumber ? marksService.getByRollNumber(studentData.rollNumber) : []
        ]);
        
        setReviews(revData.filter(r => r.status === 'Final'));
        setFacultyMarks(facData || []);
      }
    } catch (err) {
      console.error('Error fetching marks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - My Marks">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const hasMarks = reviews.length > 0 || facultyMarks.length > 0;

  if (!hasMarks) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - My Marks">
        <div className="p-6 max-w-4xl mx-auto py-12">
          <EmptyState 
            icon={Award}
            title="No Marks Available" 
            description="Your evaluations have not been published yet. Marks will appear here once finalized by your reviewer or faculty." 
          />
        </div>
      </DashboardLayout>
    );
  }

  let totalReviewScore = 0;
  reviews.forEach(r => totalReviewScore += (r.totalScore || 0));
  const avgReviewScore = reviews.length > 0 ? Math.round(totalReviewScore / reviews.length) : 0;

  let totalFacultyScore = 0;
  facultyMarks.forEach(f => totalFacultyScore += (f.marks || 0));
  const avgFacultyScore = facultyMarks.length > 0 ? Math.round(totalFacultyScore / facultyMarks.length) : 0;

  return (
    <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - My Marks">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-primary-600" /> Academic Performance
          </h1>
          <p className="text-sm text-gray-500 mt-1">View your external review scores and internal faculty marks.</p>
        </div>

        {/* Top-Level Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                <Calculator className="w-4 h-4" /> Average External Score
              </span>
              <span className="text-3xl font-bold text-indigo-700 mt-2">{avgReviewScore} <span className="text-lg text-indigo-400">/ 100</span></span>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Average Internal Score
              </span>
              <span className="text-3xl font-bold text-emerald-700 mt-2">{avgFacultyScore} <span className="text-lg text-emerald-400">/ 100</span></span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">External Reviews</h3>
            {reviews.length > 0 ? reviews.map((review, idx) => (
              <Card key={idx} className="border-l-4 border-l-indigo-500 shadow-sm">
                <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">{review.reviewType}</h4>
                    <p className="text-xs text-gray-500 mt-1">Evaluated on {new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-indigo-100 px-4 py-2 rounded-lg text-center">
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Total Score</p>
                    <p className="text-2xl font-bold text-indigo-900">{review.totalScore}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase">Presentation</p>
                    <p className="font-bold text-gray-900 mt-1">{review.scores?.presentation || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase">Technical</p>
                    <p className="font-bold text-gray-900 mt-1">{review.scores?.technical || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase">Q & A</p>
                    <p className="font-bold text-gray-900 mt-1">{review.scores?.qa || 0}</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-blue-800 uppercase mb-1">Reviewer Feedback</p>
                  <p className="text-sm text-blue-900 italic">"{review.remarks}"</p>
                </div>
              </Card>
            )) : (
               <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                 <p className="text-gray-500 text-sm">No external reviews published yet.</p>
               </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">Internal Assessments</h3>
            {facultyMarks.length > 0 ? facultyMarks.map((mark, idx) => (
              <Card key={idx} className="border-l-4 border-l-emerald-500 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">Faculty Internal Evaluation</h4>
                    <p className="text-xs text-gray-500 mt-1">Evaluated on {new Date(mark.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-emerald-100 px-4 py-2 rounded-lg text-center flex items-center justify-center">
                    <p className="text-2xl font-bold text-emerald-900">{mark.marks} <span className="text-sm font-normal text-emerald-700">/ {mark.total}</span></p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Faculty Comments</p>
                  <p className="text-sm text-gray-800">"{mark.comments}"</p>
                </div>
              </Card>
            )) : (
              <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                 <p className="text-gray-500 text-sm">No internal marks published yet.</p>
               </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyMarks;
