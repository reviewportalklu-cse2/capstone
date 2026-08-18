import { useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

import { resolveStudentRelations, resolveTeamRelations, resolveEntityMatch, resolveFacultyRelationships } from '@/utils/relationshipResolver';

export const useFacultyAnalytics = () => {
  const { currentUser, domainUser } = useAuth();
  const dataContext = useData() || {};
  const {
    students = [],
    teams = [],
    projects = [],
    evaluations = [],
    pendingEvaluations = [],
    attendance = [],
    reviewCycles = [],
    reviewerAssignments = [],
    facultyAssignments = [],
    guides = [],
    faculty: facultyList = [],
    reviewers = [],
    dataLoading
  } = dataContext;

  // 1. Base Faculty Info
  const faculty = useMemo(() => {
    if (!domainUser && !currentUser) return null;
    return domainUser || currentUser;
  }, [domainUser, currentUser]);

  // 2. Assigned Teams
  const getAssignedTeams = useCallback(() => {
    if (!faculty) return [];
    
    // Multi-key lookup for current logged in faculty document
    let currentFaculty = null;
    const lookupKeys = [faculty.email, faculty.employeeId, faculty.facultyId, faculty.id, faculty.domainId, faculty.name].filter(Boolean);
    for (const k of lookupKeys) {
      const match = resolveEntityMatch(facultyList, k);
      if (match) {
        currentFaculty = match;
        break;
      }
    }
    if (!currentFaculty) {
      if (faculty.email || faculty.employeeId || faculty.facultyId || faculty.id) {
        currentFaculty = faculty;
      } else {
        console.warn('[FACULTY_ANALYTICS] Unresolved logged-in faculty:', faculty);
        return [];
      }
    }

    const { teams: resolvedTeams } = resolveFacultyRelationships(currentFaculty, dataContext);

    return resolvedTeams.map(team => {
      const rel = resolveTeamRelations(team, dataContext);
      const teamEvals = evaluations.filter(e => String(e.teamId || e.team).toLowerCase() === String(rel.teamId).toLowerCase());
      const completionPercent = Math.min(100, Math.round(((teamEvals.length + 1) / 5) * 100));

      return {
        ...rel,
        project: projects.find(p => p.id === rel.projectId || p.projectId === rel.projectId) || { title: rel.projectTitle },
        members: rel.members,
        progressPercent: completionPercent,
        attendancePercent: 95,
        completedReviews: teamEvals.length,
        hasPendingEvaluations: (pendingEvaluations || []).some(p => String(p.teamId).toLowerCase() === String(rel.teamId).toLowerCase() && p.status === 'Pending')
      };
    });
  }, [faculty, facultyList, dataContext, evaluations, pendingEvaluations, projects]);

  // 3. Pending Evaluations (Absentee Workflow)
  const getPendingFacultyEvaluations = useCallback(() => {
    if (!faculty) return [];
    const assignedTeams = getAssignedTeams();
    const activeCycle = reviewCycles.find(c => c.status === 'Active');
    
    const pendingList = [];
    assignedTeams.forEach(team => {
      // 1. Check for Absentee Pending evaluations
      const teamPendings = pendingEvaluations.filter(p => p.teamId === team.id && p.status === 'Pending');
      teamPendings.forEach(p => {
        const student = students.find(s => s.id === p.studentId);
        pendingList.push({
          type: 'Absentee',
          id: p.id,
          teamId: team.id,
          studentName: student?.name || 'Unknown',
          cycleName: p.reviewCycle,
          deadline: p.deadline,
          projectTitle: team.project?.title || 'Unknown'
        });
      });

      // 2. Check for Active Cycle Faculty evaluation
      if (activeCycle) {
        const hasEvaluated = evaluations.some(e => e.teamId === team.id && e.reviewCycleId === activeCycle.id && e.role === 'faculty');
        if (!hasEvaluated) {
          pendingList.push({
            type: 'ActiveCycle',
            teamId: team.id,
            studentName: 'Entire Team',
            cycleName: activeCycle.name,
            deadline: 'End of Cycle',
            projectTitle: team.project?.title || 'Unknown'
          });
        }
      }
    });

    return pendingList;
  }, [faculty, getAssignedTeams, reviewCycles, pendingEvaluations, students, evaluations]);

  // 4. Faculty Timeline
  const getFacultyTimeline = useCallback(() => {
    if (!faculty) return [];
    const assignedTeams = getAssignedTeams();
    const timeline = [];

    assignedTeams.forEach(team => {
      if (team.createdAt) {
        timeline.push({ type: 'assignment', title: `Assigned to Team ${team.id}`, date: team.createdAt, details: team.project?.title });
      }
      
      const teamEvals = evaluations.filter(e => e.teamId === team.id && e.role === 'faculty');
      teamEvals.forEach(e => {
        timeline.push({ type: 'evaluation', title: `Evaluated Team ${team.id}`, date: e.createdAt || e.date, details: `Cycle: ${e.reviewCycle}` });
      });
    });

    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [faculty, getAssignedTeams, evaluations]);

  // 5. Dashboard Stats
  const dashboardStats = useMemo(() => {
    const assignedTeams = getAssignedTeams();
    const totalStudents = assignedTeams.reduce((sum, t) => sum + (t.members?.length || 0), 0);
    const pendingList = getPendingFacultyEvaluations();
    
    const activeCyclePending = pendingList.filter(p => p.type === 'ActiveCycle').length;
    const absenteePending = pendingList.filter(p => p.type === 'Absentee').length;

    let totalScore = 0;
    let evalCount = 0;
    evaluations.filter(e => e.role === 'faculty').forEach(e => {
      totalScore += (e.totalScore || e.teamAverage || 0);
      evalCount++;
    });
    const avgScore = evalCount > 0 ? Math.round(totalScore / evalCount) : 0;
    
    // Overall Attendance
    let presentCount = 0;
    let totalAtt = 0;
    evaluations.forEach(e => {
       if (e.attendance) {
         Object.values(e.attendance).forEach(val => {
           totalAtt++;
           if (val === 'Present') presentCount++;
         });
       }
    });
    const overallAttendance = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

    const activeCycleObj = reviewCycles.find(c => c.status === 'Active') || (dataContext.getActiveReviewCycle ? dataContext.getActiveReviewCycle() : null);

    return {
      totalTeams: assignedTeams.length,
      totalStudents,
      pendingEvaluations: activeCyclePending,
      absenteeEvaluations: absenteePending,
      completedEvaluations: evalCount,
      averageTeamScore: avgScore,
      overallAttendance,
      activeCycle: activeCycleObj?.name || activeCycleObj?.reviewName || 'Review 1'
    };
  }, [faculty, getAssignedTeams, getPendingFacultyEvaluations, evaluations, reviewCycles, dataContext]);

  return {
    faculty,
    dashboardStats,
    getAssignedTeams,
    getPendingFacultyEvaluations,
    getFacultyTimeline,
    dataLoading
  };
};
