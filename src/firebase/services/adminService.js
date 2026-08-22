import { db } from '../config.js';
import { writeBatch, doc, collection, getDocs } from 'firebase/firestore';

export const adminService = {
  /**
   * Updates a team's assignments (guideId, facultyId, reviewerId) across team & student documents.
   */
  async assignTeam(teamId, payload) {
    const batch = writeBatch(db);

    // 1. Update Team document
    const teamRef = doc(db, 'teams', teamId);
    const teamUpdatePayload = {
      updatedAt: new Date().toISOString()
    };
    if (payload.guideId !== undefined) teamUpdatePayload.guideId = payload.guideId;
    if (payload.facultyId !== undefined) teamUpdatePayload.facultyId = payload.facultyId;
    if (payload.reviewerId !== undefined) teamUpdatePayload.reviewerId = payload.reviewerId;
    if (payload.projectId !== undefined) teamUpdatePayload.projectId = payload.projectId;

    batch.set(teamRef, teamUpdatePayload, { merge: true });

    // 2. Query and update all student documents mapped to this team
    try {
      const studentsSnap = await getDocs(collection(db, 'students'));
      const cleanTeamId = String(teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      studentsSnap.docs.forEach(sDoc => {
        const sData = sDoc.data();
        const sTeamId = String(sData.teamId || sData.team || sData['Team ID'] || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (sTeamId && (sTeamId === cleanTeamId || sDoc.id === teamId)) {
          const studentRef = doc(db, 'students', sDoc.id);
          const studentUpdate = { updatedAt: new Date().toISOString() };
          if (payload.guideId !== undefined) studentUpdate.guideId = payload.guideId;
          if (payload.facultyId !== undefined) studentUpdate.facultyId = payload.facultyId;
          if (payload.reviewerId !== undefined) studentUpdate.reviewerId = payload.reviewerId;
          if (payload.projectId !== undefined) studentUpdate.projectId = payload.projectId;
          batch.update(studentRef, studentUpdate);
        }
      });
    } catch (e) {
      console.warn('Student batch update notice:', e);
    }

    await batch.commit();
  },

  /**
   * Updates a student's assignments in a single transaction (batch).
   * It takes the student document ID, and the assignments payload.
   * payload = { guideId, reviewerId, facultyId, projectId, teamId }
   */
  async assignStudent(studentId, payload) {
    const batch = writeBatch(db);

    // 1. Update Student document
    const studentRef = doc(db, 'students', studentId);
    const studentUpdatePayload = {
      updatedAt: new Date().toISOString()
    };
    if (payload.guideId !== undefined) studentUpdatePayload.guideId = payload.guideId;
    if (payload.reviewerId !== undefined) studentUpdatePayload.reviewerId = payload.reviewerId;
    if (payload.facultyId !== undefined) studentUpdatePayload.facultyId = payload.facultyId;
    if (payload.projectId !== undefined) studentUpdatePayload.projectId = payload.projectId;
    if (payload.teamId !== undefined) studentUpdatePayload.teamId = payload.teamId;

    batch.set(studentRef, studentUpdatePayload, { merge: true });

    if (payload.guideId) {
      const guideRef = doc(db, 'guides', payload.guideId);
      batch.set(guideRef, { lastAssignmentUpdate: new Date().toISOString() }, { merge: true });
    }
    
    if (payload.reviewerId) {
      const revRef = doc(db, 'reviewers', payload.reviewerId);
      batch.set(revRef, { lastAssignmentUpdate: new Date().toISOString() }, { merge: true });
    }
    
    if (payload.facultyId) {
      const facRef = doc(db, 'classroomFaculty', payload.facultyId);
      batch.set(facRef, { lastAssignmentUpdate: new Date().toISOString() }, { merge: true });
    }

    if (payload.projectId) {
      const projRef = doc(db, 'projects', payload.projectId);
      batch.set(projRef, { 
        studentId: studentId,
        guideId: payload.guideId || null,
        reviewerId: payload.reviewerId || null,
        facultyId: payload.facultyId || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    await batch.commit();
  }
};
