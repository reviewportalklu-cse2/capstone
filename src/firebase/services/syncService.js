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
    // 1. Fetch all existing entities to cross-reference
    const allStudents = await FirestoreService.getAll('students');
    const allGuides = await FirestoreService.getAll('guides');
    const allFaculty = await FirestoreService.getAll('classroomFaculty');
    const allReviewers = await FirestoreService.getAll('reviewers');
    const allTeams = await FirestoreService.getAll('teams');

    // Maps for fast lookup
    const studentMap = new Map(allStudents.map(s => [String(s.rollNumber || s.employeeId || '').toLowerCase(), s]));
    const guideMap = new Map(allGuides.map(g => [String(g.employeeId || g.email || '').toLowerCase(), g]));
    const facultyMap = new Map(allFaculty.map(f => [String(f.employeeId || f.email || '').toLowerCase(), f]));
    const reviewerMap = new Map(allReviewers.map(r => [String(r.employeeId || r.email || '').toLowerCase(), r]));

    let teamsCreated = 0;
    let studentsAssigned = 0;
    const teamMap = new Map(allTeams.map(t => [t.teamId, t])); // teamId -> team object

    for (const row of assignments) {
      try {
        // Extract fields matching the Excel headers
        const rollNumber = String(row['Roll Number'] || row.rollNumber || '').toLowerCase();
        const teamId = String(row['Team ID'] || row.teamId || '');
        const guideId = String(row['Guide Employee ID'] || row['Guide Email'] || row.guideEmail || '').toLowerCase();
        const facultyId = String(row['Faculty Employee ID'] || row['Faculty Email'] || row.facultyEmail || '').toLowerCase();
        const reviewerId = String(row['Reviewer Employee ID'] || row['Reviewer Email'] || row.reviewerEmail || '').toLowerCase();
        const facultyPanel = row['Faculty Panel'] || row.facultyPanel || '';
        const reviewSchedule = row['Review Schedule'] || row.reviewSchedule || '';
        const room = row['Room'] || row.room || '';
        const academicYear = row['Academic Year'] || row.academicYear || '2026-27';
        const batch = row['Batch'] || row.batch || '2022-26';
        const section = row['Section'] || row.section || 'A';

        if (!rollNumber || !teamId) continue;

        const student = studentMap.get(rollNumber);
        const guide = guideMap.get(guideId);
        const faculty = facultyMap.get(facultyId);
        const reviewer = reviewerMap.get(reviewerId);

        if (!student) continue;

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

          currentTeam.projectId = newProjectId;
          await FirestoreService.update('teams', newTeamId, { projectId: newProjectId });

          teamMap.set(teamId, currentTeam);
          teamsCreated++;
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
        }
      } catch (err) {
        console.error(`Failed to process row for Roll Number: ${row['Roll Number'] || row.rollNumber}:`, err);
      }
    }

    return { teamsCreated, studentsAssigned };
  }
};
