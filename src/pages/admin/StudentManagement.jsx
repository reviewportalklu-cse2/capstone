import { useData } from '@/contexts/DataContext';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { adminService, auditService, studentService, guideService, reviewerService, facultyService, projectService } from '@/firebase/services';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Upload, Loader2, Download, Edit2, Trash2 } from 'lucide-react';

import { resolveStudentRelations } from '@/utils/relationshipResolver';

const StudentManagement = () => {
  const navigationItems = useAdminNavigation();

  const { currentUser } = useAuth();
  const { students = [], guides = [], faculty = [], reviewers = [], teams = [], projects = [], reviewCycles = [], reviewerAssignments = [], dataLoading } = useData();
    
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    rollNo: '',
    name: '',
    email: '',
    guideId: '',
    facultyId: '',
    reviewerId: '',
    teamId: '',
    projectId: ''
  });

  const handleOpenEdit = (student) => {
    setIsEdit(true);
    const rel = resolveStudentRelations(student, { teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments });
    setFormData({
      id: student.id,
      rollNo: student.rollNo || student.rollNumber || student['Roll Number'] || '',
      name: student.name || student['Student Name'] || '',
      email: student.email || student.Email || '',
      guideId: student.guideId || rel.guideId || '',
      facultyId: student.facultyId || rel.facultyId || '',
      reviewerId: student.reviewerId || rel.reviewerId || '',
      teamId: student.teamId || rel.teamId || '',
      projectId: student.projectId || rel.projectId || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      id: '', rollNo: '', name: '', email: '',
      guideId: '', facultyId: '', reviewerId: '', teamId: '', projectId: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      delete payload.id;
      
      let prevData = null;

      if (isEdit) {
        prevData = students.find(s => s.id === formData.id);
        await adminService.assignStudent(formData.id, payload);
        await auditService.log(currentUser?.uid || 'admin', 'UPDATE_STUDENT', 'students', formData.id, { before: prevData, after: payload });
      } else {
        const newId = await studentService.createStudent(payload);
        await auditService.log(currentUser?.uid || 'admin', 'CREATE_STUDENT', 'students', newId, { after: payload });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save student: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        const prevData = students.find(s => s.id === id);
        await studentService.deleteStudent(id);
        await auditService.log(currentUser.uid, 'DELETE_STUDENT', 'students', id, { before: prevData });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (student.name || '').toLowerCase().includes(term) || 
      (student.rollNo || student.rollNumber || student['Roll Number'] || '').toLowerCase().includes(term) ||
      (student.email || '').toLowerCase().includes(term)
    );
  });

  const columns = [
    { 
      header: 'Roll No.', 
      render: (row) => row.rollNo || row.rollNumber || row['Roll Number'] || row['Roll No'] || 'N/A'
    },
    { 
      header: 'Student', 
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.name || row['Student Name'] || row.Name || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{row.email || row.Email || 'No Email'}</p>
        </div>
      ) 
    },
    { 
      header: 'Batch', 
      render: (row) => {
        const rel = resolveStudentRelations(row, { teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments });
        return <span className="font-medium text-gray-900">{rel.batch || '2026'}</span>;
      }
    },
    { 
      header: 'Assigned Guide', 
      render: (row) => {
        const rel = resolveStudentRelations(row, { teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments });
        return (
          <span className={rel.guideName !== 'Unassigned' ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}>
            {rel.guideName}
          </span>
        );
      }
    },
    { 
      header: 'Assigned Faculty', 
      render: (row) => {
        const rel = resolveStudentRelations(row, { teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments });
        return (
          <span className={rel.facultyName !== 'Unassigned' ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}>
            {rel.facultyName}
          </span>
        );
      }
    },
    { 
      header: 'Assigned Reviewer', 
      render: (row) => {
        const rel = resolveStudentRelations(row, { teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments });
        return (
          <span className={rel.reviewerName !== 'Unassigned' ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}>
            {rel.reviewerName}
          </span>
        );
      }
    },
    { 
      header: 'Team', 
      render: (row) => {
        const rel = resolveStudentRelations(row, { teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments });
        return (
          <span className={rel.teamName !== 'Unassigned' ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}>
            {rel.teamName}
          </span>
        );
      }
    },
    { 
      header: 'Project', 
      render: (row) => {
        const rel = resolveStudentRelations(row, { teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments });
        return (
          <span className={rel.projectTitle !== 'Unassigned' ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}>
            {rel.projectTitle}
          </span>
        );
      }
    },
    { 
      header: 'Action', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenEdit(row)} className="text-primary-600 hover:text-primary-900" title="Edit Assignments">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700" title="Delete Student">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) 
    },
  ];

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="KL CSE Capstone Portal - Student Administration">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navigationItems} title="KL CSE Capstone Portal - Student Administration">
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search by Roll No, Name or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={handleOpenAdd} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          {dataLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : (
            <Table columns={columns} data={filteredStudents} />
          )}
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEdit ? "Edit Student & Assignments" : "Add New Student"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <h3 className="font-semibold text-gray-900 border-b pb-2 mb-2">Student Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <Input required value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <Input required value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <Input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 border-b pb-2 mt-6 mb-2">Relational Assignments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Guide</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={formData.guideId}
                  onChange={e => setFormData({...formData, guideId: e.target.value})}
                >
                  <option value="">-- Unassigned --</option>
                  {guides.map(g => <option key={g.id} value={g.id}>{g.name} ({g.department})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Reviewer</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={formData.reviewerId}
                  onChange={e => setFormData({...formData, reviewerId: e.target.value})}
                >
                  <option value="">-- Unassigned --</option>
                  {reviewers.map(r => <option key={r.id} value={r.id}>{r.name} - Batch {r.assignedBatch}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty (Classroom)</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={formData.facultyId}
                  onChange={e => setFormData({...formData, facultyId: e.target.value})}
                >
                  <option value="">-- Unassigned --</option>
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Project</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={formData.projectId}
                  onChange={e => setFormData({...formData, projectId: e.target.value})}
                >
                  <option value="">-- Unassigned --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title || p.teamName}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                {isEdit ? 'Update Assignments' : 'Create & Assign'}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default StudentManagement;
