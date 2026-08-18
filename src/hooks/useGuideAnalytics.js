import { useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOutcomeEngine } from '@/hooks/useOutcomeEngine';

import { resolveStudentRelations, resolveTeamRelations, resolveEntityMatch, resolveGuideRelationships } from '@/utils/relationshipResolver';

export const useGuideAnalytics = () => {
  const { currentUser, domainUser } = useAuth();
  const dataContext = useData() || {};
  const {
    students = [],
    teams = [],
    projects = [],
    evaluations = [],
    guideMarks = [],
    attendance = [],
    meetings = [],
    reviewCycles = [],
    reviewerAssignments = [],
    guideAssignments = [],
    guides = [],
    faculty = [],
    reviewers = [],
    dataLoading
  } = dataContext;

  const { calculateTeamResult } = useOutcomeEngine();

  // 1. Base Guide Info
  const guide = useMemo(() => {
    if (!domainUser && !currentUser) return null;
    return domainUser || currentUser;
  }, [domainUser, currentUser]);

  // 2. Supervised Teams
  const getSupervisedTeams = useCallback(() => {
    if (!guide) return [];
    
    // Multi-key lookup for current logged in guide document
    let currentGuide = null;
    const lookupKeys = [guide.email, guide.employeeId, guide.guideId, guide.id, guide.domainId, guide.name].filter(Boolean);
    for (const k of lookupKeys) {
      const match = resolveEntityMatch(guides, k);
      if (match) {
        currentGuide = match;
        break;
      }
    }
    if (!currentGuide) {
      if (guide.email || guide.employeeId || guide.guideId || guide.id) {
        currentGuide = guide;
      } else {
        console.warn('[GUIDE_ANALYTICS] Unresolved logged-in guide:', guide);
        return [];
      }
    }

    const { teams: resolvedTeams } = resolveGuideRelationships(currentGuide, dataContext);

    return resolvedTeams.map(team => {
      const rel = resolveTeamRelations(team, dataContext);
      const teamEvals = evaluations.filter(e => String(e.teamId || e.team).toLowerCase() === String(rel.teamId).toLowerCase());
      const completionPercent = Math.min(100, Math.round(((teamEvals.length + 1) / 5) * 100));

      return {
        ...rel,
        project: projects.find(p => p.id === rel.projectId || p.projectId === rel.projectId) || { title: rel.projectTitle },
        members: rel.members,
        progressPercent: completionPercent,
        completedReviews: teamEvals.length
      };
    });
  }, [guide, guides, dataContext, evaluations, projects]);

  // 3. Pending Evaluations
  const getPendingEvaluations = useCallback(() => {
    if (!guide) return [];
    const supervisedTeams = getSupervisedTeams();
    const activeCycle = reviewCycles.find(c => c.status === 'Active') || (dataContext.getActiveReviewCycle ? dataContext.getActiveReviewCycle() : null);
    
    if (!activeCycle) return [];

    const pending = [];
    supervisedTeams.forEach(team => {
      // Guide evaluates their team
      // For this system, let's assume Guide evaluations are tracked in `evaluations` or `guideMarks`
      // We look for an evaluation in the active cycle authored by this guide
      const hasEvaluated = evaluations.some(e => e.teamId === team.id && e.reviewCycleId === activeCycle.id && e.evaluatorId === guide.id);
      
      if (!hasEvaluated) {
        pending.push({
          teamId: team.id,
          cycleName: activeCycle.name,
          cycleId: activeCycle.id,
          projectTitle: team.project?.title || 'Unknown Project'
        });
      }
    });

    return pending;
  }, [guide, getSupervisedTeams, reviewCycles, evaluations]);

  // 4. Meeting Analytics
  const getGuideMeetings = useCallback(() => {
    if (!guide) return [];
    return meetings.filter(m => m.guideId === guide.id || m.guideId === guide.domainId)
                   .sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate));
  }, [guide, meetings]);

  // 5. Guide Timeline
  const getGuideTimeline = useCallback(() => {
    if (!guide) return [];
    const supervisedTeams = getSupervisedTeams();
    const timeline = [];

    supervisedTeams.forEach(team => {
      if (team.createdAt) {
        timeline.push({ type: 'team', title: `Team Assigned: ${team.id}`, date: team.createdAt, details: team.project?.title });
      }
      
      const teamMeetings = meetings.filter(m => m.teamId === team.id);
      teamMeetings.forEach(m => {
        timeline.push({ type: 'meeting', title: `Meeting with ${team.id}`, date: m.meetingDate, details: m.agenda });
      });

      const teamEvals = evaluations.filter(e => e.teamId === team.id && e.evaluatorId === guide.id);
      teamEvals.forEach(e => {
        timeline.push({ type: 'evaluation', title: `Evaluated ${team.id}`, date: e.createdAt || e.date, details: `Score: ${e.totalScore}` });
      });
    });

    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [guide, getSupervisedTeams, meetings, evaluations]);

  // 6. Overall Aggregation
  const dashboardStats = useMemo(() => {
    if (!guide) return null;
    const supervisedTeams = getSupervisedTeams();
    const totalStudents = supervisedTeams.reduce((sum, t) => sum + (t.members?.length || 0), 0);
    const activeProjects = supervisedTeams.filter(t => t.project?.status !== 'Completed').length;
    const pendingEvals = getPendingEvaluations();
    
    // Meetings this week
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const meetingsThisWeek = meetings.filter(m => m.guideId === guide.id && new Date(m.meetingDate) >= oneWeekAgo).length;

    // Average Score
    let totalScore = 0;
    let evalCount = 0;
    evaluations.filter(e => e.evaluatorId === guide.id).forEach(e => {
      totalScore += (e.totalScore || 0);
      evalCount++;
    });
    const avgScore = evalCount > 0 ? Math.round(totalScore / evalCount) : 0;

    const activeCycleObj = reviewCycles.find(c => c.status === 'Active') || (dataContext.getActiveReviewCycle ? dataContext.getActiveReviewCycle() : null);

    return {
      totalTeams: supervisedTeams.length,
      totalStudents,
      activeProjects,
      pendingEvaluations: pendingEvals.length,
      meetingsThisWeek,
      averageTeamScore: avgScore,
      activeCycle: activeCycleObj?.name || activeCycleObj?.reviewName || 'Review 1'
    };
  }, [guide, getSupervisedTeams, getPendingEvaluations, meetings, evaluations, reviewCycles, dataContext]);

  return {
    guide,
    dashboardStats,
    getSupervisedTeams,
    getPendingEvaluations,
    getGuideMeetings,
    getGuideTimeline,
    dataLoading
  };
};
