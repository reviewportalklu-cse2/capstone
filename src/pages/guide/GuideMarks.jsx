import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/firebase/services/studentService';
import { marksService } from '@/firebase/services/marksService';
import { notificationService } from '@/firebase/services/notificationService';
import { Loader2, Search, Award, Save, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';

const GuideMarks = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedStudent = searchParams.get('student');

  const [students, setStudents] = useState([]);
  const [guideMarks, setGuideMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    studentId: preselectedStudent || '',
    marks: 0,
    comments: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData(currentUser.uid);
    }
  }, [currentUser]);

  const fetchData = async (guideId) => {
    try {
      setLoading(true);
      setError(null);
      const [stData, marksData] = await Promise.all([
        studentService.getByGuideId(guideId),
        marksService.getGuideMarksByGuideId(guideId)
      ]);
      setStudents(stData);
      setGuideMarks(marksData);

      if (preselectedStudent) {
        const match = stData.find(s => s.id === preselectedStudent || s.uid === preselectedStudent);
        const sId = match ? (match.id || match.uid) : preselectedStudent;
        setFormData(prev => ({ ...prev, studentId: sId }));
        loadExistingMark(sId, marksData);
      }
    } catch (err) {
      console.error("Error fetching data for guide marks:", err);
      setError("Failed to load students or marks.");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingMark = (studentId, marksList = guideMarks) => {
    const existing = marksList.find(m => m.studentId === studentId);
    if (existing) {
      setFormData({
        id: existing.id,
        studentId: existing.studentId,
        marks: existing.marks || 0,
        comments: existing.comments || ''
      });
    } else {
      setFormData({
        id: null,
        studentId: studentId,
        marks: 0,
        comments: ''
      });
    }
  };

  const handleStudentSelect = (studentId) => {
    setFormData(prev => ({ ...prev, studentId }));
    setSuccess(null);
    setError(null);
    loadExistingMark(studentId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId) {
      setError("Please select a student to award marks.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedStudent = students.find(s => s.id === formData.studentId || s.uid === formData.studentId);
      
      const payload = {
        guideId: currentUser.uid,
        studentId: formData.studentId,
        studentName: selectedStudent?.name || '',
        rollNumber: selectedStudent?.rollNumber || selectedStudent?.rollNo || '',
        projectTitle: selectedStudent?.projectTitle || '',
        marks: parseInt(formData.marks) || 0,
        total: 100,
        comments: formData.comments,
        submittedAt: new Date().toISOString()
      };

      if (formData.id) {
        await marksService.updateGuideMark(formData.id, payload);
      } else {
        const newDoc = await marksService.addGuideMark(payload);
        setFormData(prev => ({ ...prev, id: newDoc.id }));
      }

      await notificationService.create({
        userId: formData.studentId,
        title: 'Guide Internal Marks Published',
        message: `Your guide has awarded internal marks: ${formData.marks}/100.`,
        read: false,
        createdAt: new Date().toISOString()
      });

      setSuccess("Guide marks saved successfully.");
      fetchData(currentUser.uid);
    } catch (err) {
      console.error("Error saving guide marks:", err);
      setError("Failed to save guide marks.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStudentObj = students.find(s => s.id === formData.studentId || s.uid === formData.studentId);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const lower = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name?.toLowerCase().includes(lower) || 
      (s.rollNumber || s.rollNo)?.toLowerCase().includes(lower) ||
      s.projectTitle?.toLowerCase().includes(lower)
    );
  }, [students, searchQuery]);

  const columns = [
    { header: 'Roll No.', accessor: 'rollNumber', render: (row) => <span className="font-semibold text-gray-900">{row.rollNumber || row.rollNo || 'N/A'}</span> },
    { header: 'Student Name', accessor: 'name' },
    { header: 'Project', accessor: 'projectTitle', render: (row) => <div className="max-w-[200px] truncate">{row.projectTitle || 'N/A'}</div> },
    { header: 'Guide Marks', render: (row) => {
      const sId = row.id || row.uid;
      const mark = guideMarks.find(m => m.studentId === sId);
      return mark ? (
        <span className="font-bold text-emerald-700">{mark.marks} / 100</span>
      ) : (
        <Badge variant="secondary">Pending</Badge>
      );
    }},
    { header: 'Actions', render: (row) => {
      const sId = row.id || row.uid;
      return (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleStudentSelect(sId)}
          className="text-xs flex items-center gap-1"
        >
          <Edit2 className="w-3 h-3" /> Enter Marks
        </Button>
      );
    }}
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Guide Marks Entry">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Guide Marks Entry">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-primary-600" /> Guide Internal Marks Entry
          </h1>
          <p className="text-sm text-gray-500 mt-1">Award internal mentoring assessment marks to assigned capstone students.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-200">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2">
            <Card>
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="w-full md:w-80 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search assigned students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                {filteredStudents.length > 0 ? (
                  <Table columns={columns} data={filteredStudents} />
                ) : (
                  <div className="py-12">
                    <EmptyState
                      icon={Award}
                      title="No Students Found"
                      description="You have no assigned students to award marks."
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card title="Guide Marks Form">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                  <select
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border bg-white"
                    value={formData.studentId}
                    onChange={e => handleStudentSelect(e.target.value)}
                  >
                    <option value="" disabled>-- Select Assigned Student --</option>
                    {students.map(s => {
                      const sId = s.id || s.uid;
                      return (
                        <option key={sId} value={sId}>{s.name} ({s.rollNumber || s.rollNo})</option>
                      );
                    })}
                  </select>
                </div>

                {selectedStudentObj && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <p className="font-bold text-gray-900">{selectedStudentObj.name}</p>
                    <p className="text-gray-500">Roll No: {selectedStudentObj.rollNumber || selectedStudentObj.rollNo}</p>
                    <p className="text-gray-600 truncate">Project: {selectedStudentObj.projectTitle || 'N/A'}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal Marks (out of 100)</label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.marks}
                    onChange={e => setFormData({...formData, marks: Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100)})}
                    placeholder="Enter score 0 - 100"
                    disabled={!formData.studentId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guide Feedback / Comments</label>
                  <textarea 
                    rows={4}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5 border resize-y"
                    value={formData.comments}
                    onChange={e => setFormData({...formData, comments: e.target.value})}
                    placeholder="Provide constructive assessment comments..."
                    disabled={!formData.studentId}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting || !formData.studentId}
                  className="w-full justify-center flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> {submitting ? 'Saving...' : 'Save Guide Marks'}
                </Button>
              </form>
            </Card>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default GuideMarks;
