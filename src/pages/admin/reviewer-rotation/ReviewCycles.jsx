import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { useData } from '@/contexts/DataContext';
import { FirestoreService } from '@/firebase/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import { CalendarDays, Play, Square, Archive, Plus, Edit2, Layers, ShieldCheck } from 'lucide-react';

const ReviewCycles = () => {
  const { reviewCycles, rubrics, dataLoading } = useData();
  const { currentUser } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [formData, setFormData] = useState({
    reviewName: '',
    description: '',
    weekNumber: '',
    startDate: '',
    endDate: '',
    targetRole: 'all',
    rubricId: '',
    status: 'Draft'
  });

  const handleOpenCreate = () => {
    setEditingCycle(null);
    setFormData({
      reviewName: '',
      description: '',
      weekNumber: '',
      startDate: '',
      endDate: '',
      targetRole: 'all',
      rubricId: '',
      status: 'Draft'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cycle) => {
    setEditingCycle(cycle);
    setFormData({
      reviewName: cycle.reviewName || cycle.name || '',
      description: cycle.description || '',
      weekNumber: cycle.weekNumber || '',
      startDate: cycle.startDate || '',
      endDate: cycle.endDate || '',
      targetRole: cycle.targetRole || cycle.role || 'all',
      rubricId: cycle.rubricId || '',
      status: cycle.status || 'Draft'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reviewName) return;

    try {
      const payload = {
        reviewName: formData.reviewName.trim(),
        name: formData.reviewName.trim(),
        description: formData.description.trim(),
        weekNumber: formData.weekNumber,
        startDate: formData.startDate,
        endDate: formData.endDate,
        targetRole: formData.targetRole,
        rubricId: formData.rubricId,
        status: formData.status,
        updatedAt: new Date().toISOString()
      };

      if (editingCycle) {
        await FirestoreService.updateDocument('reviewCycles', editingCycle.id, payload);
        
        await FirestoreService.createDocument('auditLogs', {
          user: currentUser.uid,
          role: 'admin',
          action: 'Review Cycle Updated',
          reviewCycle: editingCycle.id,
          previousValue: editingCycle.status,
          newValue: formData.status,
          timestamp: new Date().toISOString()
        });

        alert('Review Cycle updated successfully.');
      } else {
        payload.reviewCycleId = formData.reviewName.toLowerCase().replace(/\s+/g, '-');
        payload.semester = 'Odd';
        payload.academicYear = '2025-2026';
        payload.createdBy = currentUser.uid;
        payload.createdAt = new Date().toISOString();

        const newId = await FirestoreService.createDocument('reviewCycles', payload);

        await FirestoreService.createDocument('auditLogs', {
          user: currentUser.uid,
          role: 'admin',
          action: 'Review Cycle Created',
          reviewCycle: newId,
          newValue: formData.reviewName,
          timestamp: new Date().toISOString()
        });

        alert('Review Cycle created successfully.');
      }

      setShowModal(false);
    } catch (err) {
      console.error("Failed to save review cycle:", err);
      alert('Failed to save review cycle.');
    }
  };

  const handleStatusChange = async (cycle, newStatus) => {
    try {
      await FirestoreService.updateDocument('reviewCycles', cycle.id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      await FirestoreService.createDocument('auditLogs', {
        user: currentUser.uid,
        role: 'admin',
        action: `Review Cycle Status Changed`,
        reviewCycle: cycle.id,
        previousValue: cycle.status,
        newValue: newStatus,
        timestamp: new Date().toISOString()
      });

      if (newStatus === 'Active' || newStatus === 'Closed') {
        await FirestoreService.createDocument('notifications', {
          title: `Review Cycle ${newStatus}`,
          message: `The review cycle "${cycle.reviewName}" status is now ${newStatus}.`,
          targetRole: 'all',
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  if (dataLoading) {
    return <DashboardLayout navigationItems={adminNavigation} title="Review Cycles" />;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Draft': return 'warning';
      case 'Closed': return 'danger';
      case 'Archived': return 'secondary';
      default: return 'primary';
    }
  };

  return (
    <DashboardLayout navigationItems={adminNavigation} title="Review Cycles Management">
      <div className="max-w-7xl mx-auto space-y-6 font-sans">
        
        {/* Page Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">University Review & Evaluation Cycles</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure dynamic evaluation cycles, dates, roles, rubrics, and statuses (Review 1, Review 2, Review 3, Classroom Presentation).
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Evaluation Cycle
          </Button>
        </div>

        {/* Cycles Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviewCycles.map(cycle => {
            const linkedRubric = rubrics?.find(r => r.id === cycle.rubricId || r.rubricId === cycle.rubricId);
            return (
              <Card key={cycle.id} className="p-6 flex flex-col justify-between hover:shadow-card-hover transition-shadow">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{cycle.reviewName || cycle.name}</h3>
                      <Badge variant={getStatusBadge(cycle.status)}>{cycle.status}</Badge>
                    </div>
                    <Button size="xs" variant="outline" onClick={() => handleOpenEdit(cycle)} title="Edit Configuration">
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                  </div>

                  {cycle.description && (
                    <p className="text-xs text-gray-600 mt-2">{cycle.description}</p>
                  )}

                  <div className="mt-4 space-y-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Allowed Evaluator Role:</span>
                      <span className="font-bold text-gray-800 uppercase">{cycle.targetRole || 'All'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Linked Rubric:</span>
                      <span className="font-bold text-primary-700">{linkedRubric ? linkedRubric.title : (cycle.rubricId || 'Not Linked')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Start Date:</span>
                      <span className="font-medium text-gray-800">{cycle.startDate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">End Date:</span>
                      <span className="font-medium text-gray-800">{cycle.endDate || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t pt-3 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">ID: {cycle.id}</span>
                  <div className="flex gap-2">
                    {cycle.status === 'Draft' && (
                      <Button size="xs" variant="outline" onClick={() => handleStatusChange(cycle, 'Active')} className="border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                        <Play className="w-3.5 h-3.5 mr-1" /> Activate
                      </Button>
                    )}
                    {cycle.status === 'Active' && (
                      <Button size="xs" variant="outline" onClick={() => handleStatusChange(cycle, 'Closed')} className="border-red-500 text-red-600 hover:bg-red-50">
                        <Square className="w-3.5 h-3.5 mr-1" /> Close
                      </Button>
                    )}
                    {cycle.status === 'Closed' && (
                      <Button size="xs" variant="outline" onClick={() => handleStatusChange(cycle, 'Archived')} className="border-gray-400 text-gray-600 hover:bg-gray-50">
                        <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          {reviewCycles.length === 0 && (
            <div className="col-span-2 text-center p-12 bg-white rounded-xl border border-gray-100 text-gray-500">
              No evaluation cycles configured yet. Click "Create Evaluation Cycle" to begin.
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingCycle ? 'Edit Evaluation Cycle' : 'Create Evaluation Cycle'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Evaluation Name *
                </label>
                <Input 
                  required 
                  placeholder="e.g. Review 1, Review 2, Review 3, Classroom Presentation"
                  value={formData.reviewName} 
                  onChange={e => setFormData({...formData, reviewName: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <Input 
                  placeholder="Brief summary of evaluation objectives"
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Evaluator Role *
                  </label>
                  <select
                    value={formData.targetRole}
                    onChange={e => setFormData({...formData, targetRole: e.target.value})}
                    className="w-full text-xs border-gray-300 rounded-lg p-2.5 bg-gray-50 font-medium focus:ring-primary-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="guide">Guide Only</option>
                    <option value="classroom_faculty">Classroom Faculty Only</option>
                    <option value="reviewer">Reviewer Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full text-xs border-gray-300 rounded-lg p-2.5 bg-gray-50 font-medium focus:ring-primary-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Linked Rubric
                </label>
                <select
                  value={formData.rubricId}
                  onChange={e => setFormData({...formData, rubricId: e.target.value})}
                  className="w-full text-xs border-gray-300 rounded-lg p-2.5 bg-gray-50 font-medium focus:ring-primary-500"
                >
                  <option value="">-- Select Rubric --</option>
                  {rubrics?.map(r => (
                    <option key={r.id} value={r.id || r.rubricId}>
                      {r.title} ({r.reviewCycle || 'General'} - v{r.version || '1.0'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Start Date</label>
                  <Input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">End Date</label>
                  <Input 
                    type="date" 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Save Configuration</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ReviewCycles;
