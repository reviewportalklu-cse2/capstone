import { useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { resolveStudentRelations, resolveTeamRelations, resolveEntityMatch, resolveReviewerRelationships } from '@/utils/relationshipResolver';

export const useReviewerAnalytics = () => {
  const { currentUser, domainUser } = useAuth();
  const dataContext = useData() || {};
  const {
    students = [],
    teams = [],
    projects = [],
    guides = [],
    faculty = [],
    reviewers = [],
    evaluations = [],
    reviewerAssignments = [],
    reviewCycles = [],
    dataLoading
  } = dataContext;

  // 1. Base Reviewer Info
  const reviewer = useMemo(() => {
    if (!domainUser && !currentUser) return null;
    return domainUser || currentUser; 
  }, [domainUser, currentUser]);

  // 2. Helper to get mapped teams based on assignments
  const mappedTeams = useMemo(() => {
    if (!reviewer) return [];
    
    // Multi-key lookup for reviewer document in reviewers collection
    let currentReviewer = null;
    const lookupKeys = [reviewer.email, reviewer.employeeId, reviewer.reviewerId, reviewer.id, reviewer.domainId, reviewer.name].filter(Boolean);
    for (const k of lookupKeys) {
      const match = resolveEntityMatch(reviewers, k);
      if (match) {
        currentReviewer = match;
        break;
      }
    }
    if (!currentReviewer) {
      if (reviewer.email || reviewer.employeeId || reviewer.reviewerId || reviewer.id) {
        currentReviewer = reviewer;
      } else {
        console.warn('[REVIEWER_ANALYTICS] Unresolved logged-in reviewer:', reviewer);
        return [];
      }
    }

    const { teams: resolvedTeams } = resolveReviewerRelationships(currentReviewer, dataContext);
    const activeCycle = reviewCycles.find(c => c.status === 'Active') || reviewCycles[0];

    return resolvedTeams.map(team => {
      const rel = resolveTeamRelations(team, dataContext);
      return {
        ...rel,
        assignmentId: `rasm-${rel.teamId}`,
        reviewCycleId: activeCycle?.id || 'cycle-1',
        reviewCycleName: activeCycle?.name || 'Active Cycle',
        cycleStatus: activeCycle?.status || 'Active'
      };
    });
  }, [reviewer, reviewers, dataContext, reviewCycles]);

  // 3. Active Assigned Teams (Current Cycle)
  const getAssignedTeams = useCallback(() => {
    return mappedTeams.filter(t => t.cycleStatus === 'Active').map(team => {
      // Find reviewer's evaluation for this team in this active cycle
      const teamEval = evaluations.find(e => 
        e.teamId === team.id && 
        e.reviewCycleId === team.reviewCycleId && 
        e.role === 'reviewer'
      );

      return {
        ...team,
        evaluationStatus: teamEval ? teamEval.status : 'Pending',
        evaluationId: teamEval?.id
      };
    });
  }, [mappedTeams, evaluations]);

  // 4. Historical Reviews (Past Cycles)
  const getReviewHistory = useCallback(() => {
    return mappedTeams.filter(t => t.cycleStatus !== 'Active').map(team => {
      const teamEval = evaluations.find(e => 
        e.teamId === team.id && 
        e.reviewCycleId === team.reviewCycleId && 
        e.role === 'reviewer'
      );

      return {
        ...team,
        evaluationStatus: teamEval ? teamEval.status : 'Pending',
        evaluationId: teamEval?.id,
        marks: teamEval?.marks,
        remarks: teamEval?.remarks,
        totalScore: teamEval?.totalScore || teamEval?.teamAverage,
        evaluationDate: teamEval?.updatedAt || teamEval?.createdAt,
      };
    });
  }, [mappedTeams, evaluations]);

  // 5. Reviewer Timeline
  const getReviewerTimeline = useCallback(() => {
    if (!reviewer) return [];
    const timeline = [];

    // Add assignment events
    reviewerAssignments.filter(a => a.reviewerId === reviewer.id || a.reviewerId === reviewer.domainId).forEach(assignment => {
      const cycle = reviewCycles.find(c => c.id === assignment.reviewCycleId);
      timeline.push({ 
        type: 'assignment', 
        title: `Assigned to Team ${assignment.teamId}`, 
        date: assignment.createdAt || new Date().toISOString(), 
        details: `Cycle: ${cycle?.name || cycle?.reviewName}` 
      });
    });
    
    // Add evaluation events
    const myEvaluations = evaluations.filter(e => e.role === 'reviewer' && (e.evaluatorId === reviewer.id || e.evaluatorId === reviewer.domainId));
    myEvaluations.forEach(e => {
      timeline.push({ 
        type: 'evaluation', 
        title: `Evaluated Team ${e.teamId}`, 
        date: e.updatedAt || e.createdAt, 
        details: `Cycle: ${e.reviewCycle}` 
      });
    });

    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [reviewer, reviewerAssignments, reviewCycles, evaluations]);

  // 6. Dashboard Stats
  const dashboardStats = useMemo(() => {
    if (!reviewer) return null;
    
    const activeTeams = getAssignedTeams();
    const historyTeams = getReviewHistory();
    
    const pendingReviews = activeTeams.filter(t => t.evaluationStatus === 'Pending' || t.evaluationStatus === 'Draft').length;
    const completedReviews = activeTeams.filter(t => t.evaluationStatus === 'Locked' || t.evaluationStatus === 'Published').length;
    
    const allEvaluations = evaluations.filter(e => e.role === 'reviewer' && (e.evaluatorId === reviewer.id || e.evaluatorId === reviewer.domainId));
    const lockedEvaluations = allEvaluations.filter(e => e.status === 'Locked' || e.status === 'Published').length;
    
    let totalScore = 0;
    allEvaluations.forEach(e => {
      totalScore += (e.totalScore || e.teamAverage || 0);
    });
    const averageScore = allEvaluations.length > 0 ? Math.round(totalScore / allEvaluations.length) : 0;

    const activeCycleObj = reviewCycles.find(c => c.status === 'Active') || (dataContext.getActiveReviewCycle ? dataContext.getActiveReviewCycle() : null);

    return {
      activeAssignedTeams: activeTeams.length,
      historicalTeams: historyTeams.length,
      pendingReviews,
      completedReviews,
      lockedEvaluations,
      averageMarksAwarded: averageScore,
      activeCycle: activeCycleObj?.name || activeCycleObj?.reviewName || 'Review 1'
    };
  }, [reviewer, getAssignedTeams, getReviewHistory, evaluations, reviewCycles, dataContext]);

  return {
    reviewer,
    dashboardStats,
    getAssignedTeams,
    getReviewHistory,
    getReviewerTimeline,
    dataLoading
  };
};
