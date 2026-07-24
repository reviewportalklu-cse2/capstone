import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { useAdminStats } from '@/contexts/AdminStatsContext';
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

const ReviewerManagement = () => {
  const navigationItems = useAdminNavigation();

  const { currentUser } = useAuth();
  const { data, loading: contextLoading } = useAdminStats();
  const { reviewers, students } = data;
  
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
        currentUser.uid, 
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

  const handleDelete = async (reviewer) => {
    const assigned = students.filter(s => s.reviewerId === reviewer.id);
    if (assigned.length > 0) {
      alert(`Cannot delete this reviewer. They have ${assigned.length} student(s) currently assigned.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${reviewer.name}?`)) {
      try {
        await reviewerService.delete(reviewer.id);
        await auditService.log(currentUser.uid, 'DELETE_REVIEWER', 'Reviewer', reviewer, null);
      } catch (err) {
        console.error("Error deleting reviewer:", err);
      }
    }
  };

  const handleExport = () => {
    const dataToExport = reviewers.map(r => {
      const assignedCount = students.filter(s => s.reviewerId === r.id).length;
      return {
        'Name': r.name,
        'Email': r.email,
        'Department': r.department,
        'Assigned Batch': r.assignedBatch,
        'Assigned Students': assignedCount
      };
    });
    exportToCsv('capstoneflow_reviewers.csv', dataToExport);
  };

  const filteredReviewers = reviewers.filter(reviewer => 
    reviewer.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    reviewer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reviewer.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      header: 'Reviewer', 
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ) 
    },
    { header: 'Department', accessor: 'department' },
    { header: 'Batch', accessor: 'assignedBatch' },
    { 
      header: 'Assigned Students', 
      render: (row) => {
        const count = students.filter(s => s.reviewerId === row.id).length;
        return (
          <Badge variant={count > 0 ? 'primary' : 'default'}>
            {count} Student{count !== 1 ? 's' : ''}
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
          {contextLoading ? (
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
