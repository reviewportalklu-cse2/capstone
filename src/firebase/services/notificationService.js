import { FirestoreService } from './firestore.js';

const COLLECTION_NAME = 'notifications';

export const notificationService = {
  getAll: async () => FirestoreService.getAll(COLLECTION_NAME),
  getById: async (id) => FirestoreService.getById(COLLECTION_NAME, id),
  
  // Base create
  create: async (data) => {
    const payload = {
      ...data,
      readBy: [],
      createdAt: new Date().toISOString(),
      archived: false
    };
    return FirestoreService.create(COLLECTION_NAME, payload);
  },
  
  update: async (id, data) => FirestoreService.update(COLLECTION_NAME, id, data),
  delete: async (id) => FirestoreService.delete(COLLECTION_NAME, id),
  
  markRead: async (id, userId) => {
    const notif = await FirestoreService.getById(COLLECTION_NAME, id);
    if (!notif) return;
    const readBy = notif.readBy || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      return FirestoreService.update(COLLECTION_NAME, id, { readBy });
    }
  },

  // Centralized Broadcasting Method
  broadcast: async (payload) => {
    return notificationService.create({
      ...payload,
      senderId: payload.senderId || 'SYSTEM',
      senderRole: payload.senderRole || 'Admin',
      status: 'Delivered'
    });
  },

  // ==========================================
  // Automatic System Notification Generators
  // ==========================================
  
  sendGuideAssignedNotification: async (teamId, guideId) => {
    return notificationService.broadcast({
      title: 'Guide Assigned',
      message: `A new guide has been assigned to Team ${teamId}.`,
      category: 'Project',
      priority: 'Information',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendFacultyAssignedNotification: async (teamId, facultyId) => {
    return notificationService.broadcast({
      title: 'Faculty Assigned',
      message: `Classroom faculty has been assigned to Team ${teamId}.`,
      category: 'Project',
      priority: 'Information',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendReviewerAssignedNotification: async (teamId, reviewerId, reviewCycleName) => {
    return notificationService.broadcast({
      title: 'Reviewer Assigned',
      message: `A reviewer has been assigned for ${reviewCycleName}.`,
      category: 'Review Cycle',
      priority: 'High',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendReviewerRotationNotification: async (teamId) => {
    return notificationService.broadcast({
      title: 'Reviewer Rotated',
      message: `Your reviewer has been rotated for the upcoming evaluation cycle.`,
      category: 'Reviewer Rotation',
      priority: 'Information',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendReviewCycleOpenedNotification: async (cycleName) => {
    return notificationService.broadcast({
      title: 'Review Cycle Opened',
      message: `${cycleName} is now active. Evaluations can now be submitted.`,
      category: 'Review Cycle',
      priority: 'High',
      recipientType: 'global'
    });
  },

  sendReviewCycleClosedNotification: async (cycleName) => {
    return notificationService.broadcast({
      title: 'Review Cycle Closed',
      message: `${cycleName} has been officially closed. No further evaluations can be submitted.`,
      category: 'Review Cycle',
      priority: 'High',
      recipientType: 'global'
    });
  },

  sendEvaluationStartedNotification: async (teamId, role) => {
    return notificationService.broadcast({
      title: 'Evaluation Started',
      message: `Your ${role} has started drafting your evaluation.`,
      category: 'Evaluation',
      priority: 'Information',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendEvaluationSubmittedNotification: async (teamId, role) => {
    return notificationService.broadcast({
      title: 'Evaluation Submitted',
      message: `Your ${role} has submitted marks for your team.`,
      category: 'Evaluation',
      priority: 'Medium',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendEvaluationLockedNotification: async (teamId) => {
    return notificationService.broadcast({
      title: 'Evaluation Locked',
      message: `The evaluation for Team ${teamId} has been officially locked.`,
      category: 'Evaluation',
      priority: 'High',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendPendingEvaluationNotification: async (teamId, facultyId) => {
    return notificationService.broadcast({
      title: 'Pending Absentee Evaluation',
      message: `Action Required: You have a pending absentee evaluation for Team ${teamId}.`,
      category: 'Pending Evaluation',
      priority: 'Critical',
      recipientType: 'individual',
      recipientIds: [facultyId]
    });
  },

  sendAttendanceNotification: async (teamId, status) => {
    return notificationService.broadcast({
      title: 'Attendance Updated',
      message: `Attendance has been marked as ${status} for Team ${teamId}.`,
      category: 'Attendance',
      priority: 'Medium',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendMeetingScheduledNotification: async (teamId, date) => {
    return notificationService.broadcast({
      title: 'Meeting Scheduled',
      message: `A new meeting has been scheduled for ${new Date(date).toLocaleString()}.`,
      category: 'Meeting',
      priority: 'Medium',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendMeetingCancelledNotification: async (teamId) => {
    return notificationService.broadcast({
      title: 'Meeting Cancelled',
      message: `Your previously scheduled meeting has been cancelled.`,
      category: 'Meeting',
      priority: 'High',
      recipientType: 'team',
      teamIds: [teamId]
    });
  },

  sendMilestoneCompletedNotification: async (teamId, milestoneName) => {
    return notificationService.broadcast({
      title: 'Milestone Achieved',
      message: `Team ${teamId} has successfully completed milestone: ${milestoneName}.`,
      category: 'Milestone',
      priority: 'Information',
      recipientType: 'global'
    });
  },

  sendResultPublishedNotification: async (semester) => {
    return notificationService.broadcast({
      title: 'Results Published',
      message: `Academic results for ${semester} have been officially published.`,
      category: 'Result',
      priority: 'Critical',
      recipientType: 'global'
    });
  },

  sendResultUnpublishedNotification: async (semester) => {
    return notificationService.broadcast({
      title: 'Results Unpublished',
      message: `Academic results for ${semester} have been temporarily unpublished for review.`,
      category: 'Result',
      priority: 'High',
      recipientType: 'global'
    });
  },

  sendSystemAnnouncement: async (title, message) => {
    return notificationService.broadcast({
      title,
      message,
      category: 'System',
      priority: 'Information',
      recipientType: 'global'
    });
  }
};
