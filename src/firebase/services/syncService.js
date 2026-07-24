import { FirestoreService } from './firestore';
import { db } from '../config';
import { collection, writeBatch, doc } from 'firebase/firestore';

export const syncService = {
  purgeDatabase: async () => {
    const collectionsToPurge = [
      'students', 'teams', 'projects', 'guides', 'reviewers', 
      'classroomFaculty', 'guideMarks', 'facultyMarks', 
      'reviews', 'submissions', 'notifications', 'reports', 
      'auditLogs'
    ];

    for (const colName of collectionsToPurge) {
      try {
        const docs = await FirestoreService.getAll(colName);
        if (docs.length > 0) {
          const batch = writeBatch(db);
          docs.forEach((d) => {
            batch.delete(doc(db, colName, d.id));
          });
          await batch.commit();
        }
      } catch (err) {
        console.error(`Error purging ${colName}:`, err);
      }
    }
  },

  syncAssignments: async (assignments) => {
    console.log(`[SYNC ENGINE] 1. Assignments upload started. Parse complete.`);
    console.log(`[SYNC ENGINE] 2. Total assignment rows parsed: ${assignments.length}`);

    const allStudents = await FirestoreService.getAll('students');
    const allGuides = await FirestoreService.getAll('guides');
    const allFaculty = await FirestoreService.getAll('classroomFaculty');
    const allReviewers = await FirestoreService.getAll('reviewers');
    const allTeams = await FirestoreService.getAll('teams');

    const getField = (obj, keys) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) return String(obj[key]).trim();
      }
      return '';
    };

    const studentMap = new Map(allStudents.map(s => [getField(s, ['rollNumber', 'Roll Number', 'employeeId', 'Employee ID', 'Email', 'email']).toLowerCase(), s]));
    const guideMap = new Map(allGuides.map(g => [getField(g, ['employeeId', 'Employee ID', 'email', 'Email']).toLowerCase(), g]));
    const facultyMap = new Map(allFaculty.map(f => [getField(f, ['employeeId', 'Employee ID', 'email', 'Email']).toLowerCase(), f]));
    const reviewerMap = new Map(allReviewers.map(r => [getField(r, ['employeeId', 'Employee ID', 'email', 'Email']).toLowerCase(), r]));
    const teamMap = new Map(allTeams.map(t => [t.teamId, t]));

    let stats = {
      studentsLinked: 0,
      teamsCreated: 0,
      projectsCreated: 0,
      guidesUpdated: 0,
      facultyUpdated: 0,
      reviewersUpdated: 0,
      studentsUpdated: 0,
    };
    let warnings = [];
    let failures = 0;

    const teamsToUpdate = new Map();
    const projectsToUpdate = new Map();
    const studentsToUpdate = new Map();
    const guidesToUpdate = new Map();
    const facultyToUpdate = new Map();
    const reviewersToUpdate = new Map();

    const safeAdd = (arr, val) => {
      if (!val) return arr || [];
      const res = arr || [];
      if (!res.includes(val)) res.push(val);
      return res;
    };

    for (let i = 0; i < assignments.length; i++) {
      const row = assignments[i];
      const rollNumber = getField(row, ['Roll Number', 'rollNumber', 'Student Roll Number', 'roll No', 'roll_number']).toLowerCase();
      const teamId = getField(row, ['Team ID', 'teamId', 'Team No', 'team', 'team_id']);
      const guideId = getField(row, ['Guide Employee ID', 'Guide Email', 'guideEmail', 'guideId', 'Guide ID', 'guide_id']).toLowerCase();
      const facultyId = getField(row, ['Faculty Employee ID', 'Faculty Email', 'facultyEmail', 'facultyId', 'Faculty ID', 'faculty_id']).toLowerCase();
      const reviewerId = getField(row, ['Reviewer Employee ID', 'Reviewer Email', 'reviewerEmail', 'reviewerId', 'Reviewer ID', 'reviewer_id']).toLowerCase();
      
      const facultyPanel = getField(row, ['Faculty Panel', 'facultyPanel']);
      const reviewSchedule = getField(row, ['Review Schedule', 'reviewSchedule']);
      const room = getField(row, ['Room', 'room']);
      const academicYear = getField(row, ['Academic Year', 'academicYear']) || '2026-27';
      const batch = getField(row, ['Batch', 'batch']) || 'CSE-2';
      const section = getField(row, ['Section', 'section']) || 'A';

      if (i < 5) {
        console.log(`\n--- PARSED ROW ${i + 1} ---`);
        console.log("Raw row object:", row);
        console.log("Parsed IDs:", { rollNumber, teamId, guideId, facultyId, reviewerId });
        if (!guideId || !facultyId || !reviewerId) {
          console.warn("Missing ID(s) detected. Available columns in Excel row:", Object.keys(row));
        }
      }

      if (!rollNumber || !teamId) {
        const msg = `Row ${i + 1}: Missing Roll Number or Team ID.`;
        console.warn(`[SYNC ENGINE] ${msg} Skipping.`);
        warnings.push(msg);
        continue;
      }

      const student = studentMap.get(rollNumber);
      const guide = guideMap.get(guideId);
      const faculty = facultyMap.get(facultyId);
      const reviewer = reviewerMap.get(reviewerId);

      if (!student) {
        const msg = `Row ${i + 1}: Cannot map student using Roll Number '${rollNumber}'. Student not found in database.`;
        console.warn(`[SYNC ENGINE] ${msg} Skipping.`);
        warnings.push(msg);
        continue;
      }
      
      if (guideId && !guide) warnings.push(`Row ${i + 1}: Guide ID '${guideId}' not found.`);
      if (facultyId && !faculty) warnings.push(`Row ${i + 1}: Faculty ID '${facultyId}' not found.`);
      if (reviewerId && !reviewer) warnings.push(`Row ${i + 1}: Reviewer ID '${reviewerId}' not found.`);

      // 1. Team & Project Logic
      let currentTeam = teamsToUpdate.get(teamId) || teamMap.get(teamId);
      if (!currentTeam) {
        currentTeam = {
          teamId,
          teamName: `Team ${teamId}`,
          guideId: guide?.id || '',
          facultyId: faculty?.id || '',
          reviewerId: reviewer?.id || '',
          facultyPanel,
          reviewSchedule,
          room,
          academicYear,
          batch,
          section,
          status: 'Active',
          members: [],
          projectId: `PRJ-${teamId}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        stats.teamsCreated++;
        stats.projectsCreated++;
        
        projectsToUpdate.set(`PRJ-${teamId}`, {
          projectId: `PRJ-${teamId}`,
          teamId,
          projectTitle: `Project ${teamId}`,
          status: 'In Progress',
          guideId: guide?.id || '',
          facultyId: faculty?.id || '',
          reviewerId: reviewer?.id || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      currentTeam.members = safeAdd(currentTeam.members, student.id);
      teamsToUpdate.set(teamId, currentTeam);

      // 2. Student Update
      studentsToUpdate.set(student.id, {
        teamId,
        projectId: currentTeam.projectId,
        guideId: guide?.id || '',
        facultyId: faculty?.id || '',
        reviewerId: reviewer?.id || '',
        facultyPanel,
        reviewSchedule,
        room,
        assignmentStatus: 'Assigned',
        status: 'Active'
      });
      stats.studentsLinked++;
      stats.studentsUpdated++;

      // 3. Relationships Update
      if (guide) {
        const guideCache = guidesToUpdate.get(guide.id) || { 
          assignedStudents: guide.assignedStudents || [], 
          assignedTeams: guide.assignedTeams || [],
          projectIds: guide.projectIds || []
        };
        guideCache.assignedStudents = safeAdd(guideCache.assignedStudents, student.id);
        guideCache.assignedTeams = safeAdd(guideCache.assignedTeams, teamId);
        guideCache.projectIds = safeAdd(guideCache.projectIds, currentTeam.projectId);
        guideCache.studentCount = guideCache.assignedStudents.length;
        guidesToUpdate.set(guide.id, guideCache);
        stats.guidesUpdated++;
      }

      if (faculty) {
        const facultyCache = facultyToUpdate.get(faculty.id) || {
          assignedStudents: faculty.assignedStudents || [],
          assignedTeams: faculty.assignedTeams || [],
          projectIds: faculty.projectIds || []
        };
        facultyCache.assignedStudents = safeAdd(facultyCache.assignedStudents, student.id);
        facultyCache.assignedTeams = safeAdd(facultyCache.assignedTeams, teamId);
        facultyCache.projectIds = safeAdd(facultyCache.projectIds, currentTeam.projectId);
        facultyCache.studentCount = facultyCache.assignedStudents.length;
        facultyToUpdate.set(faculty.id, facultyCache);
        stats.facultyUpdated++;
      }

      if (reviewer) {
        const reviewerCache = reviewersToUpdate.get(reviewer.id) || {
          assignedStudents: reviewer.assignedStudents || [],
          assignedTeams: reviewer.assignedTeams || [],
          projectIds: reviewer.projectIds || []
        };
        reviewerCache.assignedStudents = safeAdd(reviewerCache.assignedStudents, student.id);
        reviewerCache.assignedTeams = safeAdd(reviewerCache.assignedTeams, teamId);
        reviewerCache.projectIds = safeAdd(reviewerCache.projectIds, currentTeam.projectId);
        reviewerCache.studentCount = reviewerCache.assignedStudents.length;
        reviewersToUpdate.set(reviewer.id, reviewerCache);
        stats.reviewersUpdated++;
      }
    }

    // 4. Batch Execution
    console.log(`[SYNC ENGINE] Preparing Batches. Teams: ${teamsToUpdate.size}, Students: ${studentsToUpdate.size}, Guides: ${guidesToUpdate.size}`);
    
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    const allBatches = [];

    const commitCurrentBatch = () => {
      if (operationCount > 0) {
        allBatches.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    };

    const addOperation = (collectionName, id, data) => {
      currentBatch.set(doc(db, collectionName, id), data, { merge: true });
      operationCount++;
      if (operationCount >= 450) commitCurrentBatch();
    };

    try {
      teamsToUpdate.forEach((data, id) => addOperation('teams', id, data));
      projectsToUpdate.forEach((data, id) => addOperation('projects', id, data));
      studentsToUpdate.forEach((data, id) => addOperation('students', id, data));
      guidesToUpdate.forEach((data, id) => addOperation('guides', id, data));
      facultyToUpdate.forEach((data, id) => addOperation('classroomFaculty', id, data));
      reviewersToUpdate.forEach((data, id) => addOperation('reviewers', id, data));

      commitCurrentBatch();
      await Promise.all(allBatches);
      
      console.log(`[SYNC ENGINE] Successfully committed ${allBatches.length} batch transactions.`);
    } catch (err) {
      console.error(`[SYNC ENGINE] Batch Transaction Failed: `, err);
      failures++;
      warnings.push(`Batch transaction failed: ${err.message}`);
    }

    // Fix counts based on unique updates
    stats.guidesUpdated = guidesToUpdate.size;
    stats.facultyUpdated = facultyToUpdate.size;
    stats.reviewersUpdated = reviewersToUpdate.size;
    stats.studentsUpdated = studentsToUpdate.size;
    stats.teamsCreated = teamsToUpdate.size; // Close enough metric for UI

    console.log(`[SYNC ENGINE] Synchronization completed.`);
    return { stats, warnings, failures };
  }
};
