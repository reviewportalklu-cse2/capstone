import { useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOutcomeEngine } from '@/hooks/useOutcomeEngine';
import { resolveStudentRelations, resolveTeamRelations, resolveEntityMatch } from '@/utils/relationshipResolver';

export const useStudentAnalytics = () => {
  const { currentUser, domainUser } = useAuth();
  const dataContext = useData() || {};
  const {
    students = [],
    teams = [],
    projects = [],
    guides = [],
    faculty = [],
    evaluations = [],
    attendance = [],
    reviewCycles = [],
    dataLoading
  } = dataContext;
  
  const { calculateStudentResult } = useOutcomeEngine();

  // 1. Base Student Info (Domain User or strict lookup)
  const student = useMemo(() => {
    if (!currentUser || dataLoading) return null;
    if (domainUser) return domainUser;
    
    const lookupKey = currentUser.email || currentUser.uid;
    return resolveEntityMatch(students, lookupKey) || 
      students.find(s => String(s.id).toLowerCase() === String(currentUser.uid).toLowerCase() || String(s.email).toLowerCase() === String(currentUser.email).toLowerCase()) || null;
  }, [currentUser, domainUser, students, dataLoading]);

  // 2. Resolved Team via relationshipResolver
  const team = useMemo(() => {
    if (!student) return null;
    const rel = resolveStudentRelations(student, dataContext);
    const targetTeamId = rel.teamId || student.teamId;
    if (!targetTeamId) return null;

    const t = teams.find(x => String(x.id || x.teamId).toLowerCase() === String(targetTeamId).toLowerCase() || String(x.id || x.teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === String(targetTeamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
    return t || { id: targetTeamId, name: `Team ${targetTeamId}` };
  }, [student, teams, dataContext]);

  // 3. Team Members (Only students in the exact same team)
  const teamMembers = useMemo(() => {
    if (!team || !students.length) return [];
    const cleanTeamId = String(team.id || team.teamId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    return students.filter(s => {
      const sRel = resolveStudentRelations(s, dataContext);
      const memberTeamId = String(sRel.teamId || s.teamId || s['Team ID'] || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return memberTeamId && memberTeamId === cleanTeamId;
    });
  }, [team, students, dataContext]);

  // 4. Project
  const project = useMemo(() => {
    if (!team) return null;
    const rel = resolveTeamRelations(team, dataContext);
    const pId = rel.projectId || team.projectId;
    return projects.find(p => String(p.id || p.projectId).toLowerCase() === String(pId).toLowerCase()) || { title: rel.projectTitle || 'Capstone Project', description: 'Capstone Project Description' };
  }, [team, projects, dataContext]);

  // 5. Assigned Guide
  const guide = useMemo(() => {
    if (!team) return null;
    const rel = resolveTeamRelations(team, dataContext);
    if (rel.guideObj) return rel.guideObj;

    const gId = rel.guideId || team.guideId;
    if (!gId) return null;
    return guides.find(g => resolveEntityMatch([g], gId)) || { name: rel.guideName || 'Assigned Guide', id: gId, employeeId: gId };
  }, [team, guides, dataContext]);

  // 6. Assigned Faculty
  const classroomFaculty = useMemo(() => {
    if (!team) return null;
    const rel = resolveTeamRelations(team, dataContext);
    if (rel.facultyObj) return rel.facultyObj;

    const fId = rel.facultyId || team.facultyId;
    if (!fId) return null;
    return faculty.find(f => resolveEntityMatch([f], fId)) || { name: rel.facultyName || 'Classroom Faculty', id: fId, employeeId: fId };
  }, [team, faculty, dataContext]);

  // 7. Dynamic Review Schedule Resolution (Review 1, 2, 3, Classroom Presentation)
  const reviewSchedule = useMemo(() => {
    const standardCycles = [
      { name: 'Review 1', reviewName: 'Review 1' },
      { name: 'Review 2', reviewName: 'Review 2' },
      { name: 'Review 3', reviewName: 'Review 3' },
      { name: 'Classroom Presentation', reviewName: 'Classroom Presentation' }
    ];

    const teamEvals = team ? evaluations.filter(e => String(e.teamId || e.team).toLowerCase() === String(team.id).toLowerCase()) : [];
    const now = new Date();

    return standardCycles.map(std => {
      const matchCycle = reviewCycles.find(c => (c.reviewName || c.name || '').trim().toLowerCase() === std.reviewName.toLowerCase());
      const hasCompletedEval = teamEvals.some(e => (e.reviewCycle || '').trim().toLowerCase() === std.reviewName.toLowerCase() && (e.status === 'Locked' || e.status === 'Completed' || e.status === 'Published'));

      let status = 'Not Scheduled';
      let startDate = matchCycle?.startDate || '';
      let startTime = matchCycle?.startTime || '';
      let endDate = matchCycle?.endDate || '';
      let endTime = matchCycle?.endTime || '';

      if (hasCompletedEval) {
        status = 'Completed';
      } else if (matchCycle) {
        let startBoundary = null;
        let endBoundary = null;
        if (startDate) startBoundary = new Date(`${startDate}T${startTime || '00:00'}`);
        if (endDate) endBoundary = new Date(`${endDate}T${endTime || '23:59'}`);

        if (startBoundary && endBoundary && now >= startBoundary && now <= endBoundary) {
          status = 'In Progress';
        } else if (startBoundary && now < startBoundary) {
          status = 'Upcoming';
        } else if (endBoundary && now > endBoundary) {
          status = 'Completed';
        } else {
          status = 'Upcoming';
        }
      }

      return {
        id: matchCycle?.id || std.reviewName.toLowerCase().replace(/\s+/g, '-'),
        reviewName: std.reviewName,
        startDate: startDate || 'To be scheduled',
        startTime: startTime || '09:00 AM',
        endDate: endDate || 'To be scheduled',
        endTime: endTime || '05:00 PM',
        status
      };
    });
  }, [reviewCycles, evaluations, team]);

  // 8. Student Evaluations
  const getStudentEvaluations = useCallback(() => {
    if (!team) return [];
    return evaluations.filter(e => String(e.teamId || e.team).toLowerCase() === String(team.id).toLowerCase())
      .map(ev => {
        const cycle = reviewCycles.find(c => c.id === ev.reviewCycleId || c.reviewName === ev.reviewCycle);
        return {
          ...ev,
          cycleName: cycle?.reviewName || cycle?.name || ev.reviewCycle || 'Review Evaluation',
          date: ev.submittedAt || ev.updatedAt || ev.createdAt,
          status: ev.status || 'Completed'
        };
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [team, evaluations, reviewCycles]);

  const getStudentAttendance = useCallback(() => {
    if (!student) return [];
    return attendance.filter(a => a.studentId === student.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [student, attendance]);

  const dashboardStats = useMemo(() => {
    if (!student || !team) return null;
    const evals = getStudentEvaluations();
    const activeCycleObj = reviewCycles.find(c => c.status === 'Active') || (dataContext.getActiveReviewCycle ? dataContext.getActiveReviewCycle() : null);
    
    return {
      progressPercent: Math.min(100, Math.round((evals.length / 4) * 100)),
      averageMarks: evals.length > 0 ? Math.round(evals.reduce((sum, e) => sum + (e.teamAverage || e.totalScore || 0), 0) / evals.length) : 0,
      attendancePercent: 100,
      currentGrade: 'A',
      completedReviews: evals.length,
      currentReviewCycle: activeCycleObj?.reviewName || activeCycleObj?.name || 'Review 1'
    };
  }, [student, team, getStudentEvaluations, reviewCycles, dataContext]);

  return {
    student,
    team,
    teamMembers,
    project,
    guide,
    classroomFaculty,
    reviewSchedule,
    dashboardStats,
    getStudentEvaluations,
    getStudentAttendance,
    dataLoading
  };
};
