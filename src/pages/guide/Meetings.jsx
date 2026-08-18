import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useGuideAnalytics } from '@/hooks/useGuideAnalytics';
import { meetingService } from '@/firebase/services/meetingService';
import { notificationService } from '@/firebase/services/notificationService';
import { Loader2, Calendar, Plus, Clock, AlertCircle } from 'lucide-react';

const Meetings = () => {
  const { currentUser } = useAuth();
  const { getGuideMeetings, getSupervisedTeams, dataLoading } = useGuideAnalytics();
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    date: '',
    time: '',
    teamId: '',
    agenda: ''
  });

  const teams = getSupervisedTeams();
  const meetings = getGuideMeetings();

  const openAddModal = () => {
    setFormData({ id: null, title: '', date: '', time: '', teamId: '', agenda: '' });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (meeting) => {
    const meetingDate = new Date(meeting.meetingDate);
    setFormData({
      id: meeting.id,
      title: meeting.agenda || 'Meeting', // simplified title mapping
      date: meetingDate.toISOString().split('T')[0],
      time: meetingDate.toTimeString().slice(0, 5),
      teamId: meeting.teamId,
      agenda: meeting.agenda || ''
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel and delete this meeting?')) {
      try {
        await meetingService.delete(id);
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
      // Combine date and time
      const meetingDateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();
      const payload = {
        guideId: currentUser.uid,
        teamId: formData.teamId,
        meetingDate: meetingDateTime,
        agenda: formData.title + (formData.agenda ? ` - ${formData.agenda}` : ''),
      };

      if (isEditMode) {
        await meetingService.update(formData.id, { ...payload, updatedAt: new Date().toISOString() });
      } else {
        await meetingService.create({ ...payload, status: 'Scheduled', createdAt: new Date().toISOString() });
        
        // Notify team about new meeting
        await notificationService.create({
          targetTeam: formData.teamId,
          targetRole: 'student',
          title: 'Meeting Scheduled',
          message: `Your guide has scheduled a meeting for ${new Date(meetingDateTime).toLocaleString()}`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save meeting:", err);
      setError("Failed to save meeting.");
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="Mentorship Meetings">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  // Split into upcoming and past
  const now = new Date();
  const upcomingMeetings = meetings.filter(m => new Date(m.meetingDate) >= now).sort((a,b) => new Date(a.meetingDate) - new Date(b.meetingDate));
  const pastMeetings = meetings.filter(m => new Date(m.meetingDate) < now).sort((a,b) => new Date(b.meetingDate) - new Date(a.meetingDate));

  return (
    <DashboardLayout navigationItems={guideNavigation} title="Mentorship Meetings">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary-600" /> Meetings & Schedule
            </h1>
            <p className="text-sm text-gray-500 mt-1">Schedule and manage mentorship reviews with your assigned teams.</p>
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
                      <span className="text-xs font-semibold uppercase">{new Date(meeting.meetingDate).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-bold">{new Date(meeting.meetingDate).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 line-clamp-1">{meeting.agenda}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" /> {new Date(meeting.meetingDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="text-sm font-bold text-gray-700 mt-2">{meeting.teamId}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(meeting)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(meeting.id)} className="text-red-500 hover:text-red-700">Cancel</Button>
                  </div>
                </div>
              )) : (
                <div className="py-6 border border-dashed border-gray-200 rounded-lg">
                  <EmptyState icon={Calendar} title="No Upcoming Meetings" description="Schedule a meeting to review team progress." />
                </div>
              )}
            </div>
          </Card>

          <Card title="Past Meetings">
            <div className="space-y-4 mt-4 opacity-75">
              {pastMeetings.length > 0 ? pastMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-start justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex gap-4">
                    <div className="bg-gray-200 text-gray-600 rounded-lg p-3 flex flex-col items-center justify-center min-w-[4rem]">
                      <span className="text-xs font-semibold uppercase">{new Date(meeting.meetingDate).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-bold">{new Date(meeting.meetingDate).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 line-clamp-1">{meeting.agenda}</h4>
                      <p className="text-sm font-bold text-gray-500 mt-1">{meeting.teamId}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title / Agenda</label>
              <Input 
                required 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Design Review" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supervised Team</label>
              <select
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white"
                value={formData.teamId}
                onChange={e => setFormData({...formData, teamId: e.target.value})}
              >
                <option value="" disabled>Select Team</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.id} ({t.project?.title || 'No Project'})</option>
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
