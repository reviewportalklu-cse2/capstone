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

const StudentManagement = () => {
  const navigationItems = useAdminNavigation();

  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [guides, setGuides] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    rollNo: '',
    batch: '',
    section: '',
    guideId: '',
    reviewerId: '',
    facultyId: '',
    projectId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stData, guData, reData, faData, prData] = await Promise.all([
        studentService.getAll(),
        guideService.getAll(),
        reviewerService.getAll(),
        facultyService.getAll(),
        projectService.getAll()
      ]);
      setStudents(stData || []);
      setGuides(guData || []);
      setReviewers(reData || []);
      setFaculty(faData || []);
      setProjects(prData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (student) => {
    setIsEdit(true);
    setFormData({
      id: student.id,
      name: student.name || '',
      email: student.email || '',
      rollNo: student.rollNo || '',
      batch: student.batch || '',
      section: student.section || '',
      guideId: student.guideId || '',
      reviewerId: student.reviewerId || '',
      facultyId: student.facultyId || '',
      projectId: student.projectId || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({ id: '', name: '', email: '', rollNo: '', batch: '', section: '', guideId: '', reviewerId: '', facultyId: '', projectId: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      delete payload.id;
      
      let studentId = formData.id;
      let prevData = null;

      if (isEdit) {
        prevData = students.find(s => s.id === studentId);
        await studentService.update(studentId, {
          name: payload.name,
          email: payload.email,
          rollNo: payload.rollNo,
          batch: payload.batch,
          section: payload.section
        });
      } else {
        studentId = await studentService.create({
          ...payload,
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }

      // Sync relationships atomically
      await adminService.assignStudent(studentId, {
        guideId: payload.guideId,
        reviewerId: payload.reviewerId,
        facultyId: payload.facultyId,
        projectId: payload.projectId
      });

      // Audit Log
      await auditService.log(
        currentUser.uid, 
        isEdit ? 'UPDATE_STUDENT' : 'CREATE_STUDENT', 
        'Student', 
        prevData, 
        payload
      );

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Error saving student. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      try {
        await studentService.delete(student.id);
        await auditService.log(currentUser.uid, 'DELETE_STUDENT', 'Student', student, null);
        fetchData();
      } catch (err) {
        console.error("Error deleting student:", err);
      }
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGuideName = (id) => guides.find(g => g.id === id)?.name || 'Unassigned';
  const getReviewerName = (id) => reviewers.find(r => r.id === id)?.name || 'Unassigned';

  const columns = [
    { header: 'Roll No.', accessor: 'rollNo' },
    { 
      header: 'Student', 
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ) 
    },
    { header: 'Batch', accessor: 'batch' },
    { 
      header: 'Assigned Guide', 
      render: (row) => (
        <span className={row.guideId ? 'text-gray-900' : 'text-gray-400 italic'}>
          {getGuideName(row.guideId)}
        </span>
      )
    },
    { 
      header: 'Assigned Reviewer', 
      render: (row) => (
        <span className={row.reviewerId ? 'text-gray-900' : 'text-gray-400 italic'}>
          {getReviewerName(row.reviewerId)}
        </span>
      )
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
          {loading ? (
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
