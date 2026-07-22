import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { projectService, auditService, studentService, guideService } from '@/firebase/services';
import { exportToCsv } from '@/utils/csvExport';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Loader2, Download, Edit2, Trash2 } from 'lucide-react';

const ProjectManagement = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    domain: '',
    teamName: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prData, stData, guData] = await Promise.all([
        projectService.getAll(),
        studentService.getAll(),
        guideService.getAll()
      ]);
      setProjects(prData || []);
      setStudents(stData || []);
      setGuides(guData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (project) => {
    setIsEdit(true);
    setFormData({
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      domain: project.domain || '',
      teamName: project.teamName || '',
      status: project.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({ id: '', title: '', description: '', domain: '', teamName: '', status: 'Active' });
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
        prevData = projects.find(p => p.id === formData.id);
        await projectService.update(formData.id, payload);
      } else {
        await projectService.create({
          ...payload,
          createdAt: new Date().toISOString()
        });
      }

      await auditService.log(
        currentUser.uid, 
        isEdit ? 'UPDATE_PROJECT' : 'CREATE_PROJECT', 
        'Project', 
        prevData, 
        payload
      );

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Error saving project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (project) => {
    const assigned = students.filter(s => s.projectId === project.id);
    if (assigned.length > 0) {
      alert(`Cannot delete this project. It is currently assigned to ${assigned.length} student(s).`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${project.title}?`)) {
      try {
        await projectService.delete(project.id);
        await auditService.log(currentUser.uid, 'DELETE_PROJECT', 'Project', project, null);
        fetchData();
      } catch (err) {
        console.error("Error deleting project:", err);
      }
    }
  };

  const handleExport = () => {
    const dataToExport = projects.map(p => {
      const assignedCount = students.filter(s => s.projectId === p.id).length;
      return {
        'Title': p.title,
        'Domain': p.domain,
        'Team Name': p.teamName,
        'Status': p.status,
        'Assigned Students': assignedCount
      };
    });
    exportToCsv('capstoneflow_projects.csv', dataToExport);
  };

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      header: 'Project Details', 
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.title || 'Untitled Project'}</p>
          <p className="text-xs text-gray-500">Team: {row.teamName || 'N/A'}</p>
        </div>
      ) 
    },
    { header: 'Domain', accessor: 'domain' },
    { 
      header: 'Guide', 
      render: (row) => {
        const guideId = row.guideId || students.find(s => s.projectId === row.id)?.guideId;
        const guide = guides.find(g => g.id === guideId);
        return guide ? <span className="text-gray-900">{guide.name}</span> : <span className="text-gray-400 italic">Unassigned</span>;
      }
    },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'Completed' ? 'success' : row.status === 'Active' ? 'primary' : 'default'}>
          {row.status || 'Pending'}
        </Badge>
      )
    },
    { 
      header: 'Action', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenEdit(row)} className="text-primary-600 hover:text-primary-900" title="Edit Project">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700" title="Delete Project">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) 
    },
  ];

  return (
    <DashboardLayout navigationItems={adminNavigation} title="CapstoneFlow - Project Administration">
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search by Title, Team or Domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={handleOpenAdd} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" /> Add Project
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : (
            <Table columns={columns} data={filteredProjects} />
          )}
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEdit ? "Edit Project" : "Add New Project"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 border resize-y"
                  rows={3}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <Input required value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} placeholder="e.g. Machine Learning" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <Input required value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                {isEdit ? 'Update Project' : 'Save Project'}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default ProjectManagement;
