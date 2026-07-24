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
    
    // Support lookup by Employee ID or Email
    const guideMap = new Map();
    allGuides.forEach(g => {
      const emp = getField(g, ['employeeId', 'Employee ID']).toLowerCase();
      const em = getField(g, ['email', 'Email']).toLowerCase();
      if (emp) guideMap.set(emp, g);
      if (em) guideMap.set(em, g);
      guideMap.set(g.id.toLowerCase(), g);
    });

    const facultyMap = new Map();
    allFaculty.forEach(f => {
      const emp = getField(f, ['employeeId', 'Employee ID']).toLowerCase();
      const em = getField(f, ['email', 'Email']).toLowerCase();
      if (emp) facultyMap.set(emp, f);
      if (em) facultyMap.set(em, f);
      facultyMap.set(f.id.toLowerCase(), f);
    });

    const reviewerMap = new Map();
    allReviewers.forEach(r => {
      const emp = getField(r, ['employeeId', 'Employee ID']).toLowerCase();
      const em = getField(r, ['email', 'Email']).toLowerCase();
      if (emp) reviewerMap.set(emp, r);
      if (em) reviewerMap.set(em, r);
      reviewerMap.set(r.id.toLowerCase(), r);
    });

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
      const res = arr ? [...arr] : [];
      if (!res.includes(val)) res.push(val);
      return res;
    };

    const safeRemove = (arr, val) => {
      if (!arr || !val) return arr || [];
      return arr.filter(item => item !== val);
    };

    // Helper to get or init cache
    const getEntityCache = (map, originalEntity) => {
      if (!originalEntity) return null;
      if (!map.has(originalEntity.id)) {
        map.set(originalEntity.id, {
          assignedStudents: originalEntity.assignedStudents || [],
          assignedTeams: originalEntity.assignedTeams || [],
          projectIds: originalEntity.projectIds || []
        });
      }
      return map.get(originalEntity.id);
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

      if (!rollNumber || !teamId) {
        warnings.push(`Row ${i + 1}: Missing Roll Number or Team ID.`);
        continue;
      }

      const student = studentMap.get(rollNumber);
      const guide = guideMap.get(guideId);
      const faculty = facultyMap.get(facultyId);
      const reviewer = reviewerMap.get(reviewerId);

      if (!student) {
        warnings.push(`Row ${i + 1}: Cannot map student using Roll Number '${rollNumber}'. Student not found in database.`);
        continue;
      }
      
      if (guideId && !guide) warnings.push(`Row ${i + 1}: Guide ID '${guideId}' not found.`);
      if (facultyId && !faculty) warnings.push(`Row ${i + 1}: Faculty ID '${facultyId}' not found.`);
      if (reviewerId && !reviewer) warnings.push(`Row ${i + 1}: Reviewer ID '${reviewerId}' not found.`);

      // DELTA SYNCHRONIZATION: Remove student from old entities if they changed
      const oldGuideId = student.guideId;
      const oldFacultyId = student.facultyId;
      const oldReviewerId = student.reviewerId;
      const oldTeamId = student.teamId;

      if (oldGuideId && guide && oldGuideId !== guide.id) {
        const oldGuide = allGuides.find(g => g.id === oldGuideId);
        if (oldGuide) {
          const oldCache = getEntityCache(guidesToUpdate, oldGuide);
          oldCache.assignedStudents = safeRemove(oldCache.assignedStudents, student.id);
        }
      }

      if (oldFacultyId && faculty && oldFacultyId !== faculty.id) {
        const oldFac = allFaculty.find(f => f.id === oldFacultyId);
        if (oldFac) {
          const oldCache = getEntityCache(facultyToUpdate, oldFac);
          oldCache.assignedStudents = safeRemove(oldCache.assignedStudents, student.id);
        }
      }

      if (oldReviewerId && reviewer && oldReviewerId !== reviewer.id) {
        const oldRev = allReviewers.find(r => r.id === oldReviewerId);
        if (oldRev) {
          const oldCache = getEntityCache(reviewersToUpdate, oldRev);
          oldCache.assignedStudents = safeRemove(oldCache.assignedStudents, student.id);
        }
      }

      if (oldTeamId && oldTeamId !== teamId) {
        let oldTeam = teamsToUpdate.get(oldTeamId) || teamMap.get(oldTeamId);
        if (oldTeam) {
          oldTeam = { ...oldTeam, members: safeRemove(oldTeam.members || [], student.id) };
          teamsToUpdate.set(oldTeamId, oldTeam);
        }
      }

      // 1. Team & Project Logic
      const projectId = `PRJ-${teamId}`;
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
          projectId: projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        stats.teamsCreated++;
        stats.projectsCreated++;
        
        projectsToUpdate.set(projectId, {
          projectId: projectId,
          teamId,
          projectTitle: `Project ${teamId}`,
          status: 'In Progress',
          guideId: guide?.id || '',
          facultyId: faculty?.id || '',
          reviewerId: reviewer?.id || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Update team metadata if it exists
        currentTeam.guideId = guide?.id || currentTeam.guideId;
        currentTeam.facultyId = faculty?.id || currentTeam.facultyId;
        currentTeam.reviewerId = reviewer?.id || currentTeam.reviewerId;
      }
      
      currentTeam.members = safeAdd(currentTeam.members, student.id);
      teamsToUpdate.set(teamId, currentTeam);

      // 2. Student Update
      studentsToUpdate.set(student.id, {
        teamId,
        projectId: projectId,
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

      // 3. Add to New Relationships
      if (guide) {
        const guideCache = getEntityCache(guidesToUpdate, guide);
        guideCache.assignedStudents = safeAdd(guideCache.assignedStudents, student.id);
        guideCache.assignedTeams = safeAdd(guideCache.assignedTeams, teamId);
        guideCache.projectIds = safeAdd(guideCache.projectIds, projectId);
      }

      if (faculty) {
        const facultyCache = getEntityCache(facultyToUpdate, faculty);
        facultyCache.assignedStudents = safeAdd(facultyCache.assignedStudents, student.id);
        facultyCache.assignedTeams = safeAdd(facultyCache.assignedTeams, teamId);
        facultyCache.projectIds = safeAdd(facultyCache.projectIds, projectId);
      }

      if (reviewer) {
        const reviewerCache = getEntityCache(reviewersToUpdate, reviewer);
        reviewerCache.assignedStudents = safeAdd(reviewerCache.assignedStudents, student.id);
        reviewerCache.assignedTeams = safeAdd(reviewerCache.assignedTeams, teamId);
        reviewerCache.projectIds = safeAdd(reviewerCache.projectIds, projectId);
      }
    }

    // 4. Batch Execution - Compute student counts correctly
    guidesToUpdate.forEach(g => g.studentCount = g.assignedStudents.length);
    facultyToUpdate.forEach(f => f.studentCount = f.assignedStudents.length);
    reviewersToUpdate.forEach(r => r.studentCount = r.assignedStudents.length);

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
