import { useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';

export const useOutcomeEngine = () => {
  const {
    students = [],
    teams = [],
    projects = [],
    guides = [],
    faculty = [],
    reviewers = [],
    reviewCycles = [],
    evaluations = [],
    marks = [], // facultyMarks
    guideMarks = [],
    attendance = [],
    settings = [],
    dataLoading
  } = useData() || {};

  // 1. Fetch Configuration Settings
  const academicWeights = useMemo(() => {
    const aw = settings?.find(s => s.id === 'academicWeights');
    return {
      guideWeight: aw?.guideWeight || 30,
      facultyWeight: aw?.facultyWeight || 20,
      reviewerWeight: aw?.reviewerWeight || 50
    };
  }, [settings]);

  const resultRules = useMemo(() => {
    const rr = settings?.find(s => s.id === 'resultRules');
    return {
      minimumPassPercentage: rr?.minimumPassPercentage || 50,
      requireGuidePass: rr?.requireGuidePass || false,
      requireFacultyPass: rr?.requireFacultyPass || false,
      requireReviewerPass: rr?.requireReviewerPass || false,
      attendanceMandatory: rr?.attendanceMandatory ?? true,
      minimumAttendance: rr?.minimumAttendance || 75
    };
  }, [settings]);

  const gradeBoundaries = useMemo(() => {
    // We could make this dynamic in settings, hardcoded default for now
    return [
      { grade: 'O', min: 90, max: 100 },
      { grade: 'A+', min: 80, max: 89.99 },
      { grade: 'A', min: 70, max: 79.99 },
      { grade: 'B+', min: 60, max: 69.99 },
      { grade: 'B', min: 50, max: 59.99 },
      { grade: 'F', min: 0, max: 49.99 }
    ];
  }, []);

  // 2. Core Calculation Methods
  const calculateReviewerScore = useCallback((teamId) => {
    const teamEvaluations = evaluations.filter(e => e.teamId === teamId);
    if (teamEvaluations.length === 0) return 0;
    
    // For now, average all review cycles equally unless cycleWeights are defined
    let totalScore = 0;
    teamEvaluations.forEach(ev => totalScore += (ev.totalScore || 0));
    return Number((totalScore / teamEvaluations.length).toFixed(2));
  }, [evaluations]);

  const calculateGuideScore = useCallback((teamId) => {
    const teamStudents = students.filter(s => s.teamId === teamId);
    const gMarks = guideMarks.filter(m => teamStudents.some(s => s.id === m.studentId));
    if (gMarks.length === 0) return 0;
    
    let totalScore = 0;
    gMarks.forEach(m => totalScore += (m.score || m.marks || 0));
    return Number((totalScore / gMarks.length).toFixed(2));
  }, [students, guideMarks]);

  const calculateFacultyScore = useCallback((teamId) => {
    const teamStudents = students.filter(s => s.teamId === teamId);
    const fMarks = marks.filter(m => teamStudents.some(s => s.id === m.studentId));
    if (fMarks.length === 0) return 0;
    
    let totalScore = 0;
    fMarks.forEach(m => totalScore += (m.score || m.marks || 0));
    return Number((totalScore / fMarks.length).toFixed(2));
  }, [students, marks]);

  const calculateAttendanceScore = useCallback((studentId) => {
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    if (studentAttendance.length === 0) return 100; // Assume 100% if no records
    
    const present = studentAttendance.filter(a => a.status === 'Present').length;
    return Number(((present / studentAttendance.length) * 100).toFixed(2));
  }, [attendance]);

  const calculateTeamResult = useCallback((teamId) => {
    const reviewerScore = calculateReviewerScore(teamId);
    const guideScore = calculateGuideScore(teamId);
    const facultyScore = calculateFacultyScore(teamId);

    const weightedReviewer = (reviewerScore * academicWeights.reviewerWeight) / 100;
    const weightedGuide = (guideScore * academicWeights.guideWeight) / 100;
    const weightedFaculty = (facultyScore * academicWeights.facultyWeight) / 100;

    const finalTeamScore = Number((weightedReviewer + weightedGuide + weightedFaculty).toFixed(2));

    return {
      reviewerScore,
      guideScore,
      facultyScore,
      weightedReviewer,
      weightedGuide,
      weightedFaculty,
      finalTeamScore
    };
  }, [calculateReviewerScore, calculateGuideScore, calculateFacultyScore, academicWeights]);

  const calculateFinalGrade = useCallback((score) => {
    const boundary = gradeBoundaries.find(b => score >= b.min && score <= b.max) || gradeBoundaries[gradeBoundaries.length - 1];
    return boundary.grade;
  }, [gradeBoundaries]);

  const calculateFinalStatus = useCallback((score, attScore, teamResult) => {
    if (score < resultRules.minimumPassPercentage) return 'Fail';
    if (resultRules.attendanceMandatory && attScore < resultRules.minimumAttendance) return 'Fail (Low Attendance)';
    if (resultRules.requireGuidePass && teamResult.guideScore < resultRules.minimumPassPercentage) return 'Fail (Guide)';
    if (resultRules.requireFacultyPass && teamResult.facultyScore < resultRules.minimumPassPercentage) return 'Fail (Faculty)';
    if (resultRules.requireReviewerPass && teamResult.reviewerScore < resultRules.minimumPassPercentage) return 'Fail (Reviewer)';
    return 'Pass';
  }, [resultRules]);

  const calculateStudentResult = useCallback((student) => {
    const teamResult = calculateTeamResult(student.teamId);
    const attScore = calculateAttendanceScore(student.id);
    
    // Simple penalty model: subtract 5% if attendance < minimum (if not already failing)
    let penalty = 0;
    if (resultRules.attendanceMandatory && attScore < resultRules.minimumAttendance) {
      penalty = 5;
    }

    let finalScore = teamResult.finalTeamScore - penalty;
    if (finalScore < 0) finalScore = 0;

    const grade = calculateFinalGrade(finalScore);
    const status = calculateFinalStatus(finalScore, attScore, teamResult);

    return {
      ...student,
      ...teamResult,
      attendance: attScore,
      penalty,
      finalScore,
      grade,
      status
    };
  }, [calculateTeamResult, calculateAttendanceScore, resultRules, calculateFinalGrade, calculateFinalStatus]);

  // 3. Ranking Generators
  const generateSemesterRankings = useCallback(() => {
    if (dataLoading) return { students: [], teams: [] };

    // Student Rankings
    const rankedStudents = students.map(s => calculateStudentResult(s)).sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if (b.reviewerScore !== a.reviewerScore) return b.reviewerScore - a.reviewerScore;
      if (b.guideScore !== a.guideScore) return b.guideScore - a.guideScore;
      if (b.attendance !== a.attendance) return b.attendance - a.attendance;
      return (a.rollNo || '').localeCompare(b.rollNo || '');
    }).map((s, idx) => ({ ...s, rank: idx + 1 }));

    // Team Rankings
    const rankedTeams = teams.map(t => {
      const res = calculateTeamResult(t.id);
      const teamStudents = rankedStudents.filter(s => s.teamId === t.id);
      let sumAtt = 0;
      teamStudents.forEach(s => sumAtt += s.attendance);
      const avgAtt = teamStudents.length > 0 ? sumAtt / teamStudents.length : 0;
      
      return {
        ...t,
        ...res,
        attendance: Number(avgAtt.toFixed(2)),
        projectName: projects.find(p => p.id === t.projectId)?.title || 'No Project'
      };
    }).sort((a, b) => {
      if (b.finalTeamScore !== a.finalTeamScore) return b.finalTeamScore - a.finalTeamScore;
      if (b.reviewerScore !== a.reviewerScore) return b.reviewerScore - a.reviewerScore;
      if (b.guideScore !== a.guideScore) return b.guideScore - a.guideScore;
      return b.attendance - a.attendance;
    }).map((t, idx) => ({ ...t, rank: idx + 1 }));

    return { students: rankedStudents, teams: rankedTeams };
  }, [students, teams, projects, calculateStudentResult, calculateTeamResult, dataLoading]);

  const generateDepartmentRankings = useCallback(() => {
    // For a multi-department setup, group by department and run generateSemesterRankings logic
    // Simplified since there is only CSE
    return generateSemesterRankings();
  }, [generateSemesterRankings]);

  const generateStatistics = useCallback(() => {
    const { students: rankedStudents, teams: rankedTeams } = generateSemesterRankings();
    
    if (rankedStudents.length === 0) return null;

    let highest = 0, lowest = 100, sum = 0, passCount = 0;
    const gradesCount = {};

    rankedStudents.forEach(s => {
      if (s.finalScore > highest) highest = s.finalScore;
      if (s.finalScore < lowest) lowest = s.finalScore;
      sum += s.finalScore;
      if (s.status === 'Pass') passCount++;
      
      gradesCount[s.grade] = (gradesCount[s.grade] || 0) + 1;
    });

    const mean = Number((sum / rankedStudents.length).toFixed(2));
    
    // Std Dev
    let varianceSum = 0;
    rankedStudents.forEach(s => {
      varianceSum += Math.pow(s.finalScore - mean, 2);
    });
    const standardDeviation = Number(Math.sqrt(varianceSum / rankedStudents.length).toFixed(2));

    const passPercentage = Number(((passCount / rankedStudents.length) * 100).toFixed(2));
    const failPercentage = Number((100 - passPercentage).toFixed(2));

    return {
      highestMarks: highest,
      lowestMarks: lowest,
      mean,
      standardDeviation,
      passPercentage,
      failPercentage,
      gradeDistribution: gradesCount,
      totalEvaluated: rankedStudents.length
    };
  }, [generateSemesterRankings]);

  return {
    academicWeights,
    resultRules,
    gradeBoundaries,
    calculateReviewerScore,
    calculateGuideScore,
    calculateFacultyScore,
    calculateAttendanceScore,
    calculateFinalGrade,
    calculateFinalStatus,
    calculateTeamResult,
    calculateStudentResult,
    generateSemesterRankings,
    generateDepartmentRankings,
    generateStatistics
  };
};
