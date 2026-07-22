import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { remarkService } from '@/firebase/services/remarkService';
import { studentService } from '@/firebase/services/studentService';
import { notificationService } from '@/firebase/services/notificationService';
import { Loader2, Search, MessageSquare, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

const Remarks = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedStudent = searchParams.get('student');

  const [remarks, setRemarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    studentId: preselectedStudent || '',
    title: '',
    content: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData(currentUser.uid);
    }
  }, [currentUser]);

  useEffect(() => {
    if (preselectedStudent && students.length > 0) {
      const match = students.find(s => s.id === preselectedStudent || s.uid === preselectedStudent);
      const sId = match ? (match.id || match.uid) : preselectedStudent;
      setFormData(prev => ({ ...prev, studentId: sId }));
      setIsModalOpen(true);
    }
  }, [preselectedStudent, students]);

  const fetchData = async (uid) => {
    try {
      setLoading(true);
      setError(null);
      const [remarksData, studentsData, allStudents] = await Promise.all([
        remarkService.getRemarksByAuthor(uid),
        studentService.getByGuideId(uid),
        studentService.getAll()
      ]);

      const studentMap = new Map();
      allStudents.forEach(s => {
        const key1 = s.id;
        const key2 = s.uid;
        if (key1) studentMap.set(key1, s);
        if (key2) studentMap.set(key2, s);
      });
      
      const enrichedRemarks = remarksData.map(remark => {
        const student = studentMap.get(remark.studentId) || studentsData.find(s => s.id === remark.studentId || s.uid === remark.studentId);
        return {
          ...remark,
          studentName: student?.name || remark.studentName || 'Student',
          rollNumber: student?.rollNumber || student?.rollNo || remark.rollNumber || 'N/A',
          projectTitle: student?.projectTitle || remark.projectTitle || 'N/A'
        };
      });

      setRemarks(enrichedRemarks.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setStudents(studentsData.length > 0 ? studentsData : allStudents);
    } catch (err) {
      console.error("Error fetching remarks:", err);
      setError("Failed to load remarks data.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({ id: null, studentId: '', title: '', content: '' });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (remark) => {
    setFormData({
      id: remark.id,
      studentId: remark.studentId,
      title: remark.title,
      content: remark.content
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this remark?')) {
      try {
        await remarkService.delete(id);
        setRemarks(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        console.error("Failed to delete:", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid || !formData.studentId) return;
    
    setSubmitting(true);
    try {
      const selectedStudent = students.find(s => s.id === formData.studentId || s.uid === formData.studentId);
      
      const payload = {
        studentId: formData.studentId,
        studentName: selectedStudent?.name || '',
        rollNumber: selectedStudent?.rollNumber || selectedStudent?.rollNo || '',
        projectTitle: selectedStudent?.projectTitle || '',
        authorId: currentUser.uid,
        title: formData.title,
        content: formData.content,
        updatedAt: new Date().toISOString()
      };

      if (isEditMode) {
        await remarkService.update(formData.id, payload);
      } else {
        payload.createdAt = new Date().toISOString();
        payload.projectId = selectedStudent?.projectId || null;
        await remarkService.create(payload);
        
        await notificationService.create({
          userId: formData.studentId,
          title: 'New Remark from Guide',
          message: `Your guide has added a new remark: ${formData.title}`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      setIsModalOpen(false);
      fetchData(currentUser.uid);
    } catch (err) {
      console.error("Failed to save remark:", err);
      setError("Failed to save remark.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRemarks = useMemo(() => {
    if (!searchQuery) return remarks;
    const lower = searchQuery.toLowerCase();
    return remarks.filter(r => 
      r.studentName?.toLowerCase().includes(lower) || 
      r.rollNumber?.toLowerCase().includes(lower) ||
      r.title?.toLowerCase().includes(lower) ||
      r.projectTitle?.toLowerCase().includes(lower)
    );
  }, [remarks, searchQuery]);

  const columns = [
    { header: 'Student Name', accessor: 'studentName', render: (row) => (
      <div>
        <p className="font-semibold text-gray-900">{row.studentName}</p>
        <p className="text-xs text-gray-500">{row.rollNumber}</p>
      </div>
    )},
    { header: 'Project', accessor: 'projectTitle', render: (row) => <div className="max-w-[150px] truncate">{row.projectTitle}</div> },
    { header: 'Remark', accessor: 'title', render: (row) => (
      <div>
        <p className="font-medium text-gray-900">{row.title}</p>
        <p className="text-sm text-gray-500 truncate max-w-[250px]">{row.content}</p>
      </div>
    )},
    { header: 'Date', accessor: 'createdAt', render: (row) => <span className="text-sm text-gray-600">{new Date(row.updatedAt || row.createdAt).toLocaleDateString()}</span> },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} className="text-blue-600">
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-500">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    )}
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Review Remarks">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - Review Remarks">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary-600" /> Review Remarks
            </h1>
            <p className="text-sm text-gray-500 mt-1">Provide continuous feedback and track student progress logs.</p>
          </div>
          <Button onClick={openAddModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Remark
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <Card>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="w-full md:w-96 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by student, roll number, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
               <Badge variant="primary" className="px-3 py-1.5 text-sm font-medium">
                 {filteredRemarks.length} Remarks
               </Badge>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            {filteredRemarks.length > 0 ? (
              <Table columns={columns} data={filteredRemarks} />
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={MessageSquare}
                  title="No Remarks Found"
                  description="You haven't provided any remarks yet."
                />
              </div>
            )}
          </div>
        </Card>

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Remark" : "Add New Remark"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white"
                value={formData.studentId}
                onChange={e => setFormData({...formData, studentId: e.target.value})}
                disabled={isEditMode}
              >
                <option value="" disabled>Select a student</option>
                {students.map(s => {
                  const sId = s.id || s.uid;
                  const roll = s.rollNumber || s.rollNo || 'N/A';
                  return (
                    <option key={sId} value={sId}>{s.name} ({roll})</option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remark Title</label>
              <Input 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Architecture Feedback"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Feedback</label>
              <textarea 
                required
                rows={5}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Provide constructive feedback here..."
              />
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? 'Update Remark' : 'Save Remark')}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default Remarks;
