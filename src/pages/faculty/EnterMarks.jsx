import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { facultyNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { studentService } from '@/firebase/services/studentService';
import { marksService } from '@/firebase/services/marksService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const EnterMarks = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedStudent = searchParams.get('student');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    studentId: preselectedStudent || '',
    marks: '',
    total: '50', // Default total marks for faculty internal evaluation
    comments: ''
  });
  
  useEffect(() => {
    if (currentUser?.uid) {
      fetchStudents(currentUser.uid);
    }
  }, [currentUser]);

  const fetchStudents = async (uid) => {
    try {
      setLoading(true);
      const data = await studentService.getByFacultyId(uid);
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load your assigned students.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);
    
    try {
      const payload = {
        studentId: formData.studentId,
        facultyId: currentUser.uid,
        marks: Number(formData.marks),
        total: Number(formData.total),
        comments: formData.comments,
        submittedAt: new Date().toISOString()
      };

      // Ensure marksService exists and has addFacultyMark or similar.
      // We will implement addFacultyMark if missing.
      if (marksService.addFacultyMark) {
        await marksService.addFacultyMark(payload);
      } else {
        // Fallback generic create
        await marksService.create(payload);
      }
      
      setSuccess(true);
      setFormData(prev => ({ ...prev, marks: '', comments: '' }));
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Error submitting marks:", error);
      setError("Failed to submit marks. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={facultyNavigation} title="CapstoneFlow - Enter Marks">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="CapstoneFlow - Enter Marks">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Enter Marks</h1>
          <p className="text-sm text-gray-500 mt-1">Evaluate student performance for internal assessments.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Marks submitted successfully and synced to Firestore!
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Student</label>
                <select
                  name="studentId"
                  required
                  value={formData.studentId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="" disabled>Select a student</option>
                  {students.map(student => (
                    <option key={student.uid} value={student.uid}>
                      {student.name} ({student.rollNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Assessment Type</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-gray-50 text-gray-700" disabled>
                  <option>Internal Evaluation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Marks Awarded</label>
                <Input
                  type="number"
                  name="marks"
                  required
                  min="0"
                  max={formData.total}
                  value={formData.marks}
                  onChange={handleChange}
                  placeholder="e.g. 42"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Total Marks (Max)</label>
                <Input
                  type="number"
                  name="total"
                  required
                  min="1"
                  value={formData.total}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Comments / Remarks</label>
              <textarea
                name="comments"
                rows="4"
                value={formData.comments}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Provide constructive feedback..."
              ></textarea>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
              <Button type="button" variant="outline" onClick={() => setFormData(prev => ({ ...prev, marks: '', comments: '' }))}>
                Clear
              </Button>
              <Button type="submit" disabled={submitting || !formData.studentId}>
                {submitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
                ) : 'Submit Marks'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EnterMarks;
