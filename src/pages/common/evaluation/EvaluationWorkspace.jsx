import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation, guideNavigation, facultyNavigation, reviewerNavigation, studentNavigation } from '@/constants/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { FirestoreService } from '@/firebase/services/firestore';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { resolveTeamRelations, resolveStudentRelations, getEntityKeys } from '@/utils/relationshipResolver';
import { ArrowLeft, Lock, Unlock, Save, ShieldCheck, AlertCircle, Calendar, Clock, CheckCircle, CheckCircle2, Eye, AlertTriangle, Info } from 'lucide-react';

const EvaluationWorkspace = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, currentUser, domainUser } = useAuth();

  const {
    teams, projects, students, rubrics, rubricCriteria,
    evaluations, pendingEvaluations, reviewCycles, reviewerAssignments, guideAssignments, facultyAssignments, guides, faculty: facultyList, reviewers, getGuideById, getFacultyById, getReviewerById, getActiveReviewCycle, dataLoading
  } = useData();

  const activeCycle = getActiveReviewCycle();
  const [selectedCycle, setSelectedCycle] = useState('Review 1');
  const [teamSelection, setTeamSelection] = useState('');

  useEffect(() => {
    if (activeCycle && userRole !== 'admin') {
      setSelectedCycle(activeCycle.name || activeCycle.reviewName || 'Review 1');
    }
  }, [activeCycle, userRole]);

  const [marks, setMarks] = useState({});
  const [markErrors, setMarkErrors] = useState({});
  const [remarks, setRemarks] = useState({});
  const [attendance, setAttendance] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Determine navigation by userRole
  const navItems = useMemo(() => {
    switch(userRole) {
      case 'admin': return adminNavigation;
      case 'guide': return guideNavigation;
      case 'faculty':
      case 'classroom_faculty': return facultyNavigation;
      case 'reviewer': return reviewerNavigation;
      default: return studentNavigation;
    }
  }, [userRole]);

  // Available Teams filter
  const availableTeams = useMemo(() => {
    if (!teams) return [];
    if (userRole === 'admin') return teams;

    const userEntity = domainUser || currentUser;
    const userKeys = getEntityKeys(userEntity);

    return teams.filter(t => {
      const rel = resolveTeamRelations(t, { students, projects, guides, faculty: facultyList, reviewers, reviewCycles, reviewerAssignments, guideAssignments, facultyAssignments });
      if (userRole === 'guide') {
        const targetKeys = getEntityKeys({
          guideId: t.guideId || rel?.guideId,
          guideName: t.guideName || rel?.guideName,
          guideObj: rel?.guideObj
        });
        return userKeys.some(k => targetKeys.includes(k));
      }
      if (userRole === 'faculty' || userRole === 'classroom_faculty') {
        const targetKeys = getEntityKeys({
          facultyId: t.facultyId || rel?.facultyId,
          facultyName: t.facultyName || rel?.facultyName,
          facultyObj: rel?.facultyObj
        });
        return userKeys.some(k => targetKeys.includes(k));
      }
      if (userRole === 'reviewer') {
        const targetKeys = getEntityKeys({
          reviewerId: t.reviewerId || rel?.reviewerId,
          reviewerName: t.reviewerName || rel?.reviewerName,
          reviewerObj: rel?.reviewerObj
        });
        return userKeys.some(k => targetKeys.includes(k));
      }
      return true;
    });
  }, [teams, userRole, currentUser, domainUser, projects, students, guides, facultyList, reviewers, reviewCycles, reviewerAssignments, guideAssignments, facultyAssignments]);

  const [directTeam, setDirectTeam] = useState(null);

  useEffect(() => {
    if (teamId && (!teams || teams.length === 0 || !teams.some(x => String(x.id || x.teamId).toLowerCase() === String(teamId).toLowerCase()))) {
      FirestoreService.getById('teams', teamId).then(t => {
        if (t) setDirectTeam(t);
      }).catch(console.error);
    }
  }, [teamId, teams]);

  const teamData = useMemo(() => {
    if (!teamId) return null;
    const pool = (teams && teams.length > 0) ? teams : (directTeam ? [directTeam] : []);
    if (pool.length === 0) return null;
    const cleanParamId = String(teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const t = pool.find(x => {
      const rawId = String(x.id || x.teamId).toLowerCase();
      const normId = rawId.replace(/[^a-zA-Z0-9]/g, '');
      return rawId === String(teamId).toLowerCase() || normId === cleanParamId;
    });
    if (!t) return null;
    const rel = resolveTeamRelations(t, { students, projects, guides, faculty: facultyList, reviewers, reviewCycles, reviewerAssignments, guideAssignments, facultyAssignments });

    const teamMembers = students?.filter(s => {
      const sRel = resolveStudentRelations(s, { teams, projects, guides, faculty: facultyList, reviewers, reviewCycles, reviewerAssignments });
      const memberTeamId = String(sRel.teamId || s.teamId || '').toLowerCase();
      return memberTeamId === String(rel.teamId).toLowerCase() || memberTeamId.replace(/[^a-zA-Z0-9]/g, '') === cleanParamId;
    }) || [];

    return {
      ...rel,
      project: projects?.find(p => String(p.id || p.projectId).toLowerCase() === String(rel.projectId).toLowerCase()) || { title: rel.projectTitle },
      members: teamMembers,
      guide: rel.guideObj || (rel.guideId ? getGuideById(rel.guideId) : null),
      faculty: rel.facultyObj || (rel.facultyId ? getFacultyById(rel.facultyId) : null),
      reviewer: rel.reviewerObj || (rel.reviewerId ? getReviewerById(rel.reviewerId) : null),
    };
  }, [teamId, teams, directTeam, projects, students, facultyList, guides, reviewers, reviewCycles, reviewerAssignments, guideAssignments, facultyAssignments, getGuideById, getFacultyById, getReviewerById]);

  // Active Published Rubric lookup for selectedCycle
  const activeRubric = useMemo(() => {
    if (!rubrics || rubrics.length === 0) return null;

    const cycleName = String(selectedCycle || activeCycle?.name || activeCycle?.reviewName || 'Review 1').trim().toLowerCase();

    const matchesCycle = (r) => {
      const rCycleName = String(r.reviewCycle || r.reviewCycleName || '').trim().toLowerCase();
      return rCycleName && (rCycleName === cycleName || cycleName.includes(rCycleName) || rCycleName.includes(cycleName));
    };

    const publishedMatch = rubrics.find(r => matchesCycle(r) && (r.status === 'Published' || r.status === 'Active'));
    if (publishedMatch) return publishedMatch;

    return rubrics.find(r => r.status === 'Published' || r.status === 'Active') || null;
  }, [rubrics, selectedCycle, activeCycle]);

  const cycleConfig = useMemo(() => {
    return reviewCycles?.find(c => c.reviewName === selectedCycle || c.name === selectedCycle || c.id === selectedCycle);
  }, [reviewCycles, selectedCycle]);

  const activeWindowStatus = useMemo(() => {
    if (!cycleConfig) return { isAvailable: true, message: 'Active' };
    const now = new Date();

    let startBoundary = null;
    if (cycleConfig.startDate) {
      const timeStr = cycleConfig.startTime || '00:00';
      startBoundary = new Date(`${cycleConfig.startDate}T${timeStr}`);
    }

    let endBoundary = null;
    if (cycleConfig.endDate) {
      const timeStr = cycleConfig.endTime || '23:59';
      endBoundary = new Date(`${cycleConfig.endDate}T${timeStr}`);
    }

    if (startBoundary && !isNaN(startBoundary) && now < startBoundary) {
      return {
        isAvailable: false,
        statusLabel: 'Upcoming',
        message: `Evaluation cycle opens on ${cycleConfig.startDate} at ${cycleConfig.startTime || '00:00'}.`
      };
    }

    if (endBoundary && !isNaN(endBoundary) && now > endBoundary) {
      return {
        isAvailable: false,
        statusLabel: 'Closed',
        message: `Evaluation cycle closed on ${cycleConfig.endDate} at ${cycleConfig.endTime || '23:59'}.`
      };
    }

    return { isAvailable: true, statusLabel: 'Active', message: 'Active Window' };
  }, [cycleConfig]);

  const activeAssignment = useMemo(() => {
    if (!cycleConfig || !teamId || userRole !== 'reviewer') return null;
    return reviewerAssignments?.find(a => String(a.teamId).toLowerCase() === String(teamId).toLowerCase() && (a.reviewCycleId === cycleConfig.id || a.status === 'Active'));
  }, [cycleConfig, teamId, userRole, reviewerAssignments]);

  // Active Criteria derived from published rubric
  const activeCriteria = useMemo(() => {
    if (!activeRubric) return [];

    let result = [];

    if (Array.isArray(activeRubric.criteria) && activeRubric.criteria.length > 0) {
      result = activeRubric.criteria.map((c, idx) => ({
        id: c.id || c.criterionId || `crit_${idx + 1}`,
        criterionId: c.criterionId || c.id || `crit_${idx + 1}`,
        title: c.title || c.criterionName || `Criterion ${idx + 1}`,
        description: c.description || '',
        maximumMarks: Number(c.maximumMarks || c.maxMarks || 10),
        displayOrder: Number(c.displayOrder || c.order || idx + 1)
      }));
    } else if (rubricCriteria && rubricCriteria.length > 0) {
      const rId = String(activeRubric.id || activeRubric.rubricId || '').toLowerCase();
      const filtered = rubricCriteria.filter(c => String(c.rubricId || '').toLowerCase() === rId);

      if (filtered.length > 0) {
        result = filtered.map((c, idx) => ({
          id: c.id || c.criterionId || `crit_${idx + 1}`,
          criterionId: c.criterionId || c.id || `crit_${idx + 1}`,
          title: c.title || c.criterionName || `Criterion ${idx + 1}`,
          description: c.description || '',
          maximumMarks: Number(c.maximumMarks || c.maxMarks || 10),
          displayOrder: Number(c.displayOrder || c.order || idx + 1)
        }));
      }
    }

    return result.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [activeRubric, rubricCriteria]);

  const userKeys = useMemo(() => getEntityKeys(domainUser || currentUser), [domainUser, currentUser]);

  // Existing Evaluation scoped strictly by team, reviewCycle, and role
  const existingEvaluation = useMemo(() => {
    if (!evaluations || !teamId) return null;
    const cleanParamId = String(teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const isFacRole = userRole === 'classroom_faculty' || userRole === 'faculty';
    const evalRole = isFacRole ? 'faculty' : String(userRole).toLowerCase();

    return evaluations.find(e => {
      const eTeamId = String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (eTeamId !== cleanParamId) return false;

      const eCycle = String(e.reviewCycle || e.reviewCycleId || '').trim().toLowerCase();
      const sCycle = String(selectedCycle || '').trim().toLowerCase();
      if (eCycle !== sCycle) return false;

      const eRole = String(e.role || '').toLowerCase();
      const isEFac = eRole === 'faculty' || eRole === 'classroom_faculty';

      if (isFacRole && isEFac) return true;
      if (eRole === evalRole) return true;

      const eKeys = getEntityKeys({
        evaluatorId: e.evaluatorId,
        evaluatorEmployeeId: e.evaluatorEmployeeId,
        evaluatorEmail: e.evaluatorEmail,
        evaluatorName: e.evaluatorName
      });

      return userKeys.some(k => eKeys.includes(k));
    }) || null;
  }, [evaluations, teamId, selectedCycle, userRole, userKeys]);

  const allEvaluationsForCycle = useMemo(() => {
    if (!evaluations || !teamId) return [];
    return evaluations.filter(e => {
      const eTeamId = String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanParamId = String(teamId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const eCycle = String(e.reviewCycle || e.reviewCycleId || '').trim().toLowerCase();
      const sCycle = String(selectedCycle || '').trim().toLowerCase();
      return eTeamId === cleanParamId && eCycle === sCycle;
    });
  }, [evaluations, teamId, selectedCycle]);

  const activePendingEvaluations = useMemo(() => {
    if (!pendingEvaluations || !teamId) return [];
    return pendingEvaluations.filter(p => p.teamId === teamId && p.reviewCycle === selectedCycle && p.status === 'Pending');
  }, [pendingEvaluations, teamId, selectedCycle]);

  useEffect(() => {
    if (existingEvaluation) {
      setMarks(existingEvaluation.marks || {});
      setRemarks(existingEvaluation.remarks || {});
      setAttendance(existingEvaluation.attendance || {});
    } else if (teamData) {
      const initAtt = {};
      teamData.members.forEach(m => { initAtt[m.id] = 'Present'; });
      setAttendance(initAtt);
      setMarks({});
    }
  }, [existingEvaluation, teamData]);

  // Strict Mark Validation: 0 <= enteredMark <= maxMarks
  const handleMarkChange = (studentId, criterionId, value) => {
    const markKey = `${studentId}_${criterionId}`;

    if (value === '' || value === null || value === undefined) {
      setMarks(prev => {
        const next = { ...prev };
        delete next[markKey];
        return next;
      });
      setMarkErrors(prev => {
        const next = { ...prev };
        delete next[markKey];
        return next;
      });
      return;
    }

    const numVal = Number(value);
    const criterion = activeCriteria.find(c => String(c.id) === String(criterionId) || String(c.criterionId) === String(criterionId));
    const maxMarks = criterion ? (Number(criterion.maximumMarks) || 10) : 10;

    if (isNaN(numVal) || numVal < 0 || numVal > maxMarks) {
      setMarkErrors(prev => ({
        ...prev,
        [markKey]: `Must be 0 – ${maxMarks}`
      }));
    } else {
      setMarkErrors(prev => {
        const next = { ...prev };
        delete next[markKey];
        return next;
      });
    }

    const clampedVal = isNaN(numVal) ? 0 : Math.max(0, Math.min(maxMarks, numVal));

    setMarks(prev => ({
      ...prev,
      [markKey]: clampedVal
    }));
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const previewStats = useMemo(() => {
    if (!teamData || !activeCriteria) return { totalMarks: 0, studentTotals: {}, teamAvg: 0, presentCount: 0, absentCount: 0, maxPossibleStudent: 0 };

    let totalMarks = 0;
    let presentCount = 0;
    let absentCount = 0;
    const studentTotals = {};

    const maxPossibleStudent = activeCriteria.reduce((sum, c) => sum + (Number(c.maximumMarks) || 0), 0);

    teamData.members.forEach(student => {
      let stuTotal = 0;
      const isAbsent = attendance[student.id] === 'Absent';
      if (isAbsent) {
        absentCount++;
      } else {
        presentCount++;
      }

      activeCriteria.forEach(c => {
        const rawVal = marks[`${student.id}_${c.id}`];
        const numVal = isAbsent ? 0 : (Number(rawVal) || 0);
        stuTotal += numVal;
      });
      studentTotals[student.id] = stuTotal;
      totalMarks += stuTotal;
    });

    const teamAvg = Math.round(totalMarks / (teamData.members.length || 1));

    return {
      totalMarks,
      studentTotals,
      teamAvg,
      presentCount,
      absentCount,
      maxPossibleStudent
    };
  }, [teamData, activeCriteria, marks, attendance]);

  const handleOpenPreview = () => {
    if (!activeRubric || !teamData) return;
    if (Object.keys(markErrors).length > 0) {
      alert("Please fix invalid marks before proceeding to preview.");
      return;
    }
    setShowPreviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      let totalMarks = 0;
      const studentTotals = {};
      const sanitizedMarks = {};

      teamData.members.forEach(student => {
        let stuTotal = 0;
        const isAbsent = attendance[student.id] === 'Absent';
        activeCriteria.forEach(c => {
          const rawVal = marks[`${student.id}_${c.id}`];
          const numVal = isAbsent ? 0 : (Number(rawVal) || 0);
          sanitizedMarks[`${student.id}_${c.id}`] = numVal;
          stuTotal += numVal;
        });
        studentTotals[student.id] = stuTotal;
        totalMarks += stuTotal;
      });

      const teamAvg = Math.round(totalMarks / (teamData.members.length || 1));

      const now = new Date().toISOString();
      const evalRole = (userRole === 'classroom_faculty' || userRole === 'faculty') ? 'faculty' : userRole;
      const cleanCycle = String(selectedCycle).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const cleanTeam = String(teamData.id).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const evalDocId = existingEvaluation?.id || `eval_${cleanCycle}_${cleanTeam}_${evalRole}`;

      const evaluationData = {
        id: evalDocId,
        teamId: teamData.id,
        teamName: teamData.name || teamData.id,
        projectId: teamData.project?.id || teamData.projectId || '',
        projectName: teamData.project?.title || teamData.projectTitle || '',
        reviewCycle: selectedCycle,
        reviewCycleId: cycleConfig?.id || selectedCycle,
        reviewerAssignmentId: activeAssignment?.id || '',
        rubricId: activeRubric.id || activeRubric.rubricId,
        rubricTitle: activeRubric.title || 'Evaluation Rubric',
        rubricVersion: activeRubric.version || '1.0',
        evaluatorId: currentUser.uid,
        evaluatorEmployeeId: currentUser.employeeId || currentUser.uid,
        evaluatorName: currentUser.displayName || currentUser.email,
        role: evalRole,
        marks: sanitizedMarks,
        remarks,
        attendance,
        studentTotals,
        teamAverage: teamAvg,
        status: 'Locked',
        updatedAt: now,
        evaluatedAt: now,
        submittedAt: now,
        createdAt: existingEvaluation?.createdAt || now
      };

      await FirestoreService.set('evaluations', evalDocId, evaluationData);

      // Update matching pending evaluations in Firestore
      try {
        const pendings = await FirestoreService.getAll('pendingEvaluations');
        const cleanTid = String(teamData.id).toLowerCase();
        const matchingPendings = (pendings || []).filter(p => 
          String(p.teamId || '').toLowerCase() === cleanTid &&
          (p.reviewCycle === selectedCycle || p.reviewCycleId === cycleConfig?.id || p.reviewCycleId === selectedCycle)
        );
        for (const p of matchingPendings) {
          await FirestoreService.updateDocument('pendingEvaluations', p.id, {
            status: 'Completed',
            submittedAt: now,
            updatedAt: now
          });
        }
      } catch (pErr) {
        console.warn('Could not update pendingEvaluations in Firestore:', pErr);
      }

      // Create immutable evaluation history
      await FirestoreService.createDocument('evaluationHistory', {
        ...evaluationData,
        evaluationId: evalDocId,
        timestamp: now,
        action: 'Submitted and Locked'
      });

      // Audit log & notification
      await FirestoreService.createDocument('auditLogs', {
        user: currentUser.uid,
        role: userRole,
        teamId: teamData.id,
        reviewCycle: selectedCycle,
        timestamp: now,
        action: 'Evaluation Submitted',
        previousValue: existingEvaluation ? 'Updated' : 'Created',
        newValue: 'Locked'
      });

      setShowPreviewModal(false);
      alert('Evaluation submitted successfully and locked.');
      const targetPath = userRole === 'classroom_faculty' ? 'faculty' : userRole;
      navigate(`/${targetPath}/dashboard`);

    } catch (err) {
      console.error(err);
      alert('Failed to submit evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!activeRubric || !teamData) return;
    setIsSubmitting(true);
    try {
      let totalMarks = 0;
      const studentTotals = {};
      const sanitizedMarks = {};

      teamData.members.forEach(student => {
        let stuTotal = 0;
        const isAbsent = attendance[student.id] === 'Absent';
        activeCriteria.forEach(c => {
          const rawVal = marks[`${student.id}_${c.id}`];
          if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
            const numVal = isAbsent ? 0 : (Number(rawVal) || 0);
            sanitizedMarks[`${student.id}_${c.id}`] = numVal;
            stuTotal += numVal;
          }
        });
        studentTotals[student.id] = stuTotal;
        totalMarks += stuTotal;
      });

      const teamAvg = Math.round(totalMarks / (teamData.members.length || 1));

      const now = new Date().toISOString();
      const evalRole = (userRole === 'classroom_faculty' || userRole === 'faculty') ? 'faculty' : userRole;
      const cleanCycle = String(selectedCycle).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const cleanTeam = String(teamData.id).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const evalDocId = existingEvaluation?.id || `eval_${cleanCycle}_${cleanTeam}_${evalRole}`;

      const evaluationData = {
        id: evalDocId,
        teamId: teamData.id,
        teamName: teamData.name || teamData.id,
        projectId: teamData.project?.id || teamData.projectId || '',
        projectName: teamData.project?.title || teamData.projectTitle || '',
        reviewCycle: selectedCycle,
        reviewCycleId: cycleConfig?.id || selectedCycle,
        reviewerAssignmentId: activeAssignment?.id || '',
        rubricId: activeRubric.id || activeRubric.rubricId,
        rubricTitle: activeRubric.title || 'Evaluation Rubric',
        rubricVersion: activeRubric.version || '1.0',
        evaluatorId: currentUser.uid,
        evaluatorEmployeeId: currentUser.employeeId || currentUser.uid,
        evaluatorName: currentUser.displayName || currentUser.email,
        role: evalRole,
        marks: sanitizedMarks,
        remarks,
        attendance,
        studentTotals,
        teamAverage: teamAvg,
        status: 'Draft',
        updatedAt: now,
        evaluatedAt: now,
        createdAt: existingEvaluation?.createdAt || now
      };

      await FirestoreService.set('evaluations', evalDocId, evaluationData);

      await FirestoreService.createDocument('auditLogs', {
        user: currentUser.uid,
        role: userRole,
        teamId: teamData.id,
        reviewCycle: selectedCycle,
        timestamp: now,
        action: 'Evaluation Draft Saved',
        previousValue: existingEvaluation ? existingEvaluation.status : 'None',
        newValue: 'Draft'
      });

      alert('Draft evaluation saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = async () => {
    if (!existingEvaluation || userRole !== 'admin') return;
    try {
      await FirestoreService.updateDocument('evaluations', existingEvaluation.id, {
        status: 'Draft',
        updatedAt: new Date().toISOString()
      });
      alert('Evaluation unlocked successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to unlock evaluation.');
    }
  };

  if (dataLoading || (!teamData && (!teams || teams.length === 0) && !directTeam)) {
    return (
      <DashboardLayout navigationItems={navItems} title="Evaluation Workspace">
        <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      </DashboardLayout>
    );
  }

  if (!teamId) {
    return (
      <DashboardLayout navigationItems={navItems} title="Select Team for Evaluation">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card title="Select Team to Evaluate" icon={ShieldCheck}>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Choose a team from your assigned list</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 border bg-white"
                value={teamSelection}
                onChange={(e) => {
                  setTeamSelection(e.target.value);
                  if (e.target.value) {
                    const basePath = location.pathname;
                    navigate(`${basePath}/${e.target.value}`);
                  }
                }}
              >
                <option value="">-- Select Team --</option>
                {availableTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.id} - {projects?.find(p => p.id === t.projectId)?.title || 'No Project'}</option>
                ))}
              </select>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!teamData) {
    return (
      <DashboardLayout navigationItems={navItems} title="Evaluation Workspace">
        <div className="p-6 text-center text-gray-500">Team not found or you don't have access.</div>
      </DashboardLayout>
    );
  }

  const isLocked = existingEvaluation?.status === 'Locked' || cycleConfig?.status === 'Closed' || cycleConfig?.status === 'Archived' || (!activeWindowStatus.isAvailable && userRole !== 'admin');

  return (
    <DashboardLayout navigationItems={navItems} title="Evaluation Workspace">
      <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">

        {!activeWindowStatus.isAvailable && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">{activeWindowStatus.statusLabel}: </span>
              {activeWindowStatus.message} Evaluator submissions are currently read-only.
            </div>
          </div>
        )}

        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="px-2">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{teamData.id}</h1>
                <Badge variant="primary">{userRole.toUpperCase()}</Badge>
                {isLocked && <Badge variant="success" className="flex items-center gap-1"><Lock className="w-3 h-3"/> Locked</Badge>}
              </div>
              <p className="text-sm text-gray-500 mt-1">{teamData.project?.title || 'No Project Assigned'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white font-semibold text-gray-800"
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              disabled={isLocked || userRole !== 'admin'}
            >
              {reviewCycles?.map(rc => (
                <option key={rc.id} value={rc.reviewName}>{rc.reviewName}</option>
              ))}
            </select>

            {isLocked && userRole === 'admin' && (
              <Button onClick={handleUnlock} variant="outline" className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                <Unlock className="w-4 h-4"/> Admin Unlock
              </Button>
            )}

            {!isLocked && (
              <Button onClick={handleSaveDraft} variant="outline" disabled={isSubmitting || !activeRubric} className="flex items-center gap-2">
                <Save className="w-4 h-4"/> Save Draft
              </Button>
            )}

            <Button onClick={handleOpenPreview} disabled={isLocked || isSubmitting || !activeRubric} className="flex items-center gap-2">
              {isSubmitting ? 'Submitting...' : (isLocked ? 'Locked' : <><Eye className="w-4 h-4"/> Preview & Submit</>)}
            </Button>
          </div>
        </div>

        {/* Rule 5 Requirement: If no published rubric, show exact required message */}
        {!activeRubric ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-xl flex items-start gap-4 shadow-sm">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base text-amber-900">
                No published rubric is configured for this review cycle.
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                An Admin must configure and publish a rubric for <strong>{selectedCycle}</strong> in the Rubrics Engine before evaluators can enter marks.
              </p>
            </div>
          </div>
        ) : (
          <>
            {activePendingEvaluations.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                This team has active Pending Evaluations that must be completed.
              </div>
            )}

            {/* Attendance Section */}
            <Card title={`Attendance — ${selectedCycle}`} icon={CheckCircle2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {teamData.members.map(student => (
                  <div key={student.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{student.rollNumber || student.id}</p>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm text-xs font-semibold p-2 border bg-white"
                      value={attendance[student.id] || 'Present'}
                      onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                      disabled={isLocked}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                ))}
              </div>
            </Card>

            {/* Rubric Marks Entry Table */}
            <Card title={`Rubric Marks Entry — ${activeRubric.title} (v${activeRubric.version})`} icon={ShieldCheck} className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-48">
                      Student
                    </th>
                    {activeCriteria.map(c => (
                      <th key={c.id || c.criterionId} className="px-3 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[150px]">
                        <div className="font-bold text-gray-900">{c.title}</div>
                        <div className="text-primary-600 font-extrabold text-[11px] mt-0.5">Max: {c.maximumMarks} Marks</div>
                        {c.description && (
                          <div className="text-[10px] font-normal text-gray-500 mt-1 normal-case line-clamp-2" title={c.description}>
                            {c.description}
                          </div>
                        )}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamData.members.map(student => {
                    let studentTotal = 0;
                    const isAbsent = attendance[student.id] === 'Absent';
                    return (
                      <tr key={student.id} className={isAbsent ? 'opacity-50 bg-red-50/20' : ''}>
                        <td className="px-3 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100">
                          <div className="text-sm font-bold text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.rollNumber || student.id}</div>
                          {isAbsent && <Badge variant="danger" className="text-[10px] mt-1">Absent</Badge>}
                        </td>
                        {activeCriteria.map(c => {
                          const markKey = `${student.id}_${c.id}`;
                          const rawVal = marks[markKey];
                          const displayVal = isAbsent ? 0 : (rawVal === undefined || rawVal === null ? '' : rawVal);
                          const numVal = isAbsent ? 0 : (Number(rawVal) || 0);
                          studentTotal += numVal;
                          const err = markErrors[markKey];

                          return (
                            <td key={c.id || c.criterionId} className="px-3 py-4 whitespace-nowrap text-center">
                              <Input
                                type="number"
                                min={0}
                                max={c.maximumMarks}
                                className={`w-20 text-center mx-auto font-bold ${err ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : ''}`}
                                value={displayVal}
                                onChange={(e) => handleMarkChange(student.id, c.id, e.target.value)}
                                disabled={isLocked || isAbsent}
                                placeholder="0"
                              />
                              {err && <div className="text-[10px] text-red-600 font-bold mt-1">{err}</div>}
                            </td>
                          );
                        })}
                        <td className="px-3 py-4 whitespace-nowrap text-center font-black text-lg text-primary-700 bg-gray-50">
                          {studentTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* Remarks Section */}
            <Card title="Remarks & Feedback" icon={CheckCircle2}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strengths Observed</label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white min-h-[80px]"
                    value={remarks.strengths || ''}
                    onChange={(e) => setRemarks({...remarks, strengths: e.target.value})}
                    disabled={isLocked}
                    placeholder="Key project strengths and positive achievements..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement</label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white min-h-[80px]"
                    value={remarks.weaknesses || ''}
                    onChange={(e) => setRemarks({...remarks, weaknesses: e.target.value})}
                    disabled={isLocked}
                    placeholder="Specific areas where the team should improve..."
                  />
                </div>
              </div>
            </Card>

            {/* Evaluator Panel Summary: Role Isolation Read-Only Visibility */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Evaluator Panel Summary ({selectedCycle})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { roleKey: 'guide', roleTitle: 'Guide Evaluation', evalObj: allEvaluationsForCycle.find(e => e.role === 'guide') },
                  { roleKey: 'faculty', roleTitle: 'Classroom Faculty Evaluation', evalObj: allEvaluationsForCycle.find(e => e.role === 'faculty' || e.role === 'classroom_faculty') },
                  { roleKey: 'reviewer', roleTitle: 'Reviewer Evaluation', evalObj: allEvaluationsForCycle.find(e => e.role === 'reviewer') }
                ].map(({ roleKey, roleTitle, evalObj }) => {
                  const isCurrentRole = (userRole === 'classroom_faculty' || userRole === 'faculty') ? roleKey === 'faculty' : userRole === roleKey;
                  return (
                    <div key={roleKey} className={`border rounded-lg p-4 ${isCurrentRole ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{roleTitle}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{evalObj?.evaluatorName || (isCurrentRole ? (currentUser?.displayName || currentUser?.email) : 'Unassigned')}</p>
                        </div>
                        <Badge variant={evalObj ? (evalObj.status === 'Locked' ? 'success' : 'primary') : 'secondary'}>
                          {evalObj ? (evalObj.status || 'Submitted') : 'PENDING'}
                        </Badge>
                      </div>

                      <div className="text-2xl font-black text-gray-900 mt-2">
                        {evalObj && evalObj.teamAverage !== undefined && evalObj.teamAverage !== null
                          ? `${evalObj.teamAverage} / 100`
                          : <span className="text-sm font-bold text-amber-600 italic">PENDING</span>
                        }
                      </div>

                      {evalObj?.remarks && (
                        <div className="text-xs text-gray-600 mt-3 pt-2 border-t border-gray-200/80 space-y-1">
                          {evalObj.remarks.strengths && <p><span className="font-bold">Strengths:</span> {evalObj.remarks.strengths}</p>}
                          {evalObj.remarks.weaknesses && <p><span className="font-bold">Improvement:</span> {evalObj.remarks.weaknesses}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Pre-Submission Preview Modal */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Pre-Submission Evaluation Review"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6 text-sm font-sans p-1">
            <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{teamData.id}</span>
                  <Badge variant="primary">{userRole.toUpperCase()}</Badge>
                  <Badge variant="secondary">{selectedCycle}</Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1">{teamData.project?.title || 'No Project Title'}</p>
              </div>
              <div className="text-xs text-slate-300 sm:text-right">
                <p className="font-medium">Evaluator: <span className="font-bold text-white">{currentUser?.displayName || currentUser?.email}</span></p>
                <p className="text-[11px] text-slate-400 mt-0.5">{new Date().toLocaleString()}</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-100 px-4 py-2 border-b font-bold text-gray-800 text-xs uppercase tracking-wider flex justify-between items-center">
                <span>Student Score Breakdown</span>
                <span className="text-primary-700 font-extrabold">Rubric Max: {previewStats.maxPossibleStudent} Marks</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Attendance</th>
                      {activeCriteria.map(c => (
                        <th key={c.id} className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase min-w-[100px]">
                          {c.title} ({c.maximumMarks})
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase bg-gray-100">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-xs">
                    {teamData.members.map(student => {
                      const isAbsent = attendance[student.id] === 'Absent';
                      const stuTotal = previewStats.studentTotals[student.id] || 0;
                      return (
                        <tr key={student.id} className={isAbsent ? 'bg-red-50/50' : ''}>
                          <td className="px-3 py-3 font-medium text-gray-900">
                            <div>{student.name}</div>
                            <div className="text-[10px] text-gray-500">{student.rollNumber || student.id}</div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Badge variant={isAbsent ? 'danger' : 'success'}>
                              {isAbsent ? 'Absent' : 'Present'}
                            </Badge>
                          </td>
                          {activeCriteria.map(c => {
                            const val = isAbsent ? 0 : (marks[`${student.id}_${c.id}`] || 0);
                            return (
                              <td key={c.id} className="px-3 py-3 text-center font-semibold text-gray-700">
                                {val} / {c.maximumMarks}
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center font-bold text-sm text-primary-700 bg-gray-50">
                            {stuTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg border text-center">
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Total Students</span>
                <span className="text-lg font-bold text-gray-900">{teamData.members.length}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-center">
                <span className="text-[11px] font-semibold text-emerald-700 block uppercase">Present</span>
                <span className="text-lg font-bold text-emerald-800">{previewStats.presentCount}</span>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                <span className="text-[11px] font-semibold text-red-700 block uppercase">Absent</span>
                <span className="text-lg font-bold text-red-800">{previewStats.absentCount}</span>
              </div>
              <div className="bg-primary-50 p-3 rounded-lg border border-primary-200 text-center">
                <span className="text-[11px] font-semibold text-primary-700 block uppercase">Team Average</span>
                <span className="text-lg font-bold text-primary-800">{previewStats.teamAvg}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
              <p className="font-bold text-gray-900 uppercase">Remarks & Feedback</p>
              <p><span className="font-semibold text-gray-700">Strengths:</span> {remarks.strengths || 'N/A'}</p>
              <p><span className="font-semibold text-gray-700">Areas for Improvement:</span> {remarks.weaknesses || 'N/A'}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-900 text-xs shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Submission Confirmation Notice</p>
                <p className="mt-0.5">
                  You are about to submit the evaluation for Team <strong>{teamData.id}</strong> ({selectedCycle}). Once submitted, your evaluation will become <strong>LOCKED</strong> and cannot be modified.
                </p>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(false)}
                disabled={isSubmitting}
              >
                Back to Edit
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Locking Evaluation...' : <><ShieldCheck className="w-4 h-4"/> Confirm & Lock Submission</>}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default EvaluationWorkspace;
