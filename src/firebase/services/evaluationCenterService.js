import { FirestoreService } from './firestore.js';
import { studentService } from './studentService.js';
import { projectService } from './projectService.js';
import { guideService } from './guideService.js';
import { reviewerService } from './reviewerService.js';
import { facultyService } from './facultyService.js';
import { reviewService } from './reviewService.js';
import { marksService } from './marksService.js';
import { notificationService } from './notificationService.js';
import { auditService } from './auditService.js';
import { resolveTeamRelations } from '../../utils/relationshipResolver.js';

export const evaluationCenterService = {
  // Configurable weightages (Default 20% each)
  getWeightages: () => ({
    guide: 20,
    faculty: 20,
    review1: 20,
    review2: 20,
    review3: 20
  }),

  // Calculate grade based on percentage
  calculateGrade: (percentage) => {
    const val = Number(percentage);
    if (isNaN(val)) return 'F';
    if (val >= 90) return 'A+';
    if (val >= 80) return 'A';
    if (val >= 70) return 'B';
    if (val >= 50) return 'C';
    return 'F';
  },

  // Get all teams with complete aggregated evaluation metadata
  getAllTeamsWithEvaluations: async () => {
    try {
      const [
        projects = [],
        students = [],
        guides = [],
        reviewers = [],
        faculty = [],
        reviews = [],
        guideMarks = [],
        facultyMarks = [],
        evaluationsDocs = [],
        teamsDocs = [],
        guideAssignments = [],
        facultyAssignments = [],
        reviewerAssignments = [],
        reviewCycles = []
      ] = await Promise.all([
        projectService.getAll(),
        studentService.getAll(),
        guideService.getAll(),
        reviewerService.getAll(),
        facultyService.getAll(),
        reviewService.getAll(),
        marksService.getGuideMarks(),
        marksService.getFacultyMarks(),
        FirestoreService.getAll('evaluations'),
        FirestoreService.getAll('teams'),
        FirestoreService.getAll('guideAssignments'),
        FirestoreService.getAll('facultyAssignments'),
        FirestoreService.getAll('reviewerAssignments'),
        FirestoreService.getAll('reviewCycles')
      ]);

      // Combine teams, projects, and evaluations collection
      const teamMap = new Map();
      (teamsDocs || []).forEach(t => {
        const id = t.teamId || t.id;
        if (id) {
          teamMap.set(String(id).toLowerCase(), { ...t, id, teamId: id });
        }
      });
      (projects || []).forEach(p => {
        const id = p.teamId || p.id;
        if (id) {
          const key = String(id).toLowerCase();
          const existing = teamMap.get(key) || {};
          teamMap.set(key, { ...existing, ...p, id: existing.id || id, teamId: existing.teamId || id, title: p.title || p.projectTitle || existing.title || `Project ${id}` });
        }
      });
      (evaluationsDocs || []).forEach(e => {
        const id = e.teamId || e.team;
        if (id && !teamMap.has(String(id).toLowerCase())) {
          teamMap.set(String(id).toLowerCase(), { id, teamId: id, title: e.projectName || `Team ${id}`, teamName: e.teamName || `Team ${id}`, department: 'CSE' });
        }
      });

      const combinedList = Array.from(teamMap.values());

      return combinedList.map((team, index) => {
        const resolved = resolveTeamRelations(team, {
          students,
          projects,
          guides,
          faculty,
          reviewers,
          reviewCycles,
          guideAssignments,
          facultyAssignments,
          reviewerAssignments,
          evaluations: evaluationsDocs,
          guideMarks,
          facultyMarks,
          reviews
        }) || {};

        const teamId = resolved.teamId || team.teamId || team.id || `TEAM${String(index + 1).padStart(3, '0')}`;
        const cleanTeamId = String(teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        // Members assigned to this team
        const members = (resolved.members && resolved.members.length > 0)
          ? resolved.members
          : (resolved.assignedStudents && resolved.assignedStudents.length > 0
            ? resolved.assignedStudents
            : students.filter(s => {
                const sTeamId = String(s.teamId || s.team || s.projectId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                return sTeamId === cleanTeamId || String(s.projectId || '').toLowerCase() === String(team.id).toLowerCase();
              }));

        // Fetch evaluations for this team sorted by timestamp descending
        const teamEvals = evaluationsDocs.filter(e => {
          const eTeamId = String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return eTeamId === cleanTeamId;
        }).sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));

        const guideEval = teamEvals.find(e => e.role === 'guide');
        const facultyEval = teamEvals.find(e => e.role === 'classroom_faculty' || e.role === 'faculty');
        const reviewerEvalR1 = teamEvals.find(e => e.role === 'reviewer' && (e.reviewCycle === 'Review 1' || e.reviewCycleId === 'cycle-1'));
        const reviewerEvalR2 = teamEvals.find(e => e.role === 'reviewer' && (e.reviewCycle === 'Review 2' || e.reviewCycleId === 'cycle-2'));
        const reviewerEvalR3 = teamEvals.find(e => e.role === 'reviewer' && (e.reviewCycle === 'Review 3' || e.reviewCycleId === 'cycle-3'));

        // Mentor details resolved canonically
        const guideName = resolved.guideName || team.guideName || guideEval?.evaluatorName || 'Unassigned';
        const reviewerName = resolved.reviewerName || team.reviewerName || reviewerEvalR1?.evaluatorName || 'Unassigned';
        const facultyPanelName = resolved.facultyName || team.facultyName || facultyEval?.evaluatorName || 'Unassigned';

        const gMark = guideEval?.teamAverage ?? (team.guideScore > 0 ? team.guideScore : null);
        const fMark = facultyEval?.teamAverage ?? (team.facultyScore > 0 ? team.facultyScore : null);

        const r1 = reviewerEvalR1?.teamAverage ?? (team.review1Score > 0 ? team.review1Score : null);
        const r2 = reviewerEvalR2?.teamAverage ?? (team.review2Score > 0 ? team.review2Score : null);
        const r3 = reviewerEvalR3?.teamAverage ?? (team.review3Score > 0 ? team.review3Score : null);

        const validScores = [gMark, fMark, r1, r2, r3].filter(v => v !== null && v !== undefined);
        const totalWeightedScore = validScores.length > 0
          ? Math.round(validScores.reduce((sum, v) => sum + v, 0) / validScores.length)
          : null;

        const percentage = totalWeightedScore !== null ? totalWeightedScore : 0;
        const grade = totalWeightedScore !== null ? evaluationCenterService.calculateGrade(percentage) : 'PENDING';
        const passStatus = totalWeightedScore !== null ? (percentage >= 50 ? 'Pass' : 'Fail') : 'Pending';

        // Stage progress
        let stageProgress = 0;
        if (gMark !== null) stageProgress += 20;
        if (fMark !== null) stageProgress += 20;
        if (r1 !== null) stageProgress += 20;
        if (r2 !== null) stageProgress += 20;
        if (r3 !== null) stageProgress += 20;

        // Formatted timestamp of last evaluation activity
        const latestEvalDate = [guideEval, facultyEval, reviewerEvalR1, reviewerEvalR2, reviewerEvalR3]
          .filter(Boolean)
          .map(e => e.submittedAt || e.evaluatedAt || e.updatedAt || e.createdAt)
          .sort()
          .reverse()[0];

        const formattedDate = latestEvalDate
          ? new Date(latestEvalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Pending';

        const formattedTime = latestEvalDate
          ? new Date(latestEvalDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : '';

        return {
          ...team,
          id: team.id || teamId,
          teamId,
          teamName: resolved.teamName || team.teamName || team.name || `Team ${teamId}`,
          projectTitle: resolved.projectTitle || team.projectTitle || team.title || `Project ${teamId}`,
          members,
          membersCount: members.length || resolved.memberCount || team.membersCount || 4,
          guideName,
          reviewerName,
          facultyPanelName,
          guideMarks: gMark,
          facultyMarks: fMark,
          review1Score: r1,
          review2Score: r2,
          review3Score: r3,
          finalScore: totalWeightedScore,
          percentage,
          grade,
          passStatus,
          stageProgress,
          evaluations: teamEvals,
          statusMatrix: evaluationCenterService.deriveTeamStatusMatrix(team.id || teamId, evaluationsDocs, reviewCycles),
          latestEvalDate: formattedDate,
          latestEvalTime: formattedTime,
          approvalStage: team.approvalStage || (stageProgress === 100 ? 'Published' : (teamEvals.length > 0 ? 'Submitted' : 'Draft')),
          isLocked: team.isLocked || teamEvals.some(e => e.status === 'Locked'),
          status: team.status || (stageProgress === 100 ? 'Completed' : 'In Progress'),
          department: team.department || resolved.department || 'CSE',
          academicYear: team.academicYear || '2026-27',
          batch: team.batch || '2022-26',
          section: team.section || resolved.section || 'A',
          room: team.room || 'Lab 302',
          slot: team.slot || '10:00 AM - 10:30 AM'
        };
      });
    } catch (err) {
      console.error("Error fetching all teams with evaluations:", err);
      return [];
    }
  },

  // Derive dynamic evaluation status matrix per review cycle & evaluator role directly from Firestore
  deriveTeamStatusMatrix: (teamId, evaluationsDocs = [], reviewCycles = []) => {
    const teamEvals = (evaluationsDocs || []).filter(e => String(e.teamId || e.team).toLowerCase() === String(teamId).toLowerCase());
    const cycles = reviewCycles.length > 0 ? reviewCycles : [
      { id: 'cycle-1', reviewName: 'Review 1' },
      { id: 'cycle-2', reviewName: 'Review 2' },
      { id: 'cycle-3', reviewName: 'Review 3' },
      { id: 'cycle-cp', reviewName: 'Classroom Presentation' }
    ];

    const matrix = {};
    cycles.forEach(c => {
      const cName = c.reviewName || c.name || c.id;
      const cEvals = teamEvals.filter(e => e.reviewCycle === cName || e.reviewCycleId === c.id);

      const getRoleStatus = (targetRole) => {
        const match = cEvals.find(e => e.role === targetRole || (targetRole === 'faculty' && e.role === 'classroom_faculty'));
        if (!match) return 'Not Started';
        if (match.status === 'Locked' || match.status === 'Submitted') return 'Locked';
        if (match.status === 'Draft') return 'Draft';
        return match.status || 'Draft';
      };

      matrix[cName] = {
        guide: getRoleStatus('guide'),
        faculty: getRoleStatus('faculty'),
        reviewer: getRoleStatus('reviewer')
      };
    });

    return matrix;
  },

  // Get Team Details with complete roster, rubrics, version history, documents & timeline
  getTeamDetails: async (teamId) => {
    try {
      const allTeams = await evaluationCenterService.getAllTeamsWithEvaluations();
      const team = allTeams.find(t => t.id === teamId || t.teamId === teamId || t.title?.toLowerCase().replace(/\s+/g, '-') === teamId);

      if (!team) return null;

      // Mock / Firestore Rubrics Breakdown
      const rubrics = {
        guide: {
          problemStatement: Math.round(team.guideMarks * 0.2) || 4,
          innovation: Math.round(team.guideMarks * 0.2) || 4,
          implementation: Math.round(team.guideMarks * 0.3) || 6,
          documentation: Math.round(team.guideMarks * 0.15) || 3,
          presentation: Math.round(team.guideMarks * 0.15) || 3,
          total: team.guideMarks
        },
        faculty: {
          viva: Math.round(team.facultyMarks * 0.4) || 8,
          implementation: Math.round(team.facultyMarks * 0.4) || 8,
          documentation: Math.round(team.facultyMarks * 0.2) || 4,
          total: team.facultyMarks
        },
        review1: { presentation: 25, technical: 30, qa: 25, total: team.review1Score },
        review2: { presentation: 28, technical: 32, qa: 28, total: team.review2Score },
        review3: { presentation: 30, technical: 31, qa: 30, total: team.review3Score }
      };

      // Faculty Panel details
      const facultyPanelDetails = {
        name: team.facultyPanelName || team.facultyName || 'Unassigned',
        chairperson: team.facultyName || 'Unassigned',
        members: team.facultyName ? [team.facultyName] : [],
        department: team.department || 'CSE'
      };

      // Project Documents
      const documents = team.documents || [
        { name: 'GitHub Repository Code', type: 'ZIP', size: 'Active', url: team.repoUrl || team.githubUrl || '#', date: team.updatedAt || 'N/A' }
      ];

      // Marks Version History derived from team evaluations
      const marksHistory = (team.evaluations || []).map((e, idx) => ({
        id: e.id || `v${idx + 1}`,
        date: e.submittedAt ? new Date(e.submittedAt).toLocaleDateString() : 'N/A',
        time: e.submittedAt ? new Date(e.submittedAt).toLocaleTimeString() : '',
        updatedBy: e.evaluatorName || e.evaluatorId || 'Evaluator',
        role: e.role ? e.role.toUpperCase() : 'EVALUATOR',
        previousScore: 0,
        updatedScore: e.teamAverage || e.totalScore || 0,
        reason: `${e.role || 'Evaluation'} score recorded for ${e.reviewCycle || 'Review'}.`
      }));

      // Timeline events
      const timeline = [
        {
          title: 'Guide Evaluation Submitted',
          evaluator: team.guideName,
          role: 'Guide',
          date: '2026-02-15',
          score: `${team.guideMarks}/20`,
          remarks: 'Good progress in architecture design and sprint plan.',
          status: 'Completed'
        },
        {
          title: 'Faculty Internal Assessment',
          evaluator: team.facultyPanelName,
          role: 'Classroom Faculty',
          date: '2026-03-01',
          score: `${team.facultyMarks}/20`,
          remarks: 'Solid implementation of database models and APIs.',
          status: 'Completed'
        },
        {
          title: 'Review 1 (External Evaluation)',
          evaluator: team.reviewerName,
          role: 'Panel Reviewer',
          date: '2026-03-15',
          score: `${team.review1Score}/100`,
          remarks: 'Approved with minor suggestions for frontend UI.',
          status: team.review1Score > 0 ? 'Completed' : 'Pending'
        },
        {
          title: 'Review 2 (External Evaluation)',
          evaluator: team.reviewerName,
          role: 'Panel Reviewer',
          date: '2026-04-05',
          score: `${team.review2Score}/100`,
          remarks: 'Technical implementation verified. Excellent demo.',
          status: team.review2Score > 0 ? 'Completed' : 'Pending'
        },
        {
          title: 'Review 3 (Final Defense)',
          evaluator: team.reviewerName,
          role: 'Panel Reviewer',
          date: '2026-04-20',
          score: `${team.review3Score}/100`,
          remarks: 'Outstanding project defense. Documentation complete.',
          status: team.review3Score > 0 ? 'Completed' : 'Pending'
        },
        {
          title: 'Final Results Published',
          evaluator: 'University Admin',
          role: 'Admin',
          date: '2026-04-25',
          score: `${team.finalScore}/100 (${team.grade})`,
          remarks: 'Final grades published to university records.',
          status: team.approvalStage === 'Published' ? 'Published' : 'Pending'
        }
      ];

      return {
        ...team,
        rubrics,
        facultyPanelDetails,
        documents,
        marksHistory,
        timeline
      };
    } catch (err) {
      console.error("Error fetching team details:", err);
      return null;
    }
  },

  // Toggle lock state for a team
  toggleTeamLock: async (projectId, currentLockState, operatorId) => {
    try {
      const nextState = !currentLockState;
      await projectService.update(projectId, { isLocked: nextState });
      await auditService.log(operatorId, nextState ? 'LOCK_EVALUATION' : 'UNLOCK_EVALUATION', 'Project', projectId, { isLocked: nextState });
      return nextState;
    } catch (err) {
      console.error("Failed to toggle lock:", err);
      throw err;
    }
  },

  // Update approval stage (Draft -> Submitted -> Verified -> Approved -> Published)
  updateApprovalStage: async (projectId, newStage, operatorId) => {
    try {
      await projectService.update(projectId, { approvalStage: newStage });
      await auditService.log(operatorId, `STAGE_UPDATE_${newStage.toUpperCase()}`, 'Project', projectId, { approvalStage: newStage });
      return newStage;
    } catch (err) {
      console.error("Failed to update approval stage:", err);
      throw err;
    }
  }
};
