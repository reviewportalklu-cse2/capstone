import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { resolveStudentRelations, resolveTeamRelations } from '@/utils/relationshipResolver';

export const useAnalytics = () => {
  const dataContext = useData();
  const {
    students = [],
    teams = [],
    projects = [],
    guides = [],
    faculty = [],
    reviewers = [],
    reviewCycles = [],
    evaluations = [],
    reviewerAssignments = [],
    attendance = [],
    dataLoading
  } = dataContext || {};

  const activeCycle = useMemo(() => reviewCycles.find(c => c.status === 'Active') || null, [reviewCycles]);

  const executiveAnalytics = useMemo(() => {
    if (dataLoading) return null;

    const totalStudents = students.length;
    const totalTeams = teams.length;
    const activeProjects = projects.length;
    const activeGuides = guides.length;
    const activeFaculty = faculty.length;
    const activeReviewers = reviewers.length;

    const completedReviews = evaluations.length;
    const pendingReviews = (teams.length * reviewCycles.length) - completedReviews; // Simplified heuristic
    const pendingEvaluations = dataContext.pendingEvaluations?.length || 0;

    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    
    // Calculate averages based on evaluations
    const teamScores = {};
    evaluations.forEach(ev => {
      if (!teamScores[ev.teamId]) teamScores[ev.teamId] = { total: 0, count: 0 };
      teamScores[ev.teamId].total += (ev.totalScore || 0);
      teamScores[ev.teamId].count += 1;
    });

    const evaluatedTeamIds = Object.keys(teamScores);
    evaluatedTeamIds.forEach(tId => {
      const avg = teamScores[tId].total / teamScores[tId].count;
      totalScore += avg;
      if (avg > highestScore) highestScore = avg;
      if (avg < lowestScore) lowestScore = avg;
    });

    const overallAverage = evaluatedTeamIds.length > 0 ? (totalScore / evaluatedTeamIds.length).toFixed(1) : 0;
    if (lowestScore === 100) lowestScore = 0;

    // Attendance
    let presentCount = 0;
    attendance.forEach(a => { if (a.status === 'Present') presentCount++; });
    const attendancePercentage = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

    return {
      totalStudents,
      totalTeams,
      activeProjects,
      activeGuides,
      activeFaculty,
      activeReviewers,
      activeCycle: activeCycle?.reviewName || 'None',
      completedReviews,
      pendingReviews: pendingReviews > 0 ? pendingReviews : 0,
      pendingEvaluations,
      attendancePercentage,
      overallAverage,
      highestScore: highestScore.toFixed(1),
      lowestScore: lowestScore.toFixed(1),
      teamsReadyForFinal: Math.floor(totalTeams * 0.8) // Mock logic for now
    };
  }, [students, teams, projects, guides, faculty, reviewers, evaluations, dataContext.pendingEvaluations, attendance, activeCycle, reviewCycles, dataLoading]);

  const teamAnalytics = useMemo(() => {
    if (dataLoading) return [];
    
    return teams.map(team => {
      const rel = resolveTeamRelations(team, { students, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments });
      const teamStudents = rel.members || [];
      const teamEvaluations = evaluations.filter(e => e.teamId === team.id || e.teamId === team.teamId);
      
      let sum = 0;
      let highest = 0;
      let lowest = 100;
      teamEvaluations.forEach(ev => {
        const score = ev.totalScore || 0;
        sum += score;
        if (score > highest) highest = score;
        if (score < lowest) lowest = score;
      });
      if (lowest === 100) lowest = 0;
      
      const averageMarks = teamEvaluations.length > 0 ? Math.round(sum / teamEvaluations.length) : 0;
      const teamAttendance = attendance.filter(a => teamStudents.some(s => s.id === a.studentId || s.id === a.id));
      const present = teamAttendance.filter(a => a.status === 'Present').length;
      const attendancePercentage = teamAttendance.length > 0 ? Math.round((present / teamAttendance.length) * 100) : 0;

      return {
        ...rel,
        projectName: rel.projectTitle || 'No Project',
        guideName: rel.guideName,
        facultyName: rel.facultyName,
        currentReviewerName: rel.reviewerName,
        reviewerName: rel.reviewerName,
        currentReviewCycle: activeCycle?.reviewName || activeCycle?.name || 'Active Cycle',
        attendance: attendancePercentage,
        progress: rel.progress || (teamEvaluations.length > 0 ? 50 : 10),
        averageMarks,
        highestMarks: highest,
        lowestMarks: lowest,
        evaluationsCompleted: teamEvaluations.length,
        pendingReviews: activeCycle ? (teamEvaluations.some(e => e.reviewCycleId === activeCycle.id) ? 0 : 1) : 0
      };
    }).sort((a, b) => b.averageMarks - a.averageMarks).map((t, idx) => ({ ...t, rank: idx + 1 }));
  }, [teams, students, projects, guides, faculty, reviewers, evaluations, attendance, activeCycle, reviewerAssignments, dataLoading]);

  const studentAnalytics = useMemo(() => {
    if (dataLoading) return [];
    return students.map(student => {
      const rel = resolveStudentRelations(student, { teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments });
      const studentAttendance = attendance.filter(a => a.studentId === student.id || a.studentId === student.rollNumber);
      const present = studentAttendance.filter(a => a.status === 'Present').length;
      const team = teamAnalytics.find(t => t.teamId === rel.teamId || t.id === rel.teamId) || {};
      
      return {
        ...rel,
        teamName: rel.teamName || 'No Team',
        projectName: rel.projectTitle || 'No Project',
        guideName: rel.guideName,
        facultyName: rel.facultyName,
        reviewerName: rel.reviewerName,
        attendancePercentage: studentAttendance.length > 0 ? Math.round((present / studentAttendance.length) * 100) : 0,
        averageMarks: team.averageMarks || 0,
        currentProgress: team.progress || 0
      };
    });
  }, [students, teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments, teamAnalytics, attendance, dataLoading]);

  const guideAnalytics = useMemo(() => {
    if (dataLoading) return [];
    return guides.map(guide => {
      const assignedTeams = teamAnalytics.filter(t => t.guideId === guide.id);
      let totalAvg = 0;
      let totalProgress = 0;
      let totalAtt = 0;
      
      assignedTeams.forEach(t => {
        totalAvg += t.averageMarks;
        totalProgress += t.progress;
        totalAtt += t.attendance;
      });
      
      const count = assignedTeams.length || 1;
      
      return {
        ...guide,
        assignedTeamsCount: assignedTeams.length,
        assignedStudentsCount: students.filter(s => s.guideId === guide.id).length,
        averageTeamScore: Math.round(totalAvg / count),
        averageTeamProgress: Math.round(totalProgress / count),
        averageAttendance: Math.round(totalAtt / count),
        completedReviews: evaluations.filter(e => assignedTeams.some(t => t.id === e.teamId)).length,
      };
    });
  }, [guides, teamAnalytics, students, evaluations, dataLoading]);

  const facultyAnalytics = useMemo(() => {
    if (dataLoading) return [];
    return faculty.map(fac => {
      const assignedTeams = teamAnalytics.filter(t => t.facultyId === fac.id);
      let totalAvg = 0;
      assignedTeams.forEach(t => totalAvg += t.averageMarks);
      const count = assignedTeams.length || 1;
      
      return {
        ...fac,
        assignedTeamsCount: assignedTeams.length,
        assignedStudentsCount: students.filter(s => s.facultyId === fac.id).length,
        averageMarksAwarded: Math.round(totalAvg / count),
        completedReviews: evaluations.filter(e => assignedTeams.some(t => t.id === e.teamId)).length,
      };
    });
  }, [faculty, teamAnalytics, students, evaluations, dataLoading]);

  const reviewerAnalytics = useMemo(() => {
    if (dataLoading) return [];
    return reviewers.map(reviewer => {
      const assignments = reviewerAssignments.filter(a => a.reviewerId === reviewer.id);
      const uniqueTeamsReviewed = new Set(assignments.map(a => a.teamId)).size;
      const completed = evaluations.filter(e => e.reviewerId === reviewer.id);
      let totalAvg = 0;
      completed.forEach(e => totalAvg += (e.totalScore || 0));
      
      return {
        ...reviewer,
        reviewCyclesParticipated: new Set(assignments.map(a => a.reviewCycleId)).size,
        teamsReviewed: uniqueTeamsReviewed,
        completedReviews: completed.length,
        pendingReviews: assignments.filter(a => a.status === 'Active').length - completed.filter(e => e.reviewCycleId === activeCycle?.id).length,
        averageMarksAwarded: completed.length > 0 ? Math.round(totalAvg / completed.length) : 0,
      };
    });
  }, [reviewers, reviewerAssignments, evaluations, activeCycle, dataLoading]);

  const departmentAnalytics = useMemo(() => {
    if (dataLoading) return [];
    const deptMap = {};
    
    students.forEach(s => {
      const dept = s.department || 'CSE';
      if (!deptMap[dept]) deptMap[dept] = { students: 0, teams: 0, guides: 0, faculty: 0, reviewers: 0, totalMarks: 0, marksCount: 0 };
      deptMap[dept].students++;
    });
    
    teams.forEach(t => {
      const dept = 'CSE'; // Simplified for now
      if (!deptMap[dept]) deptMap[dept] = { students: 0, teams: 0, guides: 0, faculty: 0, reviewers: 0, totalMarks: 0, marksCount: 0 };
      deptMap[dept].teams++;
    });
    
    guides.forEach(g => deptMap[g.department || 'CSE'] ? deptMap[g.department || 'CSE'].guides++ : null);
    faculty.forEach(f => deptMap[f.department || 'CSE'] ? deptMap[f.department || 'CSE'].faculty++ : null);
    reviewers.forEach(r => deptMap[r.department || 'CSE'] ? deptMap[r.department || 'CSE'].reviewers++ : null);
    
    teamAnalytics.forEach(t => {
      const dept = 'CSE';
      deptMap[dept].totalMarks += t.averageMarks;
      deptMap[dept].marksCount++;
    });

    return Object.keys(deptMap).map(dept => ({
      department: dept,
      ...deptMap[dept],
      averageMarks: deptMap[dept].marksCount > 0 ? Math.round(deptMap[dept].totalMarks / deptMap[dept].marksCount) : 0,
      topTeams: teamAnalytics.slice(0, 3)
    }));
  }, [students, teams, guides, faculty, reviewers, teamAnalytics, dataLoading]);

  const evaluationAnalytics = useMemo(() => {
    if (dataLoading) return [];
    const cycleMap = {};
    reviewCycles.forEach(c => {
      cycleMap[c.id] = { cycleName: c.reviewName, totalEvaluations: 0, averageScore: 0, sum: 0 };
    });
    
    evaluations.forEach(e => {
      if (cycleMap[e.reviewCycleId]) {
        cycleMap[e.reviewCycleId].totalEvaluations++;
        cycleMap[e.reviewCycleId].sum += (e.totalScore || 0);
      }
    });
    
    return Object.values(cycleMap).map(c => ({
      ...c,
      averageScore: c.totalEvaluations > 0 ? Math.round(c.sum / c.totalEvaluations) : 0
    }));
  }, [reviewCycles, evaluations, dataLoading]);

  return {
    executiveAnalytics,
    teamAnalytics,
    studentAnalytics,
    guideAnalytics,
    facultyAnalytics,
    reviewerAnalytics,
    departmentAnalytics,
    evaluationAnalytics
  };
};
