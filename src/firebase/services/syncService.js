import { FirestoreService } from './firestore';
import { db } from '../config';
import { collection, writeBatch, doc } from 'firebase/firestore';

export const syncService = {
  /**
   * Purges all dummy data from related collections.
   * Keeps admin config and auth intact.
   */
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

  /**
   * Enterprise Assignment Synchronization Logic
   * Matches Students, Guides, Faculty, Reviewers and generates Teams and Projects.
   * @param {Array} assignments Array of row objects from Assignments.xlsx
   */
  syncAssignments: async (assignments) => {
    console.log(`[SYNC ENGINE] 1. Assignments upload started. Parse complete.`);
    console.log(`[SYNC ENGINE] 2. Total assignment rows parsed: ${assignments.length}`);

    // 1. Fetch all existing entities to cross-reference
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

    // Maps for fast lookup
    const studentMap = new Map(allStudents.map(s => [getField(s, ['rollNumber', 'Roll Number', 'employeeId', 'Employee ID', 'Email', 'email']).toLowerCase(), s]));
    const guideMap = new Map(allGuides.map(g => [getField(g, ['employeeId', 'Employee ID', 'email', 'Email']).toLowerCase(), g]));
    const facultyMap = new Map(allFaculty.map(f => [getField(f, ['employeeId', 'Employee ID', 'email', 'Email']).toLowerCase(), f]));
    const reviewerMap = new Map(allReviewers.map(r => [getField(r, ['employeeId', 'Employee ID', 'email', 'Email']).toLowerCase(), r]));

    let teamsCreated = 0;
    let studentsAssigned = 0;
    const teamMap = new Map(allTeams.map(t => [t.teamId, t])); // teamId -> team object

    for (let i = 0; i < assignments.length; i++) {
      const row = assignments[i];
      try {
        console.log(`\n--- Processing Row ${i + 1} ---`);
        // Extract fields matching the Excel headers
        const rollNumber = getField(row, ['Roll Number', 'rollNumber']).toLowerCase();
        const teamId = getField(row, ['Team ID', 'teamId']);
        const guideId = getField(row, ['Guide Employee ID', 'Guide Email', 'guideEmail', 'guideId']).toLowerCase();
        const facultyId = getField(row, ['Faculty Employee ID', 'Faculty Email', 'facultyEmail', 'facultyId']).toLowerCase();
        const reviewerId = getField(row, ['Reviewer Employee ID', 'Reviewer Email', 'reviewerEmail', 'reviewerId']).toLowerCase();
        const facultyPanel = getField(row, ['Faculty Panel', 'facultyPanel']);
        const reviewSchedule = getField(row, ['Review Schedule', 'reviewSchedule']);
        const room = getField(row, ['Room', 'room']);
        const academicYear = getField(row, ['Academic Year', 'academicYear']) || '2026-27';
        const batch = getField(row, ['Batch', 'batch']) || '2022-26';
        const section = getField(row, ['Section', 'section']) || 'A';

        if (!rollNumber || !teamId) {
          console.warn(`[SYNC ENGINE] Row ${i + 1}: Missing Roll Number or Team ID. Skipping.`);
          continue;
        }

        const student = studentMap.get(rollNumber);
        const guide = guideMap.get(guideId);
        const faculty = facultyMap.get(facultyId);
        const reviewer = reviewerMap.get(reviewerId);

        console.log(`[SYNC ENGINE] 3. Student lookup for ${rollNumber}: ${student ? 'Found' : 'Not Found'}`);
        console.log(`[SYNC ENGINE] 4. Guide lookup for ${guideId}: ${guide ? 'Found' : 'Not Found'}`);
        console.log(`[SYNC ENGINE] 5. Faculty lookup for ${facultyId}: ${faculty ? 'Found' : 'Not Found'}`);
        console.log(`[SYNC ENGINE] 6. Reviewer lookup for ${reviewerId}: ${reviewer ? 'Found' : 'Not Found'}`);

        if (!student) {
          console.warn(`[SYNC ENGINE] Row ${i + 1}: Cannot map student ${rollNumber}. Skipping.`);
          continue;
        }

        // 5. Create Team if it does not exist
        let currentTeam = teamMap.get(teamId);
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
            members: [], // Array of student IDs
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          const newTeamId = await FirestoreService.create('teams', currentTeam);
          currentTeam.id = newTeamId;
          console.log(`[SYNC ENGINE] 7. Team created: ${teamId} (Doc ID: ${newTeamId})`);
          
          // Also create an associated project record for the team
          const newProjectId = await FirestoreService.create('projects', {
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
          console.log(`[SYNC ENGINE] 8. Project created: PRJ-${teamId} (Doc ID: ${newProjectId})`);

          currentTeam.projectId = newProjectId;
          await FirestoreService.update('teams', newTeamId, { projectId: newProjectId });

          teamMap.set(teamId, currentTeam);
          teamsCreated++;
        } else {
          console.log(`[SYNC ENGINE] 7. Team found: ${teamId}`);
          console.log(`[SYNC ENGINE] 8. Project found: ${currentTeam.projectId || 'None'}`);
        }

        // Add student to team members if not already there
        if (!currentTeam.members.includes(student.id)) {
          currentTeam.members.push(student.id);
          await FirestoreService.update('teams', currentTeam.id, { members: currentTeam.members });
        }

        // Update student document
        await FirestoreService.update('students', student.id, {
          teamId,
          projectId: currentTeam.projectId || '',
          guideId: guide?.id || '',
          facultyId: faculty?.id || '',
          reviewerId: reviewer?.id || '',
          facultyPanel,
          reviewSchedule,
          room,
          status: 'Active'
        });
        console.log(`[SYNC ENGINE] 9. Student updated: ${student.id}`);
        studentsAssigned++;

        // Update relationships for Guide, Faculty, Reviewer
        const safeAdd = (arr, val) => {
          if (!val) return arr || [];
          const res = arr || [];
          if (!res.includes(val)) res.push(val);
          return res;
        };

        if (guide) {
          guide.assignedStudents = safeAdd(guide.assignedStudents, student.id);
          guide.assignedTeams = safeAdd(guide.assignedTeams, teamId);
          guide.projectIds = safeAdd(guide.projectIds, currentTeam.projectId);
          guide.studentCount = guide.assignedStudents.length;
          await FirestoreService.update('guides', guide.id, {
            assignedStudents: guide.assignedStudents,
            assignedTeams: guide.assignedTeams,
            projectIds: guide.projectIds,
            studentCount: guide.studentCount
          });
          console.log(`[SYNC ENGINE] 10. Guide updated: ${guide.id}`);
        } else {
          console.log(`[SYNC ENGINE] 10. Guide update skipped (none matched).`);
        }

        if (faculty) {
          faculty.assignedStudents = safeAdd(faculty.assignedStudents, student.id);
          faculty.assignedTeams = safeAdd(faculty.assignedTeams, teamId);
          faculty.projectIds = safeAdd(faculty.projectIds, currentTeam.projectId);
          faculty.studentCount = faculty.assignedStudents.length;
          await FirestoreService.update('classroomFaculty', faculty.id, {
            assignedStudents: faculty.assignedStudents,
            assignedTeams: faculty.assignedTeams,
            projectIds: faculty.projectIds,
            studentCount: faculty.studentCount
          });
          console.log(`[SYNC ENGINE] 11. Faculty updated: ${faculty.id}`);
        } else {
          console.log(`[SYNC ENGINE] 11. Faculty update skipped (none matched).`);
        }

        if (reviewer) {
          reviewer.assignedStudents = safeAdd(reviewer.assignedStudents, student.id);
          reviewer.assignedTeams = safeAdd(reviewer.assignedTeams, teamId);
          reviewer.projectIds = safeAdd(reviewer.projectIds, currentTeam.projectId);
          reviewer.studentCount = reviewer.assignedStudents.length;
          await FirestoreService.update('reviewers', reviewer.id, {
            assignedStudents: reviewer.assignedStudents,
            assignedTeams: reviewer.assignedTeams,
            projectIds: reviewer.projectIds,
            studentCount: reviewer.studentCount
          });
          console.log(`[SYNC ENGINE] 12. Reviewer updated: ${reviewer.id}`);
        } else {
          console.log(`[SYNC ENGINE] 12. Reviewer update skipped (none matched).`);
        }
        
        console.log(`[SYNC ENGINE] 13. Sequential writes for Row ${i + 1} completed successfully.`);

      } catch (err) {
        console.error(`[SYNC ENGINE] ERROR on row ${i + 1}: ${err.message}`, err);
      }
    }
    
    console.log(`[SYNC ENGINE] 14. Synchronization completed.`);
    return { teamsCreated, studentsAssigned };
  }
};
