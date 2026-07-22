import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { meetingService } from '@/firebase/services/meetingService';
import { studentService } from '@/firebase/services/studentService';
import { notificationService } from '@/firebase/services/notificationService';
import { Loader2, Calendar, Plus, Edit2, Trash2, Clock, AlertCircle } from 'lucide-react';

const Meetings = () => {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    date: '',
    time: '',
    studentId: '',
    notes: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData(currentUser.uid);
    }
  }, [currentUser]);

  const fetchData = async (uid) => {
    try {
      setLoading(true);
      const [meetingsData, studentsData] = await Promise.all([
        meetingService.getByGuideId(uid),
        studentService.getByGuideId(uid)
      ]);
      
      const enrichedMeetings = meetingsData.map(m => {
        const student = studentsData.find(s => s.uid === m.studentId);
        return {
          ...m,
          studentName: student?.name || 'Unknown Student',
          group: student?.projectTitle || 'N/A'
        };
      });

      // Sort by date ascending (upcoming first)
      const sorted = enrichedMeetings.sort((a,b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
      setMeetings(sorted);
      setStudents(studentsData);
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setError("Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({ id: null, title: '', date: '', time: '', studentId: '', notes: '' });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (meeting) => {
    setFormData({
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      studentId: meeting.studentId,
      notes: meeting.notes || ''
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel and delete this meeting?')) {
      try {
        await meetingService.delete(id);
        setMeetings(prev => prev.filter(m => m.id !== id));
      } catch (err) {
        console.error("Failed to delete meeting:", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    
    setSubmitting(true);
    try {
      const payload = {
        guideId: currentUser.uid,
        studentId: formData.studentId,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        notes: formData.notes
      };

      if (isEditMode) {
        await meetingService.update(formData.id, payload);
      } else {
        await meetingService.create({ ...payload, createdAt: new Date().toISOString() });
        
        // Notify student about new meeting
        await notificationService.create({
          userId: formData.studentId,
          title: 'Meeting Scheduled',
          message: `Your guide has scheduled a meeting: ${formData.title} on ${formData.date} at ${formData.time}`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      setIsModalOpen(false);
      fetchData(currentUser.uid);
    } catch (err) {
      console.error("Failed to save meeting:", err);
      setError("Failed to save meeting.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="CapstoneFlow - Meetings">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  // Split into upcoming and past
  const now = new Date();
  const upcomingMeetings = meetings.filter(m => new Date(`${m.date}T${m.time}`) >= now);
  const pastMeetings = meetings.filter(m => new Date(`${m.date}T${m.time}`) < now);

  return (
    <DashboardLayout navigationItems={guideNavigation} title="CapstoneFlow - Meetings">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary-600" /> Meetings & Schedule
            </h1>
            <p className="text-sm text-gray-500 mt-1">Schedule and manage reviews with your assigned students.</p>
          </div>
          <Button onClick={openAddModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Schedule Meeting
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Upcoming Meetings">
            <div className="space-y-4 mt-4">
              {upcomingMeetings.length > 0 ? upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-start justify-between p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex gap-4">
                    <div className="bg-primary-50 text-primary-600 rounded-lg p-3 flex flex-col items-center justify-center min-w-[4rem]">
                      <span className="text-xs font-semibold uppercase">{new Date(meeting.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-bold">{new Date(meeting.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" /> {meeting.time}
                      </p>
                      <p className="text-sm font-medium text-gray-700 mt-2">Group: {meeting.group}</p>
                      <p className="text-xs text-gray-500">{meeting.studentName}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(meeting)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(meeting.id)} className="text-red-500 hover:text-red-700">Cancel</Button>
                  </div>
                </div>
              )) : (
                <EmptyState icon={Calendar} title="No Upcoming Meetings" description="Schedule a meeting to review student progress." />
              )}
            </div>
          </Card>

          <Card title="Past Meetings">
            <div className="space-y-4 mt-4 opacity-75">
              {pastMeetings.length > 0 ? pastMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-start justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex gap-4">
                    <div className="bg-gray-200 text-gray-600 rounded-lg p-3 flex flex-col items-center justify-center min-w-[4rem]">
                      <span className="text-xs font-semibold uppercase">{new Date(meeting.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-bold">{new Date(meeting.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">{meeting.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{meeting.group}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-gray-500 text-sm">No past meetings recorded.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Meeting" : "Schedule Meeting"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
              <Input 
                required 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Design Review" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student / Group</label>
              <select
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white"
                value={formData.studentId}
                onChange={e => setFormData({...formData, studentId: e.target.value})}
              >
                <option value="" disabled>Select Student</option>
                {students.map(s => (
                  <option key={s.uid} value={s.uid}>{s.name} ({s.projectTitle || 'No Project'})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input 
                  type="date" 
                  required 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <Input 
                  type="time" 
                  required 
                  value={formData.time} 
                  onChange={e => setFormData({...formData, time: e.target.value})} 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Agenda (Optional)</label>
              <textarea 
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Meeting agenda..."
              />
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? 'Update Meeting' : 'Schedule Meeting')}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default Meetings;
