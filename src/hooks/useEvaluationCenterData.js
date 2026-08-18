import { useData } from '@/contexts/DataContext';

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
    dataLoading
  } = useData() || {};

  const getTeamsWithEvaluations = () => {
    if (dataLoading) return [];

    const guideMap = new Map(guides.map(g => [g.id, g]));
    const reviewerMap = new Map(reviewers.map(r => [r.id, r]));
    const facultyMap = new Map(faculty.map(f => [f.id, f]));

    return projects.map((project, index) => {
      const teamId = project.id || `TEAM${String(index + 1).padStart(3, '0')}`;
      
      const members = students.filter(s => 
        s.projectId === project.id || 
        s.teamId === project.id || 
        s.projectTitle === project.title
      );

      const guide = guideMap.get(project.guideId) || { name: project.guideName || 'Dr. Ramesh (Assigned)' };
      const reviewer = reviewerMap.get(project.reviewerId) || { name: project.reviewerName || 'Dr. Kiran (Assigned)' };
      const facultyPanel = facultyMap.get(project.facultyId) || { name: project.facultyName || 'Faculty Panel A' };

      const teamReviews = reviews.filter(r => 
        r.projectId === project.id || 
        members.some(m => m.id === r.studentId || m.uid === r.studentId)
      );

      const r1 = teamReviews.find(r => r.reviewType === 'Review 1')?.totalScore || project.review1Score || 0;
      const r2 = teamReviews.find(r => r.reviewType === 'Review 2')?.totalScore || project.review2Score || 0;
      const r3 = teamReviews.find(r => r.reviewType === 'Review 3')?.totalScore || project.review3Score || 0;

      const gMark = guideMarks.find(m => members.some(s => s.id === m.studentId || s.uid === m.studentId))?.marks || project.guideScore || 0;
      const fMark = facultyMarks.find(m => members.some(s => s.id === m.studentId || s.uid === m.studentId))?.marks || project.facultyScore || 0;

      const totalWeightedScore = Math.round((gMark * 0.2) + (fMark * 0.2) + (r1 * 0.2) + (r2 * 0.2) + (r3 * 0.2));
      const percentage = totalWeightedScore;
      const grade = calculateGrade(percentage);
      const passStatus = percentage >= 50 ? 'Pass' : 'Fail';

      let stageProgress = 0;
      if (gMark > 0) stageProgress += 20;
      if (fMark > 0) stageProgress += 20;
      if (r1 > 0) stageProgress += 20;
      if (r2 > 0) stageProgress += 20;
      if (r3 > 0) stageProgress += 20;

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
        approvalStage: project.approvalStage || (stageProgress === 100 ? 'Published' : 'Submitted'),
        isLocked: project.isLocked || false,
        status: project.status || (stageProgress === 100 ? 'Completed' : 'In Progress'),
        department: project.department || 'CSE',
        academicYear: project.academicYear || '2026-27',
        batch: project.batch || '2022-26',
        section: project.section || 'A',
        room: project.room || 'Lab 302',
        slot: project.slot || '10:00 AM - 10:30 AM'
      };
    });
  };

  const getTeamDetails = (teamId) => {
    if (dataLoading) return null;
    
    const allTeams = getTeamsWithEvaluations();
    const team = allTeams.find(t => t.id === teamId || t.teamId === teamId || t.title?.toLowerCase().replace(/\s+/g, '-') === teamId);
    
    if (!team) return null;

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

    const facultyPanelDetails = {
      name: team.facultyPanelName,
      chairperson: 'Dr. Srinivas (HOD - CSE)',
      members: ['Dr. Lakshmi', 'Dr. Ravi', 'Dr. Naveen', 'Dr. Mahesh'],
      department: team.department
    };

    const documents = [
      { name: 'Project Proposal', type: 'PDF', size: '1.2 MB', url: '#', date: '2026-01-15' },
      { name: 'Architecture Synopsis', type: 'PDF', size: '2.4 MB', url: '#', date: '2026-02-10' },
      { name: 'Interim Review Presentation', type: 'PPTX', size: '5.8 MB', url: '#', date: '2026-03-20' },
      { name: 'Final Project Report', type: 'PDF', size: '8.1 MB', url: '#', date: '2026-04-12' },
      { name: 'GitHub Repository Code', type: 'ZIP', size: '14.5 MB', url: team.repoUrl || 'https://github.com/capstone', date: '2026-04-18' }
    ];

    const marksHistory = team.marksHistory || [
      {
        id: 'v1',
        date: '2026-03-10',
        time: '11:30 AM',
        updatedBy: 'Dr. Ramesh',
        role: 'Guide',
        previousScore: 15,
        updatedScore: team.guideMarks,
        reason: 'Initial guide evaluation score awarded after code review.'
      },
      {
        id: 'v2',
        date: '2026-04-02',
        time: '02:15 PM',
        updatedBy: 'Dr. Kiran',
        role: 'Reviewer',
        previousScore: 78,
        updatedScore: team.review2Score,
        reason: 'Revised Review 2 presentation score post Q&A defense.'
      }
    ];

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
  };

  return {
    dataLoading,
    getTeamsWithEvaluations,
    getTeamDetails
  };
};
