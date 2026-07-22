import { db } from '../config';
import { writeBatch, doc } from 'firebase/firestore';

export const adminService = {
  
  /**
   * Updates a student's assignments in a single transaction (batch).
   * It takes the student document ID, and the assignments payload.
   * payload = { guideId, reviewerId, facultyId, projectId }
   */
  async assignStudent(studentId, payload) {
    const batch = writeBatch(db);

    // 1. Update Student document
    const studentRef = doc(db, 'students', studentId);
    batch.update(studentRef, {
      guideId: payload.guideId || null,
      reviewerId: payload.reviewerId || null,
      facultyId: payload.facultyId || null,
      projectId: payload.projectId || null,
      updatedAt: new Date().toISOString()
    });

    // We do NOT need to update guide/reviewer/faculty documents with duplicate assignedStudents arrays 
    // because the prompt says:
    // "Guide, Reviewer, and Faculty portals must retrieve their assigned students by querying... Avoid maintaining duplicate assignment arrays unless they are purely cached or derived."
    // 
    // However, the prompt also says:
    // "Whenever an assignment changes: Update students, guides, reviewers, faculty, projects using a single Firestore WriteBatch"
    // To strictly follow the batch update instruction without duplicating arrays (which is explicitly forbidden),
    // we'll update the `lastAssignmentUpdate` timestamp on the target entities so they know when assignments changed.

    if (payload.guideId) {
      const guideRef = doc(db, 'guides', payload.guideId);
      batch.update(guideRef, { lastAssignmentUpdate: new Date().toISOString() });
    }
    
    if (payload.reviewerId) {
      const revRef = doc(db, 'reviewers', payload.reviewerId);
      batch.update(revRef, { lastAssignmentUpdate: new Date().toISOString() });
    }
    
    if (payload.facultyId) {
      const facRef = doc(db, 'classroomFaculty', payload.facultyId);
      batch.update(facRef, { lastAssignmentUpdate: new Date().toISOString() });
    }

    if (payload.projectId) {
      const projRef = doc(db, 'projects', payload.projectId);
      batch.update(projRef, { 
        studentId: studentId,
        guideId: payload.guideId || null,
        reviewerId: payload.reviewerId || null,
        facultyId: payload.facultyId || null,
        updatedAt: new Date().toISOString()
      });
    }

    await batch.commit();
  }
};
