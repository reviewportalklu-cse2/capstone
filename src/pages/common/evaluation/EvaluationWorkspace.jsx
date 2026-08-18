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
import { resolveTeamRelations, resolveStudentRelations, getEntityKeys } from '@/utils/relationshipResolver';

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
  const [remarks, setRemarks] = useState({});
  const [attendance, setAttendance] = useState({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine which navigation to use
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

  // If no teamId, render team selector
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

  const teamData = useMemo(() => {
    if (!teamId || !teams) return null;
    const t = teams.find(x => String(x.id || x.teamId).toLowerCase() === String(teamId).toLowerCase());
    if (!t) return null;
    const rel = resolveTeamRelations(t, { students, projects, guides, faculty: facultyList, reviewers, reviewCycles, reviewerAssignments, guideAssignments, facultyAssignments });
    
    const teamMembers = students?.filter(s => {
      const sRel = resolveStudentRelations(s, { teams, projects, guides, faculty: facultyList, reviewers, reviewCycles, reviewerAssignments });
      return String(sRel.teamId).toLowerCase() === String(rel.teamId).toLowerCase();
    }) || [];

    return {
      ...rel,
      project: projects?.find(p => String(p.id || p.projectId).toLowerCase() === String(rel.projectId).toLowerCase()) || { title: rel.projectTitle },
      members: teamMembers,
      guide: rel.guideObj || (rel.guideId ? getGuideById(rel.guideId) : null),
      faculty: rel.facultyObj || (rel.facultyId ? getFacultyById(rel.facultyId) : null),
      reviewer: rel.reviewerObj || (rel.reviewerId ? getReviewerById(rel.reviewerId) : null),
    };
  }, [teamId, teams, projects, students, facultyList, guides, reviewers, reviewCycles, reviewerAssignments, guideAssignments, facultyAssignments, getGuideById, getFacultyById, getReviewerById]);

  const activeRubric = useMemo(() => {
    if (!rubrics || rubrics.length === 0) return null;
    const cycleName = (selectedCycle || activeCycle?.name || activeCycle?.reviewName || 'Review 1').trim().toLowerCase();
    const cycleId = (activeCycle?.id || activeCycle?.reviewCycleId || activeCycle?.cycleId || '').trim().toLowerCase();

    const matchesCycle = (r) => {
      const rCycleName = String(r.reviewCycle || r.reviewCycleName || '').trim().toLowerCase();
      const rCycleId = String(r.reviewCycleId || r.cycleId || r.id || '').trim().toLowerCase();
      return (rCycleName && rCycleName === cycleName) || (cycleId && rCycleId === cycleId);
    };

    const publishedMatch = rubrics.find(r => matchesCycle(r) && (r.status === 'Published' || r.status === 'Active'));
    if (publishedMatch) return publishedMatch;

    const anyMatch = rubrics.find(r => matchesCycle(r));
    if (anyMatch) return anyMatch;

    // Fall back to any published rubric, or null (do not fall back to unmatching draft rubrics)
    return rubrics.find(r => r.status === 'Published' || r.status === 'Active') || null;
  }, [rubrics, selectedCycle, activeCycle]);

  const cycleConfig = useMemo(() => {
    return reviewCycles?.find(c => c.reviewName === selectedCycle || c.name === selectedCycle || c.id === selectedCycle);
  }, [reviewCycles, selectedCycle]);

  const activeAssignment = useMemo(() => {
    if (!cycleConfig || !teamId || userRole !== 'reviewer') return null;
    return reviewerAssignments?.find(a => String(a.teamId).toLowerCase() === String(teamId).toLowerCase() && (a.reviewCycleId === cycleConfig.id || a.status === 'Active'));
  }, [cycleConfig, teamId, userRole, reviewerAssignments]);

  const activeCriteria = useMemo(() => {
    if (!activeRubric || !rubricCriteria) return [];
    return rubricCriteria.filter(c => String(c.rubricId).toLowerCase() === String(activeRubric.id || activeRubric.rubricId).toLowerCase()).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [activeRubric, rubricCriteria]);

  const existingEvaluation = useMemo(() => {
    if (!evaluations || !teamId) return null;
    const evalRole = (userRole === 'classroom_faculty' || userRole === 'faculty') ? 'faculty' : userRole;
    return evaluations.find(e => 
      String(e.teamId || e.team).toLowerCase() === String(teamId).toLowerCase() && 
      (e.reviewCycle === selectedCycle || e.reviewCycleId === activeCycle?.id) && 
      (e.role === evalRole || e.evaluatorId === currentUser?.uid)
    );
  }, [evaluations, teamId, selectedCycle, activeCycle, userRole, currentUser]);
  
  const allEvaluationsForCycle = useMemo(() => {
    if (!evaluations || !teamId) return [];
    return evaluations.filter(e => String(e.teamId || e.team).toLowerCase() === String(teamId).toLowerCase() && (e.reviewCycle === selectedCycle || e.reviewCycleId === activeCycle?.id));
  }, [evaluations, teamId, selectedCycle, activeCycle]);

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
      // Init attendance to Present
      const initAtt = {};
      teamData.members.forEach(m => { initAtt[m.id] = 'Present'; });
      setAttendance(initAtt);
    }
  }, [existingEvaluation, teamData]);

  const handleMarkChange = (studentId, criterionId, value) => {
    const rawVal = Number(value);
    const criterion = activeCriteria.find(c => String(c.id) === String(criterionId));
    const max = criterion ? (Number(criterion.maximumMarks) || 100) : 100;
    const clamped = Math.max(0, Math.min(max, isNaN(rawVal) ? 0 : rawVal));

    setMarks(prev => ({
      ...prev,
      [`${studentId}_${criterionId}`]: clamped
    }));
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      
      // Calculate totals
      let totalMarks = 0;
      const studentTotals = {};
      
      teamData.members.forEach(student => {
        let stuTotal = 0;
        activeCriteria.forEach(c => {
          stuTotal += (marks[`${student.id}_${c.id}`] || 0);
        });
        studentTotals[student.id] = stuTotal;
        totalMarks += stuTotal;
      });
      
      const teamAvg = Math.round(totalMarks / (teamData.members.length || 1));

      const now = new Date().toISOString();
      const evalRole = (userRole === 'classroom_faculty' || userRole === 'faculty') ? 'faculty' : userRole;
      const evalDocId = existingEvaluation?.id || `eval_${String(selectedCycle).toLowerCase().replace(/\s+/g, '-')}_${String(teamData.id).toLowerCase()}_${evalRole}`;

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
        evaluatorName: currentUser.displayName || currentUser.email,
        role: evalRole,
        marks,
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
      
      // Create immutable history
      await FirestoreService.createDocument('evaluationHistory', {
        ...evaluationData,
        evaluationId: evaluationData.id || existingEvaluation?.id,
        timestamp: new Date().toISOString(),
        action: 'Submitted and Locked'
      });
      
      // Audit Log & Notification for Submit
      await FirestoreService.createDocument('auditLogs', {
        user: currentUser.uid,
        role: userRole,
        teamId: teamData.id,
        reviewCycle: selectedCycle,
        timestamp: new Date().toISOString(),
        action: 'Evaluation Submitted',
        previousValue: existingEvaluation ? 'Updated' : 'Created',
        newValue: 'Locked'
      });
      
      await FirestoreService.createDocument('notifications', {
        title: 'Evaluation Submitted',
        message: `${userRole.toUpperCase()} has submitted the evaluation for team ${teamData.id} (${selectedCycle}).`,
        targetRole: 'admin',
        targetTeam: teamData.id,
        createdAt: new Date().toISOString(),
        read: false
      });
      
      // Create pending evaluations for absent students
      Object.entries(attendance).forEach(async ([stuId, status]) => {
        if (status === 'Absent') {
          await FirestoreService.createDocument('pendingEvaluations', {
            teamId: teamData.id,
            studentId: stuId,
            reviewCycle: selectedCycle,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Pending',
            createdAt: new Date().toISOString()
          });
          
          await FirestoreService.createDocument('auditLogs', {
            user: currentUser.uid,
            role: userRole,
            teamId: teamData.id,
            reviewCycle: selectedCycle,
            timestamp: new Date().toISOString(),
            action: 'Pending Evaluation Created',
            previousValue: 'None',
            newValue: `Absent: ${stuId}`
          });
        }
      });
      
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
      
      teamData.members.forEach(student => {
        let stuTotal = 0;
        activeCriteria.forEach(c => {
          stuTotal += (marks[`${student.id}_${c.id}`] || 0);
        });
        studentTotals[student.id] = stuTotal;
        totalMarks += stuTotal;
      });
      
      const teamAvg = Math.round(totalMarks / (teamData.members.length || 1));

      const now = new Date().toISOString();
      const evalRole = (userRole === 'classroom_faculty' || userRole === 'faculty') ? 'faculty' : userRole;
      const evalDocId = existingEvaluation?.id || `eval_${String(selectedCycle).toLowerCase().replace(/\s+/g, '-')}_${String(teamData.id).toLowerCase()}_${evalRole}`;

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
        evaluatorName: currentUser.displayName || currentUser.email,
        role: evalRole,
        marks,
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
        timestamp: new Date().toISOString(),
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
      
      await FirestoreService.createDocument('auditLogs', {
        evaluationId: existingEvaluation.id,
        user: currentUser.uid,
        adminId: currentUser.uid,
        adminName: currentUser.displayName || currentUser.email,
        role: userRole,
        teamId: teamData.id,
        reviewCycle: selectedCycle,
        timestamp: new Date().toISOString(),
        action: 'UNLOCK_EVALUATION',
        previousStatus: 'Locked',
        newStatus: 'Draft',
        previousValue: 'Locked',
        newValue: 'Draft'
      });
      
      await FirestoreService.createDocument('notifications', {
        title: 'Evaluation Unlocked',
        message: `Admin has unlocked your evaluation for team ${teamData.id} (${selectedCycle}).`,
        targetRole: existingEvaluation.role,
        targetTeam: teamData.id,
        createdAt: new Date().toISOString(),
        read: false
      });
      
      alert('Evaluation unlocked successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to unlock evaluation.');
    }
  };
  if (dataLoading) {
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
                    // Navigate relative to current path
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

  const isLocked = existingEvaluation?.status === 'Locked' || cycleConfig?.status === 'Closed' || cycleConfig?.status === 'Archived';

  return (
    <DashboardLayout navigationItems={navItems} title="Evaluation Workspace">
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
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
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white"
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
            
            <Button onClick={handleSubmit} disabled={isLocked || isSubmitting || !activeRubric} className="flex items-center gap-2">
              {isSubmitting ? 'Submitting...' : (isLocked ? 'Locked' : <><Save className="w-4 h-4"/> Submit Evaluation</>)}
            </Button>
          </div>
        </div>

        {!activeRubric ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            No published rubric found for {selectedCycle}. Please contact administrator.
          </div>
        ) : (
          <>
            {activePendingEvaluations.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                This team has active Pending Evaluations that must be completed before the current review cycle can be closed.
              </div>
            )}
            
            <Card title={`Attendance - ${selectedCycle}`} icon={CheckCircle2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {teamData.members.map(student => (
                  <div key={student.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="font-bold text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{student.rollNumber || student.id}</p>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm text-sm p-1.5 border bg-white"
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

            <Card title={`Marks Entry - ${activeRubric.title} (v${activeRubric.version})`} icon={ShieldCheck} className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-48">Student</th>
                    {activeCriteria.map(c => (
                      <th key={c.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        <div title={c.description}>{c.title}</div>
                        <div className="text-primary-600 font-bold">Max: {c.maximumMarks}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider bg-gray-100">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamData.members.map(student => {
                    let studentTotal = 0;
                    return (
                      <tr key={student.id} className={attendance[student.id] === 'Absent' ? 'opacity-50 bg-gray-50' : ''}>
                        <td className="px-3 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.rollNumber || student.id}</div>
                          {attendance[student.id] === 'Absent' && <Badge variant="danger" className="text-[10px] mt-1">Absent</Badge>}
                        </td>
                        {activeCriteria.map(c => {
                          const val = marks[`${student.id}_${c.id}`] || 0;
                          studentTotal += val;
                          return (
                            <td key={c.id} className="px-3 py-4 whitespace-nowrap text-center">
                              <Input
                                type="number"
                                min={0}
                                max={c.maximumMarks}
                                className="w-20 text-center mx-auto"
                                value={val}
                                onChange={(e) => handleMarkChange(student.id, c.id, e.target.value)}
                                disabled={isLocked || attendance[student.id] === 'Absent'}
                              />
                            </td>
                          );
                        })}
                        <td className="px-3 py-4 whitespace-nowrap text-center font-bold text-lg text-primary-700 bg-gray-50">
                          {studentTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <Card title="Remarks & Feedback" icon={CheckCircle2}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strengths</label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white min-h-[80px]"
                    value={remarks.strengths || ''}
                    onChange={(e) => setRemarks({...remarks, strengths: e.target.value})}
                    disabled={isLocked}
                    placeholder="Team strengths observed during evaluation..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement</label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white min-h-[80px]"
                    value={remarks.weaknesses || ''}
                    onChange={(e) => setRemarks({...remarks, weaknesses: e.target.value})}
                    disabled={isLocked}
                    placeholder="Areas where the team needs to focus..."
                  />
                </div>
              </div>
            </Card>
            
            {/* Read-Only Visibility of other evaluators */}
            {allEvaluationsForCycle.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Other Evaluators ({selectedCycle})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allEvaluationsForCycle.filter(e => e.evaluatorId !== currentUser.uid).map(e => (
                    <div key={e.id} className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{e.evaluatorName}</p>
                          <Badge variant="primary" className="mt-1">{e.role.toUpperCase()}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Team Avg</p>
                          <p className="text-xl font-bold text-primary-600">{e.teamAverage}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        <p><span className="font-medium">Strengths:</span> {e.remarks?.strengths || 'N/A'}</p>
                        <p className="mt-1"><span className="font-medium">Improvement:</span> {e.remarks?.weaknesses || 'N/A'}</p>
                      </div>
                      <div className="mt-4 border-t border-gray-200 pt-3">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Detailed Marks</p>
                        <div className="space-y-2">
                          {teamData.members.map(student => (
                            <div key={student.id} className="text-xs flex flex-col gap-1 border-b border-gray-100 pb-2">
                              <span className="font-medium text-gray-800">{student.name}</span>
                              <div className="flex flex-wrap gap-2">
                                {activeCriteria.map(c => (
                                  <span key={c.id} className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    {c.title}: <span className="font-bold text-gray-900">{e.marks[`${student.id}_${c.id}`] || 0}</span>/{c.maximumMarks}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EvaluationWorkspace;
