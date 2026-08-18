import { useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOutcomeEngine } from '@/hooks/useOutcomeEngine';

export const useStudentAnalytics = () => {
  const { currentUser } = useAuth();
  const {
    students = [],
    teams = [],
    projects = [],
    guides = [],
    faculty = [],
    reviewers = [],
    evaluations = [],
    guideMarks = [],
    marks = [], // faculty Marks
    attendance = [],
    reviewerAssignments = [],
    reviewCycles = [],
    rubrics = [],
    rubricCriteria = [],
    auditLogs = [],
    settings = [],
    dataLoading
  } = useData() || {};
  
  const { calculateStudentResult } = useOutcomeEngine();

  // 1. Base Student Info
  const student = useMemo(() => {
    if (!currentUser || dataLoading) return null;
    return students.find(s => s.id === currentUser.uid || s.email === currentUser.email);
  }, [currentUser, students, dataLoading]);

  const team = useMemo(() => {
    if (!student) return null;
    return teams.find(t => t.id === student.teamId);
  }, [student, teams]);

  const project = useMemo(() => {
    if (!team) return null;
    return projects.find(p => p.id === team.projectId);
  }, [team, projects]);

  const guide = useMemo(() => {
    if (!team) return null;
    return guides.find(g => g.id === team.guideId);
  }, [team, guides]);

  const classroomFaculty = useMemo(() => {
    if (!team) return null;
    return faculty.find(f => f.id === team.facultyId);
  }, [team, faculty]);

  const currentReviewer = useMemo(() => {
    if (!team) return null;
    return reviewers.find(r => r.id === team.currentReviewerId);
  }, [team, reviewers]);

  // 2. Extracted Methods
  const getStudentEvaluations = useCallback(() => {
    if (!team) return [];
    // Combine Guide, Faculty, and Reviewer Evaluations for the student's team
    const teamEvaluations = evaluations.filter(e => e.teamId === team.id).map(e => ({...e, type: 'Reviewer'}));
    
    // Enrich with Review Cycle Name
    return teamEvaluations.map(ev => {
      const cycle = reviewCycles.find(c => c.id === ev.reviewCycleId);
      return {
        ...ev,
        cycleName: cycle?.name || 'Unknown Cycle',
        date: ev.createdAt,
        status: ev.status || 'Completed'
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [team, evaluations, reviewCycles]);

  const getStudentAttendance = useCallback(() => {
    if (!student) return [];
    return attendance.filter(a => a.studentId === student.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [student, attendance]);

  const getStudentReviewerHistory = useCallback(() => {
    if (!team) return [];
    return reviewerAssignments
      .filter(ra => ra.teamId === team.id)
      .map(ra => {
        const cycle = reviewCycles.find(c => c.id === ra.reviewCycleId);
        const reviewer = reviewers.find(r => r.id === ra.reviewerId);
        return {
          ...ra,
          cycleName: cycle?.name || 'Unknown Cycle',
          reviewerName: reviewer?.name || 'Unknown Reviewer'
        };
      })
      .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate));
  }, [team, reviewerAssignments, reviewCycles, reviewers]);

  const getStudentProgress = useCallback(() => {
    // Determine milestone progress based on actual evaluation data and cycle progression
    if (!team) return { percent: 0, completed: 0, total: 5 };
    
    // Simplified logic: Assume 5 major milestones: Proposal, Review 1, Review 2, Final Review, Project Completion
    const completedEvaluations = getStudentEvaluations().length;
    let completed = 1; // Assuming team formed is 1
    completed += completedEvaluations;
    const total = 5;
    
    const percent = Math.min(100, Math.round((completed / total) * 100));
    
    return { percent, completed, total };
  }, [team, getStudentEvaluations]);

  const getStudentTimeline = useCallback(() => {
    if (!team || !student) return [];
    
    const timeline = [];
    
    // Team Created
    if (team.createdAt) {
      timeline.push({ type: 'team', title: 'Team Created', date: team.createdAt, details: 'You joined team ' + team.id });
    }
    
    // Project Assigned
    if (project && project.createdAt) {
      timeline.push({ type: 'project', title: 'Project Assigned', date: project.createdAt, details: project.title });
    }
    
    // Evaluations
    getStudentEvaluations().forEach(ev => {
      timeline.push({ type: 'evaluation', title: `Evaluation Completed: ${ev.cycleName}`, date: ev.date, details: `Score: ${ev.totalScore}` });
    });
    
    // Reviewer Assignments
    getStudentReviewerHistory().forEach(ra => {
      timeline.push({ type: 'reviewer', title: `Reviewer Assigned: ${ra.reviewerName}`, date: ra.assignedDate, details: `Cycle: ${ra.cycleName}` });
    });
    
    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [team, student, project, getStudentEvaluations, getStudentReviewerHistory]);

  const getStudentResult = useCallback(() => {
    if (!student) return null;
    return calculateStudentResult(student);
  }, [student, calculateStudentResult]);

  const getStudentNotifications = useCallback(() => {
    // Generate derived notifications based on audit logs, upcoming deadlines, pending evaluations, etc.
    if (!student || !team) return [];
    // Just a mocked static array or filtered from a generic 'notifications' collection if one existed
    return [];
  }, [student, team]);

  // Overall Aggregation
  const dashboardStats = useMemo(() => {
    if (!student || !team) return null;
    const result = getStudentResult();
    const progress = getStudentProgress();
    const evals = getStudentEvaluations();
    const att = getStudentAttendance();
    const presentCount = att.filter(a => a.status === 'Present').length;
    const attendancePercent = att.length > 0 ? Math.round((presentCount / att.length) * 100) : 100;
    
    return {
      progressPercent: progress.percent,
      averageMarks: result?.finalScore || 0,
      attendancePercent,
      currentGrade: result?.grade || 'N/A',
      completedReviews: evals.length,
      pendingReviews: 0, // compute from active cycles missing in evals
      currentReviewCycle: reviewCycles.find(c => c.status === 'Active')?.name || 'None'
    };
  }, [student, team, getStudentResult, getStudentProgress, getStudentEvaluations, getStudentAttendance, reviewCycles]);

  return {
    student,
    team,
    project,
    guide,
    classroomFaculty,
    currentReviewer,
    dashboardStats,
    getStudentEvaluations,
    getStudentAttendance,
    getStudentTimeline,
    getStudentNotifications,
    getStudentReviewerHistory,
    getStudentProgress,
    getStudentResult,
    dataLoading
  };
};
