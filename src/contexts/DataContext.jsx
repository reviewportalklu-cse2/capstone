import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { FirestoreService } from '@/firebase/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';

const DataContext = createContext();

export const useData = () => {
  return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
  const { currentUser, userRole, activeRole, domainUser, loading: authLoading } = useAuth();
  const currentRole = activeRole || userRole;
  
  const [data, setData] = useState({
    students: [],
    guides: [],
    faculty: [],
    reviewers: [],
    teams: [],
    projects: [],
    notifications: [],
    reviews: [],
    marks: [],
    guideMarks: [],
    submissions: [],
    reports: [],
    attendance: [],
    meetings: [],
    remarks: [],
    auditLogs: [],
    evaluationHistory: [],
    rooms: [],
    schedules: [],
    milestones: [],
    rubrics: [],
    rubricCriteria: [],
    evaluations: [],
    pendingEvaluations: [],
    evaluationRemarks: [],
    reviewCycles: [],
    reviewerAssignments: [],
    settings: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to Firestore collections as soon as user is authenticated
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const collectionsToSubscribe = [
      { key: 'students', path: 'students' },
      { key: 'guides', path: 'guides' },
      { key: 'faculty', path: 'classroomFaculty' },
      { key: 'reviewers', path: 'reviewers' },
      { key: 'teams', path: 'teams' },
      { key: 'projects', path: 'projects' },
      { key: 'notifications', path: 'notifications' },
      { key: 'reviews', path: 'reviews' },
      { key: 'marks', path: 'facultyMarks' },
      { key: 'guideMarks', path: 'guideMarks' },
      { key: 'submissions', path: 'submissions' },
      { key: 'reports', path: 'reports' },
      { key: 'attendance', path: 'attendance' },
      { key: 'meetings', path: 'meetings' },
      { key: 'remarks', path: 'remarks' },
      { key: 'auditLogs', path: 'auditLogs' },
      { key: 'evaluationHistory', path: 'evaluationHistory' },
      { key: 'rooms', path: 'rooms' },
      { key: 'schedules', path: 'schedules' },
      { key: 'milestones', path: 'milestones' },
      { key: 'rubrics', path: 'rubrics' },
      { key: 'rubricCriteria', path: 'rubricCriteria' },
      { key: 'evaluations', path: 'evaluations' },
      { key: 'pendingEvaluations', path: 'pendingEvaluations' },
      { key: 'evaluationRemarks', path: 'evaluationRemarks' },
      { key: 'reviewCycles', path: 'reviewCycles' },
      { key: 'reviewerAssignments', path: 'reviewerAssignments' },
      { key: 'guideAssignments', path: 'guideAssignments' },
      { key: 'facultyAssignments', path: 'facultyAssignments' },
      { key: 'teamAssignments', path: 'teamAssignments' },
      { key: 'projectAssignments', path: 'projectAssignments' },
      { key: 'settings', path: 'settings' }
    ];

    const loadedKeys = new Set();
    let hasError = false;
    const unsubs = [];
    const expectedCount = collectionsToSubscribe.length;

    const handleData = (key, incomingData) => {
      setData(prev => ({ ...prev, [key]: incomingData }));
      loadedKeys.add(key);
      if (loadedKeys.size >= expectedCount && !hasError) {
        setLoading(false);
      }
    };

    const handleError = (key, err) => {
      console.error(`Error in DataContext subscribing to ${key}:`, err);
      hasError = true;
      setError(`Failed to sync ${key}. Check network connection.`);
      setLoading(false);
    };

    collectionsToSubscribe.forEach(({ key, path }) => {
      try {
        const unsub = FirestoreService.subscribeAll(path, 
          (incomingData) => handleData(key, incomingData),
          (err) => handleError(key, err)
        );
        unsubs.push(unsub);
      } catch (err) {
        handleError(key, err);
      }
    });

    return () => {
      unsubs.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      // reset state on unmount or role switch
      setData({
        students: [], guides: [], faculty: [], reviewers: [],
        teams: [], projects: [], notifications: [], reviews: [],
        marks: [], guideMarks: [], submissions: [], reports: [], attendance: [],
        rooms: [], schedules: [], milestones: [],
        rubrics: [], rubricCriteria: [], evaluations: [], pendingEvaluations: [], evaluationRemarks: [],
        reviewCycles: [], reviewerAssignments: [], settings: []
      });
    };
  }, [currentUser?.uid, currentRole, authLoading]);

  // Derived Helpers
  const getTeamById = (id) => data.teams.find(t => t.id === id || t.teamId === id) || null;
  const getProjectById = (id) => data.projects.find(p => p.id === id || p.projectId === id) || null;
  const getGuideById = (id) => data.guides.find(g => g.id === id) || null;
  const getFacultyById = (id) => data.faculty.find(f => f.id === id) || null;
  const getReviewerById = (id) => data.reviewers.find(r => r.id === id) || null;
  const getStudentById = (id) => data.students.find(s => s.id === id || s.studentId === id || s.rollNo === id) || null;

  const getStudentsByGuide = (guideId) => data.students.filter(s => s.guideId === guideId);
  const getStudentsByFaculty = (facultyId) => data.students.filter(s => s.facultyId === facultyId);
  const getStudentsByReviewer = (reviewerId) => data.students.filter(s => s.reviewerId === reviewerId);
  const getStudentsByTeam = (teamId) => data.students.filter(s => s.teamId === teamId);

  const getTeamsByGuide = (guideId) => data.teams.filter(t => t.guideId === guideId);
  const getTeamsByFaculty = (facultyId) => data.teams.filter(t => t.facultyId === facultyId);
  const getTeamsByReviewer = (reviewerId) => data.teams.filter(t => t.reviewerId === reviewerId);

  const getNotificationsByRole = () => {
    if (!domainUser) return [];
    return data.notifications.filter(n => {
      if (n.archived) return false;
      if (n.recipientType === 'global') return true;
      if (n.recipientType === 'role' && n.roleIds?.includes(currentRole)) return true;
      if (n.recipientType === 'individual' && n.recipientIds?.includes(domainUser.domainId)) return true;
      if (n.recipientType === 'team') {
        const userTeams = data.teams.filter(t => 
          t.guideId === domainUser.domainId || 
          t.facultyId === domainUser.domainId ||
          data.reviewerAssignments.some(a => a.teamId === t.id && a.reviewerId === domainUser.domainId) ||
          data.students.some(s => s.teamId === t.id && (s.id === domainUser.domainId || s.uid === currentUser.uid))
        ).map(t => t.id);
        return n.teamIds?.some(id => userTeams.includes(id));
      }
      // Legacy fallback
      if (n.targetRole === 'all' || n.targetRole === currentRole || n.targetRole === domainUser.domainId || n.recipientId === domainUser.domainId) return true;
      return false;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };
  
  const getNotificationsByTeam = (teamId) => data.notifications.filter(n => (n.recipientType === 'team' && n.teamIds?.includes(teamId)) || n.targetTeam === teamId || n.teamId === teamId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getMarksByStudent = (studentId) => {
    return {
      facultyMarks: data.marks.filter(m => m.studentId === studentId),
      guideMarks: data.guideMarks.filter(m => m.studentId === studentId)
    };
  };

  const getReviewsByTeam = (teamId) => data.reviews.filter(r => r.teamId === teamId);
  
  const getRubricById = (id) => data.rubrics.find(r => r.id === id || r.rubricId === id) || null;
  const getCriteriaByRubric = (rubricId) => data.rubricCriteria.filter(c => c.rubricId === rubricId).sort((a, b) => a.displayOrder - b.displayOrder);
  const getEvaluationsByTeam = (teamId) => data.evaluations.filter(e => e.teamId === teamId);

  // Reviewer Rotation Helpers
  const getActiveReviewCycle = useCallback(() => {
    const explicitActive = data.reviewCycles.find(c => c.status === 'Active' || c.status === 'Published' || c.status === 'Open' || c.status === 'In Progress');
    if (explicitActive) return explicitActive;
    if (data.reviewCycles.length > 0) return data.reviewCycles[0];

    const publishedRubric = data.rubrics.find(r => r.status === 'Published' || r.status === 'Active');
    const cycleName = publishedRubric?.reviewCycle || 'Review 1';
    return {
      id: cycleName,
      name: cycleName,
      reviewName: cycleName,
      status: 'Active'
    };
  }, [data.reviewCycles, data.rubrics]);
  
  const getReviewCycleById = useCallback((id) => {
    return data.reviewCycles.find(c => c.id === id) || null;
  }, [data.reviewCycles]);

  const getCurrentReviewer = useCallback((teamId) => {
    const activeCycle = getActiveReviewCycle();
    if (!activeCycle) return null;
    const assignment = data.reviewerAssignments.find(a => a.teamId === teamId && a.reviewCycleId === activeCycle.id && a.status === 'Active');
    if (assignment) return getReviewerById(assignment.reviewerId);
    return null;
  }, [data.reviewerAssignments, getActiveReviewCycle]);

  const getReviewerHistory = useCallback((teamId) => {
    return data.reviewerAssignments.filter(a => a.teamId === teamId).sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate));
  }, [data.reviewerAssignments]);

  const getAssignmentsByReviewCycle = useCallback((reviewCycleId) => {
    return data.reviewerAssignments.filter(a => a.reviewCycleId === reviewCycleId);
  }, [data.reviewerAssignments]);

  const getAssignmentsByReviewer = useCallback((reviewerId) => {
    return data.reviewerAssignments.filter(a => a.reviewerId === reviewerId);
  }, [data.reviewerAssignments]);

  const activeReviewCycle = useMemo(() => getActiveReviewCycle(), [getActiveReviewCycle]);

  const activeReviewerAssignments = useMemo(() => {
    if (!activeReviewCycle) return data.reviewerAssignments;
    return data.reviewerAssignments.filter(a => a.reviewCycleId === activeReviewCycle.id || a.reviewCycleId === activeReviewCycle.reviewCycleId);
  }, [data.reviewerAssignments, activeReviewCycle]);

  const semesterData = useMemo(() => ({
    students: data.students,
    teams: data.teams,
    projects: data.projects,
    guides: data.guides,
    faculty: data.faculty
  }), [data.students, data.teams, data.projects, data.guides, data.faculty]);

  const reviewCycleData = useMemo(() => ({
    reviewCycles: data.reviewCycles,
    reviewerAssignments: activeReviewerAssignments,
    evaluations: data.evaluations,
    marks: data.marks,
    attendance: data.attendance
  }), [data.reviewCycles, activeReviewerAssignments, data.evaluations, data.marks, data.attendance]);

  const value = {
    ...data,
    dataLoading: loading,
    dataError: error,
    activeRole: currentRole,
    semesterData,
    reviewCycleData,
    activeReviewCycle,
    activeReviewerAssignments,
    getTeamById,
    getProjectById,
    getGuideById,
    getFacultyById,
    getReviewerById,
    getStudentById,
    getStudentsByGuide,
    getStudentsByFaculty,
    getStudentsByReviewer,
    getStudentsByTeam,
    getTeamsByGuide,
    getTeamsByFaculty,
    getTeamsByReviewer,
    getNotificationsByRole,
    getNotificationsByTeam,
    getMarksByStudent,
    getReviewsByTeam,
    getRubricById,
    getCriteriaByRubric,
    getEvaluationsByTeam,
    getActiveReviewCycle,
    getReviewCycleById,
    getCurrentReviewer,
    getReviewerHistory,
    getAssignmentsByReviewCycle,
    getAssignmentsByReviewer
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
