import { useData } from '@/contexts/DataContext';
import { resolveTeamRelations } from '@/utils/relationshipResolver';

export const calculateGrade = (percentage) => {
  const val = Number(percentage);
  if (isNaN(val)) return 'F';
  if (val >= 90) return 'A+';
  if (val >= 80) return 'A';
  if (val >= 70) return 'B';
  if (val >= 50) return 'C';
  return 'F';
};

export const useEvaluationCenterData = () => {
  const {
    projects = [],
    students = [],
    guides = [],
    reviewers = [],
    faculty = [],
    reviews = [],
    guideMarks = [],
    marks: facultyMarks = [],
    evaluations = [],
    teams: teamsList = [],
    reviewCycles = [],
    guideAssignments = [],
    facultyAssignments = [],
    reviewerAssignments = [],
    dataLoading
  } = useData() || {};

  const getTeamsWithEvaluations = () => {
    if (dataLoading) return [];

    const baseTeams = teamsList && teamsList.length > 0 ? teamsList : projects;

    return baseTeams.map((team, index) => {
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
        evaluations,
        guideMarks,
        facultyMarks,
        reviews
      }) || {};

      const teamId = resolved.teamId || team.teamId || team.id || `TEAM${String(index + 1).padStart(3, '0')}`;
      const cleanTeamId = String(teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      const members = (resolved.members && resolved.members.length > 0)
        ? resolved.members
        : (resolved.assignedStudents && resolved.assignedStudents.length > 0
          ? resolved.assignedStudents
          : students.filter(s => {
              const sTeamId = String(s.teamId || s.team || s.projectId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              return sTeamId === cleanTeamId || String(s.projectId || '').toLowerCase() === String(team.id).toLowerCase();
            }));

      const teamEvals = (evaluations || []).filter(e => {
        const eTeamId = String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return eTeamId === cleanTeamId;
      }).sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));

      const guideEval = teamEvals.find(e => e.role === 'guide');
      const facultyEval = teamEvals.find(e => e.role === 'classroom_faculty' || e.role === 'faculty');
      const isR3 = (e) => {
        const c = String(e.reviewCycle || e.reviewCycleId || '').trim().toLowerCase();
        return c === 'review 3' || c === 'review3' || c === 'cycle-3' || c === 'review-3';
      };

      const reviewerEvalR1 = teamEvals.find(e => (e.role === 'reviewer' || !e.role) && (e.reviewCycle === 'Review 1' || e.reviewCycleId === 'cycle-1'));
      const reviewerEvalR2 = teamEvals.find(e => (e.role === 'reviewer' || !e.role) && (e.reviewCycle === 'Review 2' || e.reviewCycleId === 'cycle-2'));

      const review3Eval = teamEvals.find(e => {
        if (!isR3(e)) return false;
        const rId = String(e.rubricId || '').toLowerCase();
        const rTitle = String(e.rubricTitle || '').toLowerCase();
        return rId === 'e8dde2gkwbflhz0b0j8b' || rTitle.includes('review 3 evaluation') || (!rTitle.includes('prototype') && rId !== 'rubric_prototype_review3');
      });

      const prototypeEval = teamEvals.find(e => {
        if (!isR3(e)) return false;
        const rId = String(e.rubricId || '').toLowerCase();
        const rTitle = String(e.rubricTitle || '').toLowerCase();
        return rId === 'rubric_prototype_review3' || rTitle.includes('prototype');
      });

      const guideName = resolved.guideName || team.guideName || (guideEval?.evaluatorName || 'Unassigned');
      const reviewerName = resolved.reviewerName || team.reviewerName || (reviewerEvalR1?.evaluatorName || 'Unassigned');
      const facultyPanelName = resolved.facultyName || team.facultyName || (facultyEval?.evaluatorName || 'Unassigned');

      const gMark = guideEval?.teamAverage ?? (team.guideScore > 0 ? team.guideScore : null);
      const fMark = facultyEval?.teamAverage ?? (team.facultyScore > 0 ? team.facultyScore : null);
      const r1 = reviewerEvalR1?.teamAverage ?? (team.review1Score > 0 ? team.review1Score : null);
      const r2 = reviewerEvalR2?.teamAverage ?? (team.review2Score > 0 ? team.review2Score : null);

      const r3 = (review3Eval?.totalScore !== undefined && review3Eval?.totalScore !== null)
        ? review3Eval.totalScore
        : (review3Eval?.teamAverage !== undefined && review3Eval?.teamAverage !== null ? review3Eval.teamAverage : (team.review3Score > 0 ? team.review3Score : null));

      const protoScore = (prototypeEval?.totalScore !== undefined && prototypeEval?.totalScore !== null)
        ? prototypeEval.totalScore
        : (prototypeEval?.teamAverage !== undefined && prototypeEval?.teamAverage !== null ? prototypeEval.teamAverage : null);

      const r3Status = review3Eval ? (review3Eval.status === 'Locked' || review3Eval.status === 'Submitted' ? 'Submitted' : (review3Eval.status || 'Draft')) : 'PENDING';
      const protoStatus = prototypeEval ? (prototypeEval.status === 'Locked' || prototypeEval.status === 'Submitted' ? 'Submitted' : (prototypeEval.status || 'Draft')) : 'PENDING';

      const validScores = [gMark, fMark, r1, r2, r3, protoScore].filter(v => v !== null && v !== undefined);
      const totalWeightedScore = validScores.length > 0
        ? Math.round(validScores.reduce((sum, v) => sum + v, 0) / validScores.length)
        : null;

      const percentage = totalWeightedScore !== null ? totalWeightedScore : 0;
      const grade = totalWeightedScore !== null ? calculateGrade(percentage) : 'PENDING';
      const passStatus = totalWeightedScore !== null ? (percentage >= 50 ? 'Pass' : 'Fail') : 'Pending';

      let stageProgress = 0;
      if (gMark !== null) stageProgress += 16.6;
      if (fMark !== null) stageProgress += 16.6;
      if (r1 !== null) stageProgress += 16.6;
      if (r2 !== null) stageProgress += 16.6;
      if (r3 !== null) stageProgress += 16.6;
      if (protoScore !== null) stageProgress += 17.0;

      return {
        ...team,
        id: team.id || teamId,
        teamId,
        teamName: resolved.teamName || team.teamName || team.name || `Team ${teamId}`,
        projectTitle: resolved.projectTitle || team.projectTitle || team.title || `Project ${teamId}`,
        members,
        membersCount: members.length || resolved.studentCount || team.membersCount || 4,
        guideName,
        reviewerName,
        facultyPanelName,
        guideMarks: gMark,
        facultyMarks: fMark,
        review1Score: r1,
        review2Score: r2,
        review3Score: r3,
        prototypeScore: protoScore,
        review3Status: r3Status,
        prototypeStatus: protoStatus,
        review3RubricName: 'Review 3 Evaluation Rubric',
        prototypeRubricName: 'Prototype Rubric',
        review3MaxMarks: 50,
        prototypeMaxMarks: 50,
        finalScore: totalWeightedScore,
        percentage,
        grade,
        passStatus,
        stageProgress: Math.min(100, Math.round(stageProgress)),
        evaluations: teamEvals,
        guideEval,
        facultyEval,
        reviewerEvalR1,
        reviewerEvalR2,
        reviewerEvalR3: review3Eval,
        review3Eval,
        prototypeEval,
        approvalStage: team.approvalStage || (stageProgress >= 95 ? 'Published' : (teamEvals.length > 0 ? 'Submitted' : 'Draft')),
        isLocked: team.isLocked || teamEvals.some(e => e.status === 'Locked'),
        status: team.status || (stageProgress >= 95 ? 'Completed' : 'In Progress'),
        department: team.department || resolved.department || 'CSE',
        academicYear: team.academicYear || '2026-27',
        batch: team.batch || '2022-26',
        section: team.section || resolved.section || 'A',
        room: team.room || 'Lab 302',
        slot: team.slot || '10:00 AM - 10:30 AM'
      };
    });
  };

  const getTeamDetails = (teamId) => {
    if (dataLoading) return null;

    const allTeams = getTeamsWithEvaluations();
    const cleanId = String(teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const team = allTeams.find(t => {
      const tId = String(t.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const tTeamId = String(t.teamId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return tId === cleanId || tTeamId === cleanId || t.projectTitle?.toLowerCase().replace(/\s+/g, '-') === teamId;
    });

    if (!team) return null;

    return team;
  };

  return {
    dataLoading,
    getTeamsWithEvaluations,
    getTeamDetails
  };
};
