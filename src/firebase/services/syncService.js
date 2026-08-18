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

  purgeSelectiveCollections: async (selectedCollections = [], onProgress = null) => {
    const startTime = performance.now();
    let recordsDeletedTotal = 0;
    const collectionsDeleted = [];
    const collectionsSkipped = [];
    const errors = [];

    for (const item of selectedCollections) {
      const colName = item.colName || item.id;
      const label = item.label || colName;

      if (onProgress) {
        onProgress(colName, label, `Deleting ${label}...`);
      }

      try {
        const docs = await FirestoreService.getAll(colName);
        if (docs.length === 0) {
          collectionsSkipped.push({ colName, label, reason: 'Empty (0 records)' });
          continue;
        }

        // Firestore writeBatch maximum limit is 500 operations per batch
        const CHUNK_SIZE = 400;
        let deletedInCol = 0;

        for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
          const chunk = docs.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);

          chunk.forEach((d) => {
            batch.delete(doc(db, colName, d.id));
          });

          await batch.commit();
          deletedInCol += chunk.length;
        }

        recordsDeletedTotal += deletedInCol;
        collectionsDeleted.push({ colName, label, count: deletedInCol });
      } catch (err) {
        console.error(`Error purging ${colName}:`, err);
        errors.push({ colName, label, error: err.message });
      }
    }

    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);
    const totalAttempted = collectionsDeleted.length + errors.length;
    const successRate = totalAttempted > 0 
      ? `${Math.round((collectionsDeleted.length / totalAttempted) * 100)}%`
      : '100%';

    return {
      collectionsDeleted,
      collectionsSkipped,
      recordsDeletedTotal,
      executionTimeMs,
      errors,
      successRate
    };
  },

  syncTeams: async (teams) => {
    console.log(`[SYNC ENGINE] 1. Teams upload started. Parse complete.`);
    console.log(`[SYNC ENGINE] 2. Total team rows parsed: ${teams.length}`);

    const allGuides = await FirestoreService.getAll('guides');
    const allFaculty = await FirestoreService.getAll('classroomFaculty');
    const allReviewers = await FirestoreService.getAll('reviewers');
    const allTeams = await FirestoreService.getAll('teams');
    const allProjects = await FirestoreService.getAll('projects');

    const getValue = (row, aliases) => {
      for (const key of aliases) {
        if (
          row[key] !== undefined &&
          row[key] !== null &&
          String(row[key]).trim() !== ""
        ) {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    const guideMap = new Map();
    allGuides.forEach(g => {
      const emp = getValue(g, ['employeeId', 'Employee ID']).toLowerCase();
      const em = getValue(g, ['email', 'Email']).toLowerCase();
      const name = getValue(g, ['name', 'Guide Name', 'Full Name']).toLowerCase();
      if (emp) guideMap.set(emp, g);
      if (em) guideMap.set(em, g);
      if (name) guideMap.set(name, g);
      if (g.id) guideMap.set(g.id.toLowerCase(), g);
      if (g.guideId) guideMap.set(g.guideId.toLowerCase(), g);
    });

    const facultyMap = new Map();
    allFaculty.forEach(f => {
      const emp = getValue(f, ['employeeId', 'Employee ID']).toLowerCase();
      const em = getValue(f, ['email', 'Email']).toLowerCase();
      const name = getValue(f, ['name', 'Faculty Name', 'Full Name']).toLowerCase();
      if (emp) facultyMap.set(emp, f);
      if (em) facultyMap.set(em, f);
      if (name) facultyMap.set(name, f);
      if (f.id) facultyMap.set(f.id.toLowerCase(), f);
      if (f.facultyId) facultyMap.set(f.facultyId.toLowerCase(), f);
    });

    const reviewerMap = new Map();
    allReviewers.forEach(r => {
      const emp = getValue(r, ['employeeId', 'Employee ID']).toLowerCase();
      const em = getValue(r, ['email', 'Email']).toLowerCase();
      const name = getValue(r, ['name', 'Reviewer Name', 'Full Name']).toLowerCase();
      if (emp) reviewerMap.set(emp, r);
      if (em) reviewerMap.set(em, r);
      if (name) reviewerMap.set(name, r);
      if (r.id) reviewerMap.set(r.id.toLowerCase(), r);
      if (r.reviewerId) reviewerMap.set(r.reviewerId.toLowerCase(), r);
    });

    const teamMap = new Map(allTeams.map(t => [t.teamId || t.id, t]));
    const projectMap = new Map(allProjects.map(p => [p.projectId || p.id, p]));

    let stats = {
      created: 0,
      updated: 0,
      skipped: 0,
    };
    let errors = [];
    let warnings = [];

    const teamsToUpdate = new Map();
    const projectsToUpdate = new Map();
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

    for (let i = 0; i < teams.length; i++) {
      const row = teams[i];
      const teamId = getValue(row, ['Team ID', 'TeamID', 'Team Id', 'teamId', 'Team No', 'team', 'team_id']);
      const teamName = getValue(row, ['Team Name', 'teamName', 'team_name']) || `Team ${teamId}`;
      const guideId = getValue(row, ['Guide ID', 'GuideID', 'Guide Id', 'Guide Employee ID', 'Guide Email', 'guideEmail', 'guideId', 'guide_id', 'Guide Name', 'Guide', 'guideName']).toLowerCase();
      const facultyId = getValue(row, ['Faculty ID', 'FacultyID', 'Faculty Id', 'Faculty Employee ID', 'Faculty Email', 'facultyEmail', 'facultyId', 'faculty_id', 'Faculty Name', 'Faculty', 'facultyName']).toLowerCase();
      const reviewerId = getValue(row, ['Reviewer ID', 'ReviewerID', 'Reviewer Id', 'Reviewer Employee ID', 'Reviewer Email', 'reviewerEmail', 'reviewerId', 'reviewer_id', 'Reviewer Name', 'Reviewer', 'reviewerName']).toLowerCase();
      let projectId = getValue(row, ['Project ID', 'ProjectID', 'Project Id', 'projectId', 'project_id']);
      
      if (!teamId) {
        errors.push(`Row ${i + 1}: Missing required Team ID.`);
        stats.skipped++;
        continue;
      }
      if (!projectId) {
        projectId = `PRJ-${teamId}`;
      }

      const guide = guideMap.get(guideId);
      const faculty = facultyMap.get(facultyId);
      const reviewer = reviewerMap.get(reviewerId);

      if (guideId && !guide) warnings.push(`Row ${i + 1}: Guide ID '${guideId}' not found for Team ${teamId}.`);
      if (facultyId && !faculty) warnings.push(`Row ${i + 1}: Faculty ID '${facultyId}' not found for Team ${teamId}.`);
      if (reviewerId && !reviewer) warnings.push(`Row ${i + 1}: Reviewer ID '${reviewerId}' not found for Team ${teamId}.`);

      let currentTeam = teamsToUpdate.get(teamId) || teamMap.get(teamId);
      let isNewTeam = !currentTeam;

      if (currentTeam) {
        // Delta sync for old relationships
        const oldGuideId = currentTeam.guideId;
        const oldFacultyId = currentTeam.facultyId;
        const oldReviewerId = currentTeam.reviewerId;
        const oldProjectId = currentTeam.projectId;

        if (oldGuideId && guide && oldGuideId !== guide.id) {
          const oldGuide = allGuides.find(g => g.id === oldGuideId);
          if (oldGuide) {
            const oldCache = getEntityCache(guidesToUpdate, oldGuide);
            oldCache.assignedTeams = safeRemove(oldCache.assignedTeams, currentTeam.teamId);
            oldCache.projectIds = safeRemove(oldCache.projectIds, oldProjectId);
          }
        }
        if (oldFacultyId && faculty && oldFacultyId !== faculty.id) {
          const oldFac = allFaculty.find(f => f.id === oldFacultyId);
          if (oldFac) {
            const oldCache = getEntityCache(facultyToUpdate, oldFac);
            oldCache.assignedTeams = safeRemove(oldCache.assignedTeams, currentTeam.teamId);
            oldCache.projectIds = safeRemove(oldCache.projectIds, oldProjectId);
          }
        }
        if (oldReviewerId && reviewer && oldReviewerId !== reviewer.id) {
          const oldRev = allReviewers.find(r => r.id === oldReviewerId);
          if (oldRev) {
            const oldCache = getEntityCache(reviewersToUpdate, oldRev);
            oldCache.assignedTeams = safeRemove(oldCache.assignedTeams, currentTeam.teamId);
            oldCache.projectIds = safeRemove(oldCache.projectIds, oldProjectId);
          }
        }

        currentTeam.teamName = teamName;
        currentTeam.guideId = guide?.id || '';
        currentTeam.facultyId = faculty?.id || '';
        currentTeam.reviewerId = reviewer?.id || '';
        currentTeam.projectId = projectId;
        currentTeam.updatedAt = new Date().toISOString();
        stats.updated++;
      } else {
        currentTeam = {
          teamId,
          teamName,
          guideId: guide?.id || '',
          facultyId: faculty?.id || '',
          reviewerId: reviewer?.id || '',
          projectId,
          members: [],
          status: 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        stats.created++;
      }
      teamsToUpdate.set(teamId, currentTeam);

      let currentProject = projectsToUpdate.get(projectId) || projectMap.get(projectId);
      if (!currentProject) {
        currentProject = {
          projectId,
          projectTitle: `Project ${teamId}`,
          teamId,
          guideId: guide?.id || '',
          facultyId: faculty?.id || '',
          reviewerId: reviewer?.id || '',
          status: 'In Progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        currentProject.teamId = teamId;
        currentProject.guideId = guide?.id || '';
        currentProject.facultyId = faculty?.id || '';
        currentProject.reviewerId = reviewer?.id || '';
        currentProject.updatedAt = new Date().toISOString();
      }
      projectsToUpdate.set(projectId, currentProject);

      if (guide) {
        const guideCache = getEntityCache(guidesToUpdate, guide);
        guideCache.assignedTeams = safeAdd(guideCache.assignedTeams, teamId);
        guideCache.projectIds = safeAdd(guideCache.projectIds, projectId);
      }
      if (faculty) {
        const facultyCache = getEntityCache(facultyToUpdate, faculty);
        facultyCache.assignedTeams = safeAdd(facultyCache.assignedTeams, teamId);
        facultyCache.projectIds = safeAdd(facultyCache.projectIds, projectId);
      }
      if (reviewer) {
        const reviewerCache = getEntityCache(reviewersToUpdate, reviewer);
        reviewerCache.assignedTeams = safeAdd(reviewerCache.assignedTeams, teamId);
        reviewerCache.projectIds = safeAdd(reviewerCache.projectIds, projectId);
      }
    }

    console.log(`[SYNC ENGINE] Preparing Batches for Teams. Teams: ${teamsToUpdate.size}, Projects: ${projectsToUpdate.size}`);
    
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
      guidesToUpdate.forEach((data, id) => addOperation('guides', id, data));
      facultyToUpdate.forEach((data, id) => addOperation('classroomFaculty', id, data));
      reviewersToUpdate.forEach((data, id) => addOperation('reviewers', id, data));

      commitCurrentBatch();
      await Promise.all(allBatches);
      
      console.log(`[SYNC ENGINE] Successfully committed ${allBatches.length} batch transactions for Teams.`);
      return { success: true, ...stats, errors, warnings };
    } catch (err) {
      console.error(`[SYNC ENGINE] Batch Transaction Failed: `, err);
      errors.push(`Batch transaction failed: ${err.message}`);
      return { success: false, ...stats, errors, warnings };
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
    const allProjects = await FirestoreService.getAll('projects');

    const getValue = (row, aliases) => {
      for (const key of aliases) {
        if (
          row[key] !== undefined &&
          row[key] !== null &&
          String(row[key]).trim() !== ""
        ) {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    const findStudent = (rollNumber) => {
      const fields = [
        "rollNumber",
        "studentId",
        "studentID",
        "registrationNumber",
        "regNo",
        "Roll Number",
        "employeeId",
        "Employee ID",
        "Email",
        "email"
      ];
      const target = String(rollNumber).trim().toLowerCase();
      
      for (const student of allStudents) {
        for (const field of fields) {
          if (student[field] && String(student[field]).trim().toLowerCase() === target) {
            return student;
          }
        }
        if (student.id && String(student.id).trim().toLowerCase() === target) {
          return student;
        }
      }
      return null;
    };

    // Support lookup by Employee ID or Email
    const guideMap = new Map();
    allGuides.forEach(g => {
      const emp = getValue(g, ['employeeId', 'Employee ID']).toLowerCase();
      const em = getValue(g, ['email', 'Email']).toLowerCase();
      const name = getValue(g, ['name', 'Guide Name', 'Full Name']).toLowerCase();
      if (emp) guideMap.set(emp, g);
      if (em) guideMap.set(em, g);
      if (name) guideMap.set(name, g);
      if (g.id) guideMap.set(g.id.toLowerCase(), g);
      if (g.guideId) guideMap.set(g.guideId.toLowerCase(), g);
    });

    const facultyMap = new Map();
    allFaculty.forEach(f => {
      const emp = getValue(f, ['employeeId', 'Employee ID']).toLowerCase();
      const em = getValue(f, ['email', 'Email']).toLowerCase();
      const name = getValue(f, ['name', 'Faculty Name', 'Full Name']).toLowerCase();
      if (emp) facultyMap.set(emp, f);
      if (em) facultyMap.set(em, f);
      if (name) facultyMap.set(name, f);
      if (f.id) facultyMap.set(f.id.toLowerCase(), f);
      if (f.facultyId) facultyMap.set(f.facultyId.toLowerCase(), f);
    });

    const reviewerMap = new Map();
    allReviewers.forEach(r => {
      const emp = getValue(r, ['employeeId', 'Employee ID']).toLowerCase();
      const em = getValue(r, ['email', 'Email']).toLowerCase();
      const name = getValue(r, ['name', 'Reviewer Name', 'Full Name']).toLowerCase();
      if (emp) reviewerMap.set(emp, r);
      if (em) reviewerMap.set(em, r);
      if (name) reviewerMap.set(name, r);
      if (r.id) reviewerMap.set(r.id.toLowerCase(), r);
      if (r.reviewerId) reviewerMap.set(r.reviewerId.toLowerCase(), r);
    });

    const teamMap = new Map(allTeams.map(t => [t.teamId || t.id, t]));
    const projectMap = new Map(allProjects.map(p => [p.projectId || p.id, p]));

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
      const rollNumber = getValue(row, ['Roll Number', 'RollNo', 'Roll No', 'Student ID', 'StudentID', 'Student Id', 'Registration Number', 'Reg No', 'rollNumber', 'Student Roll Number', 'roll_number']).toLowerCase();
      const teamId = getValue(row, ['Team ID', 'TeamID', 'Team Id', 'teamId', 'Team No', 'team', 'team_id']);
      let projectId = getValue(row, ['Project ID', 'ProjectID', 'Project Id', 'projectId', 'project_id']);
      
      const guideKey = getValue(row, ['Guide ID', 'GuideID', 'Guide Id', 'Guide Employee ID', 'Guide Email', 'guideEmail', 'guideId', 'guide_id', 'Guide Name', 'guideName']).toLowerCase();
      const facultyKey = getValue(row, ['Faculty ID', 'FacultyID', 'Faculty Id', 'Faculty Employee ID', 'Faculty Email', 'facultyEmail', 'facultyId', 'faculty_id', 'Faculty Name', 'facultyName']).toLowerCase();
      const reviewerKey = getValue(row, ['Reviewer ID', 'ReviewerID', 'Reviewer Id', 'Reviewer Employee ID', 'Reviewer Email', 'reviewerEmail', 'reviewerId', 'reviewer_id', 'Reviewer Name', 'reviewerName']).toLowerCase();
      
      const facultyPanel = getValue(row, ['Faculty Panel', 'facultyPanel']);
      const reviewSchedule = getValue(row, ['Review Schedule', 'reviewSchedule']);
      const room = getValue(row, ['Room', 'room']);
      const academicYear = getValue(row, ['Academic Year', 'academicYear']) || '2026-27';
      const batch = getValue(row, ['Batch', 'batch']) || 'CSE-2';
      const section = getValue(row, ['Section', 'section']) || 'A';

      if (!rollNumber || !teamId) {
        warnings.push(`Row ${i + 1}: Missing Roll Number or Team ID.`);
        continue;
      }
      if (!projectId) {
        projectId = `PRJ-${teamId}`;
      }

      let student = findStudent(rollNumber);
      const guide = guideMap.get(guideKey);
      const faculty = facultyMap.get(facultyKey);
      const reviewer = reviewerMap.get(reviewerKey);

      if (!student) {
        // Auto-create student record with Roll Number as ID
        const studentId = rollNumber.toLowerCase();
        const studentName = getValue(row, ['Student Name', 'studentName', 'Name', 'name']) || `Student ${rollNumber.toUpperCase()}`;
        const studentEmail = getValue(row, ['Student Email', 'studentEmail', 'Email', 'email']) || `${studentId}@kluniversity.in`;
        
        student = {
          id: studentId,
          rollNumber: rollNumber.toUpperCase(),
          name: studentName,
          email: studentEmail,
          status: 'Active',
          createdAt: new Date().toISOString()
        };
      }
      
      if (guideKey && !guide) warnings.push(`Row ${i + 1}: Guide '${guideKey}' not found in guides collection.`);
      if (facultyKey && !faculty) warnings.push(`Row ${i + 1}: Faculty '${facultyKey}' not found in classroomFaculty collection.`);
      if (reviewerKey && !reviewer) warnings.push(`Row ${i + 1}: Reviewer '${reviewerKey}' not found in reviewers collection.`);

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
        
        // Also auto-create project if missing team
        let currentProject = projectsToUpdate.get(projectId) || projectMap.get(projectId);
        if (!currentProject) {
          currentProject = {
            projectId: projectId,
            teamId,
            projectTitle: `Project ${teamId}`,
            status: 'In Progress',
            guideId: guide?.id || '',
            facultyId: faculty?.id || '',
            reviewerId: reviewer?.id || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          projectsToUpdate.set(projectId, currentProject);
          stats.projectsCreated++;
        }
      } else {
        // Only update missing fields if the team already existed.
        if (!currentTeam.guideId && guide) currentTeam.guideId = guide.id;
        if (!currentTeam.facultyId && faculty) currentTeam.facultyId = faculty.id;
        if (!currentTeam.reviewerId && reviewer) currentTeam.reviewerId = reviewer.id;
        if (!currentTeam.projectId) currentTeam.projectId = projectId;
      }
      
      currentTeam.members = safeAdd(currentTeam.members, student.id);
      teamsToUpdate.set(teamId, currentTeam);

      // 2. Student Update
      // 2. Student Update - Ensure full profile fields are preserved
      const existingDoc = studentsToUpdate.get(student.id) || student;
      studentsToUpdate.set(student.id, {
        ...existingDoc,
        id: student.id,
        rollNumber: student.rollNumber || existingDoc.rollNumber || rollNumber.toUpperCase(),
        name: student.name || existingDoc.name || getValue(row, ['Student Name', 'studentName', 'Full Name', 'Name', 'name']) || `Student ${rollNumber.toUpperCase()}`,
        email: student.email || existingDoc.email || getValue(row, ['Student Email', 'studentEmail', 'Email', 'email']) || `${student.id}@kluniversity.in`,
        phone: student.phone || existingDoc.phone || getValue(row, ['Phone', 'phone', 'Mobile', 'mobile', 'Contact', 'contact']) || '',
        department: student.department || existingDoc.department || getValue(row, ['Department', 'department', 'Dept', 'dept', 'Branch']) || 'Computer Science & Engineering',
        section: student.section || existingDoc.section || section || 'A',
        batch: student.batch || existingDoc.batch || batch || '2026',
        teamId,
        projectId: currentTeam.projectId,
        guideId: currentTeam.guideId,
        facultyId: currentTeam.facultyId,
        reviewerId: currentTeam.reviewerId,
        guideName: guide?.name || guide?.['Guide Name'] || '',
        facultyName: faculty?.name || faculty?.['Faculty Name'] || '',
        reviewerName: reviewer?.name || reviewer?.['Reviewer Name'] || '',
        facultyPanel,
        reviewSchedule,
        room,
        assignmentStatus: 'Assigned',
        status: 'Active',
        updatedAt: new Date().toISOString()
      });
      stats.studentsLinked++;
      stats.studentsUpdated++;

      // 3. Add to New Relationships (Guides/Faculty/Reviewers for the Student, and ensure Team is linked)
      if (currentTeam.guideId) {
        const linkedGuide = allGuides.find(g => g.id === currentTeam.guideId);
        if (linkedGuide) {
          const guideCache = getEntityCache(guidesToUpdate, linkedGuide);
          guideCache.assignedStudents = safeAdd(guideCache.assignedStudents, student.id);
          guideCache.assignedTeams = safeAdd(guideCache.assignedTeams, teamId);
          guideCache.projectIds = safeAdd(guideCache.projectIds, currentTeam.projectId);
        }
      }

      if (currentTeam.facultyId) {
        const linkedFaculty = allFaculty.find(f => f.id === currentTeam.facultyId);
        if (linkedFaculty) {
          const facultyCache = getEntityCache(facultyToUpdate, linkedFaculty);
          facultyCache.assignedStudents = safeAdd(facultyCache.assignedStudents, student.id);
          facultyCache.assignedTeams = safeAdd(facultyCache.assignedTeams, teamId);
          facultyCache.projectIds = safeAdd(facultyCache.projectIds, currentTeam.projectId);
        }
      }

      if (currentTeam.reviewerId) {
        const linkedReviewer = allReviewers.find(r => r.id === currentTeam.reviewerId);
        if (linkedReviewer) {
          const reviewerCache = getEntityCache(reviewersToUpdate, linkedReviewer);
          reviewerCache.assignedStudents = safeAdd(reviewerCache.assignedStudents, student.id);
          reviewerCache.assignedTeams = safeAdd(reviewerCache.assignedTeams, teamId);
          reviewerCache.projectIds = safeAdd(reviewerCache.projectIds, currentTeam.projectId);
        }
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
      teamsToUpdate.forEach((data, id) => {
        addOperation('teams', id, data);
        if (data.guideId) {
          addOperation('guideAssignments', `gasm-${data.guideId}-${id}`, {
            id: `gasm-${data.guideId}-${id}`,
            guideId: data.guideId,
            teamId: id,
            projectId: data.projectId || '',
            members: data.members || [],
            createdAt: new Date().toISOString()
          });
        }
        if (data.facultyId) {
          addOperation('facultyAssignments', `fasm-${data.facultyId}-${id}`, {
            id: `fasm-${data.facultyId}-${id}`,
            facultyId: data.facultyId,
            teamId: id,
            projectId: data.projectId || '',
            members: data.members || [],
            createdAt: new Date().toISOString()
          });
        }
        if (data.reviewerId) {
          addOperation('reviewerAssignments', `rasm-${data.reviewerId}-${id}`, {
            id: `rasm-${data.reviewerId}-${id}`,
            reviewerId: data.reviewerId,
            teamId: id,
            reviewCycleId: 'cycle-1',
            status: 'Active',
            createdAt: new Date().toISOString()
          });
        }
        if (data.projectId) {
          addOperation('projectAssignments', `pasm-${data.projectId}-${id}`, {
            id: `pasm-${data.projectId}-${id}`,
            projectId: data.projectId,
            teamId: id,
            createdAt: new Date().toISOString()
          });
        }
      });

      projectsToUpdate.forEach((data, id) => addOperation('projects', id, data));

      studentsToUpdate.forEach((data, id) => {
        addOperation('students', id, data);
        if (data.teamId) {
          addOperation('teamAssignments', `tasm-${data.teamId}-${id}`, {
            id: `tasm-${data.teamId}-${id}`,
            teamId: data.teamId,
            studentId: id,
            rollNumber: data.rollNumber || '',
            createdAt: new Date().toISOString()
          });
        }
      });

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

    stats.guidesUpdated = guidesToUpdate.size;
    stats.facultyUpdated = facultyToUpdate.size;
    stats.reviewersUpdated = reviewersToUpdate.size;
    stats.studentsUpdated = studentsToUpdate.size;
    stats.teamsCreated = teamsToUpdate.size;

    console.log(`[SYNC ENGINE] Synchronization completed.`);
    return { stats, warnings, failures };
  },

  syncGuideAssignments: async (records) => {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const getValue = (row, aliases) => {
      for (const key of aliases) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const guideId = getValue(row, ['Guide ID', 'guideId', 'GuideID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Guide Email', 'guideEmail', 'Email', 'email']);
      const guideName = getValue(row, ['Guide Name', 'guideName', 'Name', 'name']);
      const teamId = getValue(row, ['Team ID', 'teamId', 'TeamNo', 'Team No', 'team']);
      const projectId = getValue(row, ['Project ID', 'projectId', 'Project Title', 'projectTitle']);
      const membersRaw = getValue(row, ['Student IDs', 'studentIds', 'Members', 'members', 'Students', 'students']);

      if ((!guideId && !guideName) || !teamId) {
        skipped++;
        continue;
      }

      const cleanGuideId = (guideId || guideName).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const cleanTeamId = teamId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const docId = `gasm-${cleanGuideId}-${cleanTeamId}`;

      const studentIds = membersRaw ? (Array.isArray(membersRaw) ? membersRaw : String(membersRaw).split(',').map(s => s.trim()).filter(Boolean)) : [];

      const docData = {
        id: docId,
        guideId: guideId || guideName,
        guideName: guideName || guideId,
        teamId,
        projectId: projectId || `PRJ-${teamId}`,
        studentIds,
        members: studentIds,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      };

      batch.set(doc(db, 'guideAssignments', docId), docData, { merge: true });
      imported++;
    }

    if (imported > 0) {
      await batch.commit();
    }

    return { imported, skipped, failed, totalWrites: imported };
  },

  syncFacultyAssignments: async (records) => {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const getValue = (row, aliases) => {
      for (const key of aliases) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const facultyId = getValue(row, ['Faculty ID', 'facultyId', 'FacultyID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Faculty Email', 'facultyEmail', 'Email', 'email']);
      const facultyName = getValue(row, ['Faculty Name', 'facultyName', 'Name', 'name']);
      const teamId = getValue(row, ['Team ID', 'teamId', 'TeamNo', 'Team No', 'team']);
      const projectId = getValue(row, ['Project ID', 'projectId', 'Project Title', 'projectTitle']);
      const membersRaw = getValue(row, ['Student IDs', 'studentIds', 'Members', 'members', 'Students', 'students']);

      if ((!facultyId && !facultyName) || !teamId) {
        skipped++;
        continue;
      }

      const cleanFacId = (facultyId || facultyName).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const cleanTeamId = teamId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const docId = `fasm-${cleanFacId}-${cleanTeamId}`;

      const studentIds = membersRaw ? (Array.isArray(membersRaw) ? membersRaw : String(membersRaw).split(',').map(s => s.trim()).filter(Boolean)) : [];

      const docData = {
        id: docId,
        facultyId: facultyId || facultyName,
        facultyName: facultyName || facultyId,
        teamId,
        projectId: projectId || `PRJ-${teamId}`,
        studentIds,
        members: studentIds,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      };

      batch.set(doc(db, 'facultyAssignments', docId), docData, { merge: true });
      imported++;
    }

    if (imported > 0) {
      await batch.commit();
    }

    return { imported, skipped, failed, totalWrites: imported };
  },

  syncReviewerAssignments: async (records) => {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const getValue = (row, aliases) => {
      for (const key of aliases) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const reviewerId = getValue(row, ['Reviewer ID', 'reviewerId', 'ReviewerID', 'Employee ID', 'employeeId', 'Emp ID', 'EmpID', 'Reviewer Email', 'reviewerEmail', 'Email', 'email']);
      const reviewerName = getValue(row, ['Reviewer Name', 'reviewerName', 'Name', 'name']);
      const teamId = getValue(row, ['Team ID', 'teamId', 'TeamNo', 'Team No', 'team']);
      const reviewCycleId = getValue(row, ['Review Cycle', 'reviewCycle', 'Cycle ID', 'cycleId']) || 'cycle-1';

      if ((!reviewerId && !reviewerName) || !teamId) {
        skipped++;
        continue;
      }

      const cleanRevId = (reviewerId || reviewerName).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const cleanTeamId = teamId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const docId = `rasm-${cleanRevId}-${cleanTeamId}`;

      const docData = {
        id: docId,
        reviewerId: reviewerId || reviewerName,
        reviewerName: reviewerName || reviewerId,
        teamId,
        reviewCycleId,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      };

      batch.set(doc(db, 'reviewerAssignments', docId), docData, { merge: true });
      imported++;
    }

    if (imported > 0) {
      await batch.commit();
    }

    return { imported, skipped, failed, totalWrites: imported };
  },

  syncTeamAssignments: async (records) => {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const getValue = (row, aliases) => {
      for (const key of aliases) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const teamId = getValue(row, ['Team ID', 'teamId', 'TeamNo', 'Team No', 'team']);
      const studentId = getValue(row, ['Roll Number', 'rollNumber', 'RollNo', 'Roll No', 'Student ID', 'studentId', 'Email', 'email']);

      if (!teamId || !studentId) {
        skipped++;
        continue;
      }

      const cleanStudentId = studentId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const cleanTeamId = teamId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const docId = `tasm-${cleanTeamId}-${cleanStudentId}`;

      const docData = {
        id: docId,
        teamId,
        studentId: studentId.toUpperCase(),
        rollNumber: studentId.toUpperCase(),
        status: 'Active',
        createdAt: now,
        updatedAt: now
      };

      batch.set(doc(db, 'teamAssignments', docId), docData, { merge: true });
      imported++;
    }

    if (imported > 0) {
      await batch.commit();
    }

    return { imported, skipped, failed, totalWrites: imported };
  },

  syncProjectAssignments: async (records) => {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const getValue = (row, aliases) => {
      for (const key of aliases) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const projectId = getValue(row, ['Project ID', 'projectId', 'Project Title', 'projectTitle']);
      const teamId = getValue(row, ['Team ID', 'teamId', 'TeamNo', 'Team No', 'team']);

      if (!projectId || !teamId) {
        skipped++;
        continue;
      }

      const cleanProjId = projectId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const cleanTeamId = teamId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const docId = `pasm-${cleanProjId}-${cleanTeamId}`;

      const docData = {
        id: docId,
        projectId,
        teamId,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      };

      batch.set(doc(db, 'projectAssignments', docId), docData, { merge: true });
      imported++;
    }

    if (imported > 0) {
      await batch.commit();
    }

    return { imported, skipped, failed, totalWrites: imported };
  }
};
