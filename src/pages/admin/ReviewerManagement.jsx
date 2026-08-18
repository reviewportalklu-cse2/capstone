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
import { reviewerService, auditService, studentService } from '@/firebase/services';
import { exportToCsv } from '@/utils/csvExport';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Loader2, Download, Edit2, Trash2 } from 'lucide-react';
import { resolveStudentRelations, resolveTeamRelations, resolveReviewerRelationships } from '@/utils/relationshipResolver';

const ReviewerManagement = () => {
  const navigationItems = useAdminNavigation();

  const { currentUser } = useAuth();
  const dataContext = useData() || {};
  const { 
    reviewers = [], 
    students = [], 
    teams = [], 
    projects = [], 
    guides = [], 
    faculty = [], 
    reviewCycles = [], 
    reviewerAssignments = [], 
    dataLoading 
  } = dataContext;

  const resolveReviewerMetrics = (row) => {
    const { teamCount, studentCount } = resolveReviewerRelationships(row, dataContext);
    return {
      teamsCount: teamCount,
      studentsCount: studentCount
    };
  };
    
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    department: '',
    assignedBatch: ''
  });

  const activeCycle = reviewCycles.find(c => c.status === 'Active') || reviewCycles[0] || null;

  const handleOpenEdit = (reviewer) => {
    setIsEdit(true);
    setFormData({
      id: reviewer.id,
      name: reviewer.name || '',
      email: reviewer.email || '',
      department: reviewer.department || '',
      assignedBatch: reviewer.assignedBatch || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({ id: '', name: '', email: '', department: '', assignedBatch: '' });
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
        prevData = reviewers.find(r => r.id === formData.id);
        await reviewerService.update(formData.id, payload);
      } else {
        await reviewerService.create({
          ...payload,
          createdAt: new Date().toISOString()
        });
      }

      await auditService.log(
        currentUser?.uid || 'admin', 
        isEdit ? 'UPDATE_REVIEWER' : 'CREATE_REVIEWER', 
        'Reviewer', 
        prevData, 
        payload
      );

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving reviewer:", error);
      alert("Error saving reviewer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rev) => {
    const assigned = students.filter(s => s.reviewerId === rev.id);
    if (assigned.length > 0) {
      alert(`Cannot delete this reviewer. They have ${assigned.length} student(s) currently assigned.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${rev.name}?`)) {
      try {
        await reviewerService.delete(rev.id);
        await auditService.log(currentUser?.uid || 'admin', 'DELETE_REVIEWER', 'Reviewer', rev, null);
      } catch (err) {
        console.error("Error deleting reviewer:", err);
      }
    }
  };

  const handleExport = () => {
    const dataToExport = reviewers.map(r => {
      const { teamsCount, studentsCount } = resolveReviewerMetrics(r);
      return {
        'Name': r.name || r['Reviewer Name'] || '',
        'Email': r.email || r.Email || '',
        'Department': r.department || r.Department || '',
        'Assigned Teams': teamsCount,
        'Assigned Students': studentsCount
      };
    });
    exportToCsv('capstoneflow_reviewers.csv', dataToExport);
  };

  const filteredReviewers = reviewers.filter(reviewer => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (reviewer.name || reviewer['Reviewer Name'] || reviewer.Name || '').toLowerCase().includes(term) || 
      (reviewer.email || reviewer.Email || '').toLowerCase().includes(term) ||
      (reviewer.department || reviewer.Department || '').toLowerCase().includes(term)
    );
  });

  const columns = [
    { 
      header: 'Reviewer', 
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.name || row['Reviewer Name'] || row.Name || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{row.email || row.Email || 'No Email'}</p>
        </div>
      ) 
    },
    { 
      header: 'Current Cycle', 
      render: (row) => (
        <Badge variant="primary" className="text-[10px]">
          {activeCycle?.reviewName || activeCycle?.name || 'Cycle 1'}
        </Badge>
      )
    },
    { 
      header: 'Assigned Teams (Active)', 
      render: (row) => {
        const { teamsCount } = resolveReviewerMetrics(row);
        return (
          <Badge variant={teamsCount > 0 ? 'primary' : 'default'}>
            {teamsCount} Team{teamsCount !== 1 ? 's' : ''}
          </Badge>
        );
      }
    },
    { 
      header: 'Assigned Students (Active)', 
      render: (row) => {
        const { studentsCount } = resolveReviewerMetrics(row);
        return (
          <Badge variant={studentsCount > 0 ? 'success' : 'default'}>
            {studentsCount} Student{studentsCount !== 1 ? 's' : ''}
          </Badge>
        );
      }
    },
    { 
      header: 'Action', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenEdit(row)} className="text-primary-600 hover:text-primary-900" title="Edit Profile">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700" title="Delete Reviewer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) 
    },
  ];

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="KL CSE Capstone Portal - Reviewer Administration">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navigationItems} title="KL CSE Capstone Portal - Reviewer Administration">
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search by Name, Email or Department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={handleOpenAdd} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" /> Add Reviewer
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          {dataLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : (
            <Table columns={columns} data={filteredReviewers} />
          )}
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEdit ? "Edit Reviewer Profile" : "Add New Reviewer"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <Input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Batch</label>
                <Input value={formData.assignedBatch} onChange={e => setFormData({...formData, assignedBatch: e.target.value})} placeholder="e.g. 2026" />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                {isEdit ? 'Update Profile' : 'Save Reviewer'}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default ReviewerManagement;
