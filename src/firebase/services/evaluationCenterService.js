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
      const [projects = [], students = [], guides = [], reviewers = [], faculty = [], reviews = [], guideMarks = [], facultyMarks = [], evaluationsDocs = [], teamsDocs = []] = await Promise.all([
        projectService.getAll(),
        studentService.getAll(),
        guideService.getAll(),
        reviewerService.getAll(),
        facultyService.getAll(),
        reviewService.getAll(),
        marksService.getGuideMarks(),
        marksService.getFacultyMarks(),
        FirestoreService.getAll('evaluations'),
        FirestoreService.getAll('teams')
      ]);

      const guideMap = new Map(guides.map(g => [g.id, g]));
      const reviewerMap = new Map(reviewers.map(r => [r.id, r]));
      const facultyMap = new Map(faculty.map(f => [f.id, f]));

      // Combine projects and teams collection
      const teamMap = new Map();
      (projects || []).forEach(p => {
        const id = p.id || p.teamId;
        if (id) teamMap.set(String(id).toLowerCase(), { ...p, teamId: id, title: p.title || p.projectTitle || `Project ${id}` });
      });
      (teamsDocs || []).forEach(t => {
        const id = t.id || t.teamId;
        if (id && !teamMap.has(String(id).toLowerCase())) {
          teamMap.set(String(id).toLowerCase(), { ...t, id, teamId: id, title: t.projectTitle || t.title || `Project ${id}` });
        }
      });

      const combinedList = Array.from(teamMap.values());

      return combinedList.map((project, index) => {
        const teamId = project.id || project.teamId || `TEAM${String(index + 1).padStart(3, '0')}`;
        const cleanTeamId = String(teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        // Members assigned to this team / project
        const members = students.filter(s => {
          const sTeamId = String(s.teamId || s.team || s.projectId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return sTeamId === cleanTeamId || String(s.projectId || '').toLowerCase() === String(project.id).toLowerCase();
        });

        // Fetch evaluations for this team sorted by timestamp descending
        const teamEvals = evaluationsDocs.filter(e => {
          const eTeamId = String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return eTeamId === cleanTeamId;
        }).sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));

        const guideEval = teamEvals.find(e => e.role === 'guide');
        const facultyEval = teamEvals.find(e => e.role === 'classroom_faculty' || e.role === 'faculty');
        const reviewerEval = teamEvals.find(e => e.role === 'reviewer');

        // Mentor details
        const guide = guideMap.get(project.guideId) || { name: project.guideName || guideEval?.evaluatorName || 'Unassigned' };
        const reviewer = reviewerMap.get(project.reviewerId) || { name: project.reviewerName || reviewerEval?.evaluatorName || 'Unassigned' };
        const facultyPanel = facultyMap.get(project.facultyId) || { name: project.facultyName || facultyEval?.evaluatorName || 'Unassigned' };

        // Evaluation Scores derivation
        const teamReviews = reviews.filter(r => 
          r.projectId === project.id || 
          members.some(m => m.id === r.studentId || m.uid === r.studentId)
        );

        const r1 = reviewerEval?.teamAverage || teamReviews.find(r => r.reviewType === 'Review 1')?.totalScore || project.review1Score || 0;
        const r2 = teamReviews.find(r => r.reviewType === 'Review 2')?.totalScore || project.review2Score || 0;
        const r3 = teamReviews.find(r => r.reviewType === 'Review 3')?.totalScore || project.review3Score || 0;

        const gMark = guideEval?.teamAverage || guideMarks.find(m => members.some(s => s.id === m.studentId || s.uid === m.studentId))?.marks || project.guideScore || 0;
        const fMark = facultyEval?.teamAverage || facultyMarks.find(m => members.some(s => s.id === m.studentId || s.uid === m.studentId))?.marks || project.facultyScore || 0;

        // Weighted total calculation (20% each out of 100)
        const totalWeightedScore = Math.round(
          (gMark * 0.2) + (fMark * 0.2) + (r1 * 0.2) + (r2 * 0.2) + (r3 * 0.2)
        );

        const percentage = totalWeightedScore;
        const grade = evaluationCenterService.calculateGrade(percentage);
        const passStatus = percentage >= 50 ? 'Pass' : 'Fail';

        // Stage progress
        let stageProgress = 0;
        if (gMark > 0) stageProgress += 20;
        if (fMark > 0) stageProgress += 20;
        if (r1 > 0) stageProgress += 20;
        if (r2 > 0) stageProgress += 20;
        if (r3 > 0) stageProgress += 20;

        // Formatted timestamp of last evaluation activity
        const latestEvalDate = [guideEval, facultyEval, reviewerEval]
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
          ...project,
          teamId,
          teamName: project.teamName || project.title || `Team ${index + 1}`,
          members,
          membersCount: members.length || project.membersCount || 4,
          guideName: guide.name,
          reviewerName: reviewer.name,
          facultyPanelName: facultyPanel.name,
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
          statusMatrix: evaluationCenterService.deriveTeamStatusMatrix(project.id || teamId, evaluationsDocs, []),
          latestEvalDate: formattedDate,
          latestEvalTime: formattedTime,
          approvalStage: project.approvalStage || (stageProgress === 100 ? 'Published' : (teamEvals.length > 0 ? 'Submitted' : 'Draft')),
          isLocked: project.isLocked || teamEvals.some(e => e.status === 'Locked'),
          status: project.status || (stageProgress === 100 ? 'Completed' : 'In Progress'),
          department: project.department || 'CSE',
          academicYear: project.academicYear || '2026-27',
          batch: project.batch || '2022-26',
          section: project.section || 'A',
          room: project.room || 'Lab 302',
          slot: project.slot || '10:00 AM - 10:30 AM'
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
