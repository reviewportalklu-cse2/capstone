/**
 * Enterprise Relationship Synchronization Engine
 * Centralized resolution of relational mappings:
 * Student -> Team -> Project -> Guide -> Faculty -> Reviewer -> Review Cycle
 */

export const getEntityKeys = (entity) => {
  if (!entity) return [];

  const addKeyWithVariants = (val, targetSet) => {
    if (val === undefined || val === null || String(val).trim() === '') return;
    const str = String(val).trim().toLowerCase();
    targetSet.add(str);
    
    // Also add version with hyphens/underscores stripped
    const stripped = str.replace(/[-_\s]/g, '');
    if (stripped) targetSet.add(stripped);

    // If string is an email, also add the username prefix before @
    if (str.includes('@')) {
      const username = str.split('@')[0].trim().toLowerCase();
      if (username) {
        targetSet.add(username);
        const unstripped = username.replace(/[-_\s]/g, '');
        if (unstripped) targetSet.add(unstripped);
        addKeyWithVariants(username, targetSet);
      }
    }

    // Match prefixes like G001, G-001, F01, R1, GUIDE01, FACULTY01, REVIEWER01, EMP001
    const match = str.match(/^([a-z]+)[-_\s]*0*(\d+)$/i);
    if (match) {
      const origPrefix = match[1].toLowerCase();
      const num = parseInt(match[2], 10);
      
      const prefixVariants = new Set([origPrefix]);
      if (['guide', 'gde', 'g', 'emp'].includes(origPrefix)) {
        prefixVariants.add('g');
        prefixVariants.add('guide');
        prefixVariants.add('gde');
        prefixVariants.add('emp');
      }
      if (['faculty', 'fac', 'f', 'emp'].includes(origPrefix)) {
        prefixVariants.add('f');
        prefixVariants.add('faculty');
        prefixVariants.add('fac');
        prefixVariants.add('emp');
      }
      if (['reviewer', 'rev', 'r', 'emp'].includes(origPrefix)) {
        prefixVariants.add('r');
        prefixVariants.add('reviewer');
        prefixVariants.add('rev');
        prefixVariants.add('emp');
      }

      prefixVariants.forEach(prefix => {
        targetSet.add(`${prefix}${num}`);
        targetSet.add(`${prefix}0${num}`);
        targetSet.add(`${prefix}00${num}`);
        targetSet.add(`${prefix}000${num}`);
        targetSet.add(`${prefix}-${num}`);
        targetSet.add(`${prefix}-0${num}`);
        targetSet.add(`${prefix}-00${num}`);
      });
    }
    
    // Handle pure numerical IDs like 001, 01, 1
    const numMatch = str.match(/^0*(\d+)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      targetSet.add(`${num}`);
      targetSet.add(`0${num}`);
      targetSet.add(`00${num}`);
    }
  };

  const keySet = new Set();

  if (typeof entity === 'string' || typeof entity === 'number') {
    addKeyWithVariants(entity, keySet);
    return Array.from(keySet);
  }

  const rawValues = [
    entity.id,
    entity._id,
    entity.guideId,
    entity.GuideID,
    entity['Guide ID'],
    entity.facultyId,
    entity.FacultyID,
    entity['Faculty ID'],
    entity.reviewerId,
    entity.ReviewerID,
    entity['Reviewer ID'],
    entity.studentId,
    entity.StudentID,
    entity['Student ID'],
    entity.teamId,
    entity.TeamID,
    entity['Team ID'],
    entity.projectId,
    entity.ProjectID,
    entity['Project ID'],
    entity.employeeId,
    entity.employeeID,
    entity['Employee ID'],
    entity['Emp ID'],
    entity.rollNumber,
    entity.rollNo,
    entity['Roll Number'],
    entity.email,
    entity.Email,
    entity.name,
    entity['Guide Name'],
    entity['Faculty Name'],
    entity['Reviewer Name'],
    entity['Student Name']
  ];

  rawValues.forEach(val => addKeyWithVariants(val, keySet));
  return Array.from(keySet);
};

export const resolveEntityMatch = (collectionArray = [], searchKey = '') => {
  if (!searchKey || !collectionArray || collectionArray.length === 0) return null;
  const targetKeys = getEntityKeys(searchKey);

  return collectionArray.find(item => {
    if (!item) return false;
    const itemKeys = getEntityKeys(item);
    return targetKeys.some(tk => itemKeys.includes(tk));
  }) || null;
};

export const resolveGuideRelationships = (guide, contextData = {}) => {
  if (!guide) return { assignments: [], teams: [], students: [], projects: [], teamCount: 0, studentCount: 0, projectCount: 0 };
  const {
    guideAssignments = [],
    teams = [],
    students = [],
    projects = []
  } = contextData;

  const guideKeys = getEntityKeys(guide);

  const matchedAssignments = guideAssignments.filter(ga => {
    const gaKeys = getEntityKeys(ga);
    return guideKeys.some(k => gaKeys.includes(k));
  });

  const matchedStudentTeams = students.filter(s => {
    const sGuideKeys = getEntityKeys({ guideId: s.guideId || s['Guide ID'] || s.guideName || s['Guide Name'] });
    return guideKeys.some(k => sGuideKeys.includes(k));
  });

  const assignedTeamKeys = new Set();
  matchedAssignments.forEach(ga => getEntityKeys(ga.teamId || ga.team).forEach(k => assignedTeamKeys.add(k)));
  matchedStudentTeams.forEach(s => getEntityKeys(s.teamId || s.team || s['Team ID']).forEach(k => assignedTeamKeys.add(k)));
  teams.forEach(t => {
    const relKeys = getEntityKeys({
      id: t.guideId || t.guide || t['Guide ID'],
      name: t.guideName || t['Guide Name'],
      employeeId: t.guideEmployeeId
    });
    if (guideKeys.some(k => relKeys.includes(k))) {
      getEntityKeys(t).forEach(k => assignedTeamKeys.add(k));
    }
  });

  const matchedTeams = teams.filter(t => {
    const tKeys = getEntityKeys(t);
    return tKeys.some(k => assignedTeamKeys.has(k));
  });

  const matchedStudents = students.filter(s => {
    const sKeys = getEntityKeys(s);
    if (sKeys.some(k => guideKeys.includes(k))) return true;
    const sTeamKeys = getEntityKeys(s.teamId || s.team || s['Team ID']);
    if (sTeamKeys.some(k => assignedTeamKeys.has(k))) return true;

    return matchedTeams.some(t => {
      const members = Array.isArray(t.members) ? t.members.flatMap(m => getEntityKeys(m)) : [];
      const studentRolls = Array.isArray(t.studentRollNumbers) ? t.studentRollNumbers.flatMap(m => getEntityKeys(m)) : [];
      const studentIds = Array.isArray(t.studentIds) ? t.studentIds.flatMap(m => getEntityKeys(m)) : [];
      return sKeys.some(k => members.includes(k) || studentRolls.includes(k) || studentIds.includes(k));
    });
  });

  const matchedProjects = projects.filter(p => {
    const pTeamKeys = getEntityKeys(p.teamId || p.team || p['Project ID']);
    if (pTeamKeys.some(k => assignedTeamKeys.has(k))) return true;

    return matchedTeams.some(t => {
      const tProjKeys = getEntityKeys(t.projectId || t.project || t['Project ID']);
      const pKeys = getEntityKeys(p);
      return pKeys.some(k => tProjKeys.includes(k));
    });
  });

  return {
    assignments: matchedAssignments,
    teams: matchedTeams,
    students: matchedStudents,
    projects: matchedProjects,
    teamCount: matchedTeams.length,
    studentCount: matchedStudents.length,
    projectCount: matchedProjects.length
  };
};

export const resolveFacultyRelationships = (facultyMember, contextData = {}) => {
  if (!facultyMember) return { assignments: [], teams: [], students: [], projects: [], teamCount: 0, studentCount: 0, projectCount: 0 };
  const {
    facultyAssignments = [],
    teams = [],
    students = [],
    projects = []
  } = contextData;

  const facultyKeys = getEntityKeys(facultyMember);

  const matchedAssignments = facultyAssignments.filter(fa => {
    const faKeys = getEntityKeys(fa);
    return facultyKeys.some(k => faKeys.includes(k));
  });

  const matchedFacStudentTeams = students.filter(s => {
    const sFacKeys = getEntityKeys({ facultyId: s.facultyId || s['Faculty ID'] || s.facultyName || s['Faculty Name'] });
    return facultyKeys.some(k => sFacKeys.includes(k));
  });

  const assignedTeamKeys = new Set();
  matchedAssignments.forEach(fa => getEntityKeys(fa.teamId || fa.team).forEach(k => assignedTeamKeys.add(k)));
  matchedFacStudentTeams.forEach(s => getEntityKeys(s.teamId || s.team || s['Team ID']).forEach(k => assignedTeamKeys.add(k)));
  teams.forEach(t => {
    const relKeys = getEntityKeys({
      id: t.facultyId || t.faculty || t['Faculty ID'],
      name: t.facultyName || t['Faculty Name'],
      employeeId: t.facultyEmployeeId
    });
    if (facultyKeys.some(k => relKeys.includes(k))) {
      getEntityKeys(t).forEach(k => assignedTeamKeys.add(k));
    }
  });

  const matchedTeams = teams.filter(t => {
    const tKeys = getEntityKeys(t);
    return tKeys.some(k => assignedTeamKeys.has(k));
  });

  const matchedStudents = students.filter(s => {
    const sKeys = getEntityKeys(s);
    if (sKeys.some(k => facultyKeys.includes(k))) return true;
    const sTeamKeys = getEntityKeys(s.teamId || s.team || s['Team ID']);
    if (sTeamKeys.some(k => assignedTeamKeys.has(k))) return true;

    return matchedTeams.some(t => {
      const members = Array.isArray(t.members) ? t.members.flatMap(m => getEntityKeys(m)) : [];
      const studentRolls = Array.isArray(t.studentRollNumbers) ? t.studentRollNumbers.flatMap(m => getEntityKeys(m)) : [];
      const studentIds = Array.isArray(t.studentIds) ? t.studentIds.flatMap(m => getEntityKeys(m)) : [];
      return sKeys.some(k => members.includes(k) || studentRolls.includes(k) || studentIds.includes(k));
    });
  });

  const matchedProjects = projects.filter(p => {
    const pTeamKeys = getEntityKeys(p.teamId || p.team || p['Project ID']);
    if (pTeamKeys.some(k => assignedTeamKeys.has(k))) return true;

    return matchedTeams.some(t => {
      const tProjKeys = getEntityKeys(t.projectId || t.project || t['Project ID']);
      const pKeys = getEntityKeys(p);
      return pKeys.some(k => tProjKeys.includes(k));
    });
  });

  return {
    assignments: matchedAssignments,
    teams: matchedTeams,
    students: matchedStudents,
    projects: matchedProjects,
    teamCount: matchedTeams.length,
    studentCount: matchedStudents.length,
    projectCount: matchedProjects.length
  };
};

export const resolveReviewerRelationships = (reviewerMember, contextData = {}) => {
  if (!reviewerMember) return { assignments: [], teams: [], students: [], projects: [], teamCount: 0, studentCount: 0, projectCount: 0 };
  const {
    reviewerAssignments = [],
    teams = [],
    students = [],
    projects = []
  } = contextData;

  const reviewerKeys = getEntityKeys(reviewerMember);

  const matchedAssignments = reviewerAssignments.filter(ra => {
    const raKeys = getEntityKeys(ra);
    return reviewerKeys.some(k => raKeys.includes(k));
  });

  const matchedRevStudentTeams = students.filter(s => {
    const sRevKeys = getEntityKeys({ reviewerId: s.reviewerId || s['Reviewer ID'] || s.reviewerName || s['Reviewer Name'] });
    return reviewerKeys.some(k => sRevKeys.includes(k));
  });

  const assignedTeamKeys = new Set();
  matchedAssignments.forEach(ra => getEntityKeys(ra.teamId || ra.team).forEach(k => assignedTeamKeys.add(k)));
  matchedRevStudentTeams.forEach(s => getEntityKeys(s.teamId || s.team || s['Team ID']).forEach(k => assignedTeamKeys.add(k)));
  teams.forEach(t => {
    const relKeys = getEntityKeys({
      id: t.reviewerId || t.reviewer || t['Reviewer ID'],
      name: t.reviewerName || t['Reviewer Name'],
      employeeId: t.reviewerEmployeeId
    });
    if (reviewerKeys.some(k => relKeys.includes(k))) {
      getEntityKeys(t).forEach(k => assignedTeamKeys.add(k));
    }
  });

  const matchedTeams = teams.filter(t => {
    const tKeys = getEntityKeys(t);
    return tKeys.some(k => assignedTeamKeys.has(k));
  });

  const matchedStudents = students.filter(s => {
    const sKeys = getEntityKeys(s);
    if (sKeys.some(k => reviewerKeys.includes(k))) return true;
    const sTeamKeys = getEntityKeys(s.teamId || s.team || s['Team ID']);
    if (sTeamKeys.some(k => assignedTeamKeys.has(k))) return true;

    return matchedTeams.some(t => {
      const members = Array.isArray(t.members) ? t.members.flatMap(m => getEntityKeys(m)) : [];
      const studentRolls = Array.isArray(t.studentRollNumbers) ? t.studentRollNumbers.flatMap(m => getEntityKeys(m)) : [];
      const studentIds = Array.isArray(t.studentIds) ? t.studentIds.flatMap(m => getEntityKeys(m)) : [];
      return sKeys.some(k => members.includes(k) || studentRolls.includes(k) || studentIds.includes(k));
    });
  });

  const matchedProjects = projects.filter(p => {
    const pTeamKeys = getEntityKeys(p.teamId || p.team || p['Project ID']);
    if (pTeamKeys.some(k => assignedTeamKeys.has(k))) return true;

    return matchedTeams.some(t => {
      const tProjKeys = getEntityKeys(t.projectId || t.project || t['Project ID']);
      const pKeys = getEntityKeys(p);
      return pKeys.some(k => tProjKeys.includes(k));
    });
  });

  return {
    assignments: matchedAssignments,
    teams: matchedTeams,
    students: matchedStudents,
    projects: matchedProjects,
    teamCount: matchedTeams.length,
    studentCount: matchedStudents.length,
    projectCount: matchedProjects.length
  };
};

export const resolveStudentRelations = (student, contextData = {}) => {
  if (!student) return null;

  const {
    teams = [],
    projects = [],
    guides = [],
    faculty = [],
    reviewers = [],
    reviewCycles = [],
    reviewerAssignments = []
  } = contextData;

  // 1. Resolve Team
  const teamIdKey = student.teamId || student.team || student['Team ID'] || student.TeamID || '';
  let team = resolveEntityMatch(teams, teamIdKey);

  if (!team && student.id) {
    team = teams.find(t => 
      t.members?.includes(student.id) || 
      t.members?.includes(student.rollNumber) || 
      t.studentRollNumbers?.includes(student.rollNumber)
    ) || null;
  }

  // 2. Resolve Project
  const projectIdKey = student.projectId || student['Project ID'] || team?.projectId || team?.['Project ID'] || '';
  let project = resolveEntityMatch(projects, projectIdKey);
  if (!project && team) {
    project = projects.find(p => p.teamId === team.id || p.teamId === team.teamId) || null;
  }

  // 3. Resolve Guide
  const guideKey = student.guideId || student.guideName || student['Guide ID'] || student['Guide Name'] || team?.guideId || team?.guideName || team?.['Guide Name'] || '';
  const guide = resolveEntityMatch(guides, guideKey);
  const guideName = guide?.name || guide?.['Guide Name'] || student.guideName || team?.guideName || (guideKey && !guideKey.startsWith('gde-') ? guideKey : 'Unassigned');

  // 4. Resolve Faculty
  const facultyKey = student.facultyId || student.facultyName || student['Faculty ID'] || student['Faculty Name'] || team?.facultyId || team?.facultyName || team?.['Faculty Name'] || '';
  const facultyObj = resolveEntityMatch(faculty, facultyKey);
  const facultyName = facultyObj?.name || facultyObj?.['Faculty Name'] || student.facultyName || team?.facultyName || (facultyKey && !facultyKey.startsWith('fac-') ? facultyKey : 'Unassigned');

  // 5. Resolve Reviewer
  const reviewerKey = student.reviewerId || student.reviewerName || student['Reviewer ID'] || student['Reviewer Name'] || team?.reviewerId || team?.reviewerName || team?.['Reviewer Name'] || '';
  let reviewer = resolveEntityMatch(reviewers, reviewerKey);

  if (!reviewer && team) {
    const activeAssignment = reviewerAssignments?.find(a => 
      (a.teamId === team.id || a.teamId === team.teamId) && a.status === 'Active'
    );
    if (activeAssignment) {
      reviewer = resolveEntityMatch(reviewers, activeAssignment.reviewerId);
    }
  }

  const reviewerName = reviewer?.name || reviewer?.['Reviewer Name'] || student.reviewerName || team?.reviewerName || (reviewerKey && !reviewerKey.startsWith('rev-') ? reviewerKey : 'Unassigned');

  // 6. Resolve Active Review Cycle
  const activeCycle = reviewCycles?.find(c => c.status === 'Active') || reviewCycles?.[0] || null;

  return {
    ...student,
    teamId: team?.teamId || team?.id || student.teamId || 'Unassigned',
    teamName: team?.teamName || team?.name || student.teamName || (team ? `Team ${team.teamId || team.id}` : 'Unassigned'),
    projectId: project?.projectId || project?.id || student.projectId || 'Unassigned',
    projectTitle: project?.projectTitle || project?.title || project?.name || student.projectTitle || 'Unassigned',
    guideId: guide?.guideId || guide?.employeeId || guide?.id || student.guideId || '',
    guideName,
    guideObj: guide,
    facultyId: facultyObj?.facultyId || facultyObj?.employeeId || facultyObj?.id || student.facultyId || '',
    facultyName,
    facultyObj,
    reviewerId: reviewer?.reviewerId || reviewer?.employeeId || reviewer?.id || student.reviewerId || '',
    reviewerName,
    reviewerObj: reviewer,
    batch: student.batch || team?.batch || student.year || '2026',
    section: student.section || team?.section || 'A',
    reviewCycleName: activeCycle?.reviewName || activeCycle?.name || 'Active Cycle'
  };
};

export const resolveTeamRelations = (team, contextData = {}) => {
  if (!team) return null;

  const {
    students = [],
    projects = [],
    guides = [],
    faculty = [],
    reviewers = [],
    reviewCycles = [],
    guideAssignments = [],
    facultyAssignments = [],
    reviewerAssignments = [],
    evaluations = [],
    guideMarks = [],
    facultyMarks = [],
    reviews = []
  } = contextData;

  const teamIdentifier = String(team.teamId || team.id || team.TeamID || '').trim().toLowerCase();

  // 1. Resolve Team Members (Students linked to this team)
  const memberList = students.filter(s => {
    if (!s) return false;
    const sTeamId = String(s.teamId || s.team || s['Team ID'] || s.TeamID || '').trim().toLowerCase();
    const sRoll = String(s.rollNumber || s.rollNo || s['Roll Number'] || s.id || '').trim().toLowerCase();
    const sId = String(s.id || '').trim().toLowerCase();

    return (
      (sTeamId && sTeamId === teamIdentifier) ||
      (Array.isArray(team.members) && (team.members.map(m => String(m).toLowerCase()).includes(sId) || team.members.map(m => String(m).toLowerCase()).includes(sRoll))) ||
      (Array.isArray(team.studentIds) && team.studentIds.map(m => String(m).toLowerCase()).includes(sId)) ||
      (Array.isArray(team.studentRollNumbers) && team.studentRollNumbers.map(m => String(m).toLowerCase()).includes(sRoll))
    );
  });

  // Helper to retrieve fallback property from member students
  const getMemberValue = (keys) => {
    for (const m of memberList) {
      for (const k of keys) {
        if (m[k]) return m[k];
      }
    }
    return '';
  };

  // 2. Resolve Project
  const projectKey = team.projectId || team.projectTitle || team['Project ID'] || getMemberValue(['projectId', 'project', 'Project ID', 'projectTitle']);
  let project = resolveEntityMatch(projects, projectKey);
  if (!project && teamIdentifier) {
    project = projects.find(p => String(p.teamId || p.team || '').trim().toLowerCase() === teamIdentifier) || null;
  }

  // 3. Resolve Guide (Check active guideAssignments first, then team/member guideKey)
  let guide = null;
  const activeGuideAssignment = guideAssignments?.find(a => 
    String(a.teamId || a.team || '').trim().toLowerCase() === teamIdentifier && 
    (a.status === 'Active' || !a.status)
  );
  if (activeGuideAssignment) {
    guide = resolveEntityMatch(guides, activeGuideAssignment.guideId || activeGuideAssignment.employeeId);
  }
  if (!guide) {
    const guideKey = team.guideId || team.guideName || team['Guide ID'] || getMemberValue(['guideId', 'guideName', 'guide', 'Guide ID', 'Guide Name', 'assignedGuideId', 'guideCode']);
    guide = resolveEntityMatch(guides, guideKey);
  }
  const guideName = guide?.name || guide?.['Guide Name'] || team.guideName || (team.guideId && !team.guideId.startsWith('gde-') ? team.guideId : 'Unassigned');

  // 4. Resolve Faculty (Check active facultyAssignments first, then team/member facultyKey)
  let facultyObj = null;
  const activeFacultyAssignment = facultyAssignments?.find(a => 
    String(a.teamId || a.team || '').trim().toLowerCase() === teamIdentifier && 
    (a.status === 'Active' || !a.status)
  );
  if (activeFacultyAssignment) {
    facultyObj = resolveEntityMatch(faculty, activeFacultyAssignment.facultyId || activeFacultyAssignment.employeeId);
  }
  if (!facultyObj) {
    const facultyKey = team.facultyId || team.facultyName || team['Faculty ID'] || getMemberValue(['facultyId', 'facultyName', 'faculty', 'Faculty ID', 'Faculty Name', 'assignedFacultyId', 'facultyCode']);
    facultyObj = resolveEntityMatch(faculty, facultyKey);
  }
  const facultyName = facultyObj?.name || facultyObj?.['Faculty Name'] || team.facultyName || (team.facultyId && !team.facultyId.startsWith('fac-') ? team.facultyId : 'Unassigned');

  // 5. Resolve Reviewer (Check Active Review Cycle Assignment first, then fallback to team/member reviewerKey)
  let reviewer = null;

  const activeCycle = reviewCycles?.find(c => c.status === 'Active') || reviewCycles?.[0] || null;
  if (activeCycle) {
    const activeAssignment = reviewerAssignments?.find(a => 
      String(a.teamId || a.team || '').trim().toLowerCase() === teamIdentifier && 
      (a.reviewCycleId === activeCycle.id || a.reviewCycleId === activeCycle.reviewCycleId || a.status === 'Active' || !a.status)
    );
    if (activeAssignment) {
      reviewer = resolveEntityMatch(reviewers, activeAssignment.reviewerId || activeAssignment.employeeId);
    }
  }

  if (!reviewer) {
    const reviewerKey = team.reviewerId || team.reviewerName || team['Reviewer ID'] || getMemberValue(['reviewerId', 'reviewerName', 'reviewer', 'Reviewer ID', 'Reviewer Name']);
    reviewer = resolveEntityMatch(reviewers, reviewerKey);
  }
  const reviewerName = reviewer?.name || reviewer?.['Reviewer Name'] || team.reviewerName || 'Unassigned';

  // 6. Dynamically Calculate Marks from evaluation collections
  const memberStudentIds = memberList.map(m => m.id);
  const memberRolls = memberList.map(m => m.rollNumber || m.rollNo);

  const cleanTeamId = String(team.teamId || team.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const teamEvaluations = evaluations.filter(e => {
    const eTeamId = String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return eTeamId === cleanTeamId;
  }).sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));

  const guideEval = teamEvaluations.find(e => e.role === 'guide');
  const facultyEval = teamEvaluations.find(e => e.role === 'classroom_faculty' || e.role === 'faculty');
  const reviewerEval = teamEvaluations.find(e => e.role === 'reviewer');

  const teamGuideMarks = guideMarks.filter(m => memberStudentIds.includes(m.studentId) || memberRolls.includes(m.rollNumber));
  const teamFacultyMarks = facultyMarks.filter(m => memberStudentIds.includes(m.studentId) || memberRolls.includes(m.rollNumber));
  const teamReviews = reviews.filter(r => {
    const rTeamId = String(r.teamId || r.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return rTeamId === cleanTeamId || memberStudentIds.includes(r.studentId) || memberRolls.includes(r.rollNumber);
  });

  const calcAvg = (arr, key = 'score') => {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((acc, curr) => acc + (Number(curr[key] || curr.totalScore || curr.marks || 0)), 0);
    return Math.round(sum / arr.length);
  };

  const guideScore = guideEval ? (guideEval.teamAverage ?? guideEval.totalScore ?? 0) : (teamGuideMarks.length > 0 ? calcAvg(teamGuideMarks) : null);
  const facultyScore = facultyEval ? (facultyEval.teamAverage ?? facultyEval.totalScore ?? 0) : (teamFacultyMarks.length > 0 ? calcAvg(teamFacultyMarks) : null);
  const reviewerScore = reviewerEval ? (reviewerEval.teamAverage ?? reviewerEval.totalScore ?? 0) : (teamReviews.length > 0 ? calcAvg(teamReviews, 'totalScore') : null);

  const validScores = [guideScore, facultyScore, reviewerScore].filter(s => s !== null && s !== undefined);
  const avgMarks = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;

  return {
    ...team,
    teamId: team.teamId || team.id || teamIdentifier.toUpperCase(),
    teamName: team.teamName || team.name || `Team ${team.teamId || team.id}`,
    projectId: project?.projectId || project?.id || team.projectId || getMemberValue(['projectId', 'project']),
    projectTitle: project?.projectTitle || project?.title || project?.name || team.projectTitle || getMemberValue(['projectTitle']),
    projectObj: project,
    guideId: guide?.guideId || guide?.employeeId || guide?.id || team.guideId || getMemberValue(['guideId']),
    guideName,
    guideObj: guide,
    facultyId: facultyObj?.facultyId || facultyObj?.employeeId || facultyObj?.id || team.facultyId || getMemberValue(['facultyId']),
    facultyName,
    facultyObj,
    reviewerId: reviewer?.reviewerId || reviewer?.employeeId || reviewer?.id || team.reviewerId || getMemberValue(['reviewerId']),
    reviewerName,
    reviewerObj: reviewer,
    members: memberList,
    memberCount: memberList.length,
    guideScore,
    facultyScore,
    reviewerScore,
    avgMarks
  };
};
