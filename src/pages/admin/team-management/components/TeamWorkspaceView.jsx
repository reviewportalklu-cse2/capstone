import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { 
  Users, UserCheck, GraduationCap, UserCog, BookOpen, 
  BarChart3, Calendar, Clock, Activity, Download, Edit2, 
  ExternalLink, FolderGit2, HardDrive, CheckCircle2, AlertTriangle, 
  MessageSquare, Shield, Zap, RefreshCw, FileText, ChevronRight, Eye, ArrowLeft
} from 'lucide-react';
import { generateTeamPDF } from '@/utils/teamPdfExport';
import { adminService } from '@/firebase/services/adminService';
import { auditService } from '@/firebase/services/auditService';
import { useAuth } from '@/contexts/AuthContext';

export const TeamWorkspaceView = ({ team, contextData = {}, onRefresh }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    guides = [], 
    faculty = [], 
    reviewers = [], 
    reviewCycles = [],
    rubrics = [],
    rubricCriteria = [],
    evaluations = [], 
    remarks = [], 
    attendance = [], 
    notifications = [],
    auditLogs = []
  } = contextData;

  const [reassignModal, setReassignModal] = useState({ open: false, type: '', currentId: '' });
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!team) return null;

  // Realtime Data Derivation from Context
  const teamId = team.teamId || team.id;
  const cleanTeamId = String(teamId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const teamEvaluations = evaluations.filter(e => {
    const eTeamId = String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return eTeamId === cleanTeamId;
  }).sort((a, b) => new Date(b.submittedAt || b.updatedAt || b.createdAt || 0) - new Date(a.submittedAt || a.updatedAt || a.createdAt || 0));

  const teamRemarks = remarks.filter(r => String(r.teamId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTeamId);
  const teamNotifications = notifications.filter(n => String(n.teamId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTeamId);
  const teamAuditLogs = auditLogs.filter(l => String(l.teamId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTeamId);

  // Helper for real database-driven student attendance
  const getStudentAttendanceDetails = (studentId) => {
    let presentCount = 0;
    let absentCount = 0;
    let latestStatus = null;

    teamEvaluations.forEach(e => {
      if (e.attendance && e.attendance[studentId]) {
        const st = e.attendance[studentId];
        if (!latestStatus) latestStatus = st;
        if (st === 'Present') presentCount++;
        if (st === 'Absent') absentCount++;
      }
    });

    const rawAttendance = attendance.filter(a => a.studentId === studentId || a.student === studentId);
    rawAttendance.forEach(a => {
      const st = a.status || a.attendance;
      if (st === 'Present') presentCount++;
      if (st === 'Absent') absentCount++;
      if (!latestStatus) latestStatus = st;
    });

    const totalCount = presentCount + absentCount;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null;

    return {
      presentCount,
      absentCount,
      totalCount,
      percentage,
      latestStatus: latestStatus || 'Not Evaluated'
    };
  };

  // Derive Scores & Health
  const calculatedAvg = teamEvaluations.length > 0
    ? Math.round(teamEvaluations.reduce((sum, e) => sum + (e.teamAverage || e.totalScore || 0), 0) / teamEvaluations.length)
    : 0;
  const avgMarks = team.avgMarks || calculatedAvg;

  const healthStatus = (teamEvaluations.length === 0 && !team.avgMarks)
    ? { label: 'Not Evaluated', variant: 'secondary', bg: 'bg-gray-100 text-gray-700 border-gray-300 font-extrabold' }
    : avgMarks >= 75
    ? { label: 'Healthy', variant: 'success', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold' } 
    : avgMarks >= 50 
    ? { label: 'Attention Required', variant: 'warning', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold' } 
    : { label: 'Critical Performance', variant: 'danger', bg: 'bg-red-100 text-red-900 border-red-300 font-extrabold' };

  // Reassignment Action
  const handleOpenReassign = (type, currentId) => {
    setReassignModal({ open: true, type, currentId });
    setSelectedStaffId(currentId || '');
  };

  const handleExecuteReassign = async () => {
    if (!selectedStaffId) return;
    setIsSubmitting(true);
    try {
      const payload = {};
      if (reassignModal.type === 'guide') payload.guideId = selectedStaffId;
      if (reassignModal.type === 'faculty') payload.facultyId = selectedStaffId;
      if (reassignModal.type === 'reviewer') payload.reviewerId = selectedStaffId;

      await adminService.assignTeam(teamId, payload);
      await auditService.log(
        currentUser?.uid || 'admin',
        `REASSIGN_${reassignModal.type.toUpperCase()}`,
        'teams',
        teamId,
        { previous: reassignModal.currentId, newId: selectedStaffId }
      );

      if (onRefresh) onRefresh();
      setReassignModal({ open: false, type: '', currentId: '' });
    } catch (err) {
      console.error("Reassignment failed:", err);
      alert("Reassignment failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full font-sans space-y-8 pb-16">
      
      {/* 360° Full-Page Hero Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-primary-600/30 text-primary-200 border border-primary-400/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Team Workspace: {teamId}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full border ${healthStatus.bg}`}>
                Health: {healthStatus.label} ({avgMarks}%)
              </span>
              <span className="bg-white/10 text-slate-200 border border-white/15 text-xs font-semibold px-3 py-1 rounded-full">
                Batch {team.batch || 'CSE-2026'} • Section {team.section || 'A'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {team.projectTitle || team.project?.title || 'Capstone Team Workspace'}
            </h1>
            <p className="text-sm text-slate-300">
              Department of {team.department || 'Computer Science & Engineering'} • KL University
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => generateTeamPDF(team)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-sm shadow-md"
            >
              <Download className="w-4 h-4 mr-2" /> Export Team PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/teams')}
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Team Browser
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Shortcuts Bar */}
      <Card title={<div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm uppercase tracking-wider"><Zap className="w-5 h-5 text-amber-500" /> Enterprise Quick Actions Bar</div>}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Button onClick={() => navigate('/admin/reviews')} className="bg-primary-600 hover:bg-primary-700 text-white font-bold justify-center py-2.5 text-xs">
            Open Evaluation
          </Button>
          <Button onClick={() => handleOpenReassign('reviewer', team.reviewerId)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold justify-center py-2.5 text-xs">
            Change Reviewer
          </Button>
          <Button variant="outline" onClick={() => generateTeamPDF(team)} className="justify-center border-slate-300 text-slate-700 font-bold py-2.5 text-xs hover:bg-slate-50">
            Export Team PDF
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/rubrics')} className="justify-center border-slate-300 text-slate-700 font-bold py-2.5 text-xs hover:bg-slate-50">
            View Rubrics
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/projects')} className="justify-center border-slate-300 text-slate-700 font-bold py-2.5 text-xs hover:bg-slate-50">
            View Project
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/students')} className="justify-center border-slate-300 text-slate-700 font-bold py-2.5 text-xs hover:bg-slate-50">
            View Students
          </Button>
        </div>
      </Card>

      {/* Spacious Full-Page Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Overview, Students, Project (6 Cols on lg) */}
        <div className="lg:col-span-6 space-y-8">

          {/* PANEL 1 – Team Overview */}
          <Card title={<div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm uppercase tracking-wider"><Users className="w-5 h-5 text-primary-600" /> Panel 1 – Team Overview & Metadata</div>}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold uppercase text-xs block mb-1">Team ID</span>
                <span className="text-base font-black text-slate-900">{teamId}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold uppercase text-xs block mb-1">Batch & Section</span>
                <span className="text-base font-black text-slate-900">{team.batch || '2026'} (Sec {team.section || 'A'})</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold uppercase text-xs block mb-1">Department</span>
                <span className="text-base font-black text-slate-900">{team.department || 'CSE'}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold uppercase text-xs block mb-1">Status</span>
                <Badge variant={team.status === 'Active' ? 'success' : 'default'} className="text-xs font-bold mt-1">
                  {team.status || 'Active'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* PANEL 2 – Student Members */}
          <Card title={<div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm uppercase tracking-wider"><Users className="w-5 h-5 text-emerald-600" /> Panel 2 – Student Members ({(team.members || team.students || []).length})</div>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-700">
                <thead className="bg-slate-100 uppercase text-xs text-slate-600 font-extrabold border-b">
                  <tr>
                    <th className="p-3">Roll No.</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {(team.members || team.students || []).map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{s.rollNumber || s.rollNo || s.id}</td>
                      <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="p-3 text-slate-500 text-xs">{s.email}</td>
                      <td className="p-3">
                        {(() => {
                          const att = getStudentAttendanceDetails(s.id || s.rollNumber);
                          if (att.totalCount === 0) {
                            return <Badge variant="default" className="text-xs font-semibold">Not Evaluated</Badge>;
                          }
                          return (
                            <Badge variant={att.latestStatus === 'Present' ? 'success' : 'danger'} className="text-xs font-bold">
                              {att.latestStatus} ({att.percentage}%)
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="p-3">
                        <Badge variant="success" className="text-xs font-bold">Active</Badge>
                      </td>
                    </tr>
                  ))}
                  {(!team.members || team.members.length === 0) && (!team.students || team.students.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">No student members linked to this team.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* PANEL 3 – Capstone Project Details */}
          <Card title={<div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm uppercase tracking-wider"><BookOpen className="w-5 h-5 text-indigo-600" /> Panel 3 – Capstone Project Details</div>}>
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-indigo-950 text-base">{team.projectTitle || team.project?.title || 'Project Unassigned'}</h3>
                  <p className="text-slate-500 text-xs mt-1">Project ID: {team.projectId || team.project?.id || 'PRJ-N/A'}</p>
                </div>
                <Badge variant="primary" className="text-xs font-bold px-3 py-1">{team.project?.domain || team.domain || 'Software Engineering'}</Badge>
              </div>

              <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm leading-relaxed">
                {team.project?.description || team.description || 'Comprehensive capstone project focusing on enterprise software architecture, full-stack implementation, real-time analytics, and automated evaluation workflows.'}
              </p>

              <div className="flex items-center gap-4 pt-1">
                <a href={team.project?.githubUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-800 hover:text-slate-950 font-extrabold bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg border border-slate-300 text-xs transition-colors">
                  <FolderGit2 className="w-4 h-4 text-slate-700" /> Repository Link <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a href={team.project?.driveUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-800 hover:text-blue-950 font-extrabold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 text-xs transition-colors">
                  <HardDrive className="w-4 h-4 text-blue-600" /> Documentation Drive <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                </a>
              </div>
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN: Mentors, Marks, Progress, Meetings, Activity (6 Cols on lg) */}
        <div className="lg:col-span-6 space-y-8">

          {/* PANEL 4 – Staff Mentors */}
          <Card title={<div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm uppercase tracking-wider"><Shield className="w-5 h-5 text-primary-600" /> Panel 4 – Assigned Staff Mentors</div>}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              
              {/* Guide */}
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Guide (Fixed)</span>
                  <button onClick={() => handleOpenReassign('guide', team.guideId)} className="text-[11px] font-bold text-primary-600 hover:underline">
                    Change
                  </button>
                </div>
                <p className="font-extrabold text-slate-900 text-sm mt-1">{team.guideName || 'Unassigned'}</p>
                <p className="text-slate-500 text-[11px]">{team.guideObj?.email || 'guide@kluniversity.in'}</p>
              </div>

              {/* Classroom Faculty */}
              <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-purple-800 uppercase block">Faculty (Fixed)</span>
                  <button onClick={() => handleOpenReassign('faculty', team.facultyId)} className="text-[11px] font-bold text-primary-600 hover:underline">
                    Change
                  </button>
                </div>
                <p className="font-extrabold text-slate-900 text-sm mt-1">{team.facultyName || 'Unassigned'}</p>
                <p className="text-slate-500 text-[11px]">{team.facultyObj?.email || 'faculty@kluniversity.in'}</p>
              </div>

              {/* Current Reviewer */}
              <div className="p-3.5 bg-orange-50/70 rounded-xl border border-orange-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-orange-800 uppercase block">Reviewer (Rotating)</span>
                  <button onClick={() => handleOpenReassign('reviewer', team.reviewerId)} className="text-[11px] font-bold text-primary-600 hover:underline">
                    Rotate
                  </button>
                </div>
                <p className="font-extrabold text-slate-900 text-sm mt-1">{team.reviewerName || 'Unassigned'}</p>
                <p className="text-slate-500 text-[11px]">Active Review Cycle</p>
              </div>

            </div>
          </Card>

          {/* PANEL 5 – Marks & Evaluation Summary */}
          <Card title={<div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm uppercase tracking-wider"><BarChart3 className="w-5 h-5 text-amber-600" /> Panel 5 – Evaluation Marks Summary</div>}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200">
                <span className="text-blue-700 font-bold block uppercase text-xs">Guide Marks</span>
                <span className="text-xl font-black text-blue-950 mt-1 block">
                  {team.guideScore !== null && team.guideScore !== undefined ? `${team.guideScore} / 100` : <span className="text-xs font-bold text-slate-400 italic">Not Submitted</span>}
                </span>
              </div>
              <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-200">
                <span className="text-purple-700 font-bold block uppercase text-xs">Faculty Marks</span>
                <span className="text-xl font-black text-purple-950 mt-1 block">
                  {team.facultyScore !== null && team.facultyScore !== undefined ? `${team.facultyScore} / 100` : <span className="text-xs font-bold text-slate-400 italic">Not Submitted</span>}
                </span>
              </div>
              <div className="p-4 bg-orange-50/80 rounded-xl border border-orange-200">
                <span className="text-orange-700 font-bold block uppercase text-xs">Reviewer Marks</span>
                <span className="text-xl font-black text-orange-950 mt-1 block">
                  {team.reviewerScore !== null && team.reviewerScore !== undefined ? `${team.reviewerScore} / 100` : <span className="text-xs font-bold text-slate-400 italic">Not Submitted</span>}
                </span>
              </div>
              <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 font-bold block uppercase text-xs">Overall Total</span>
                <span className="text-xl font-black text-emerald-950 mt-1 block">
                  {avgMarks !== null && avgMarks !== undefined && avgMarks > 0 ? `${avgMarks} / 100` : <span className="text-xs font-bold text-slate-400 italic">Not Evaluated</span>}
                </span>
              </div>
            </div>
          </Card>

          {/* PANEL 6 – Review Evaluation Timeline */}
          <Card title={<div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm uppercase tracking-wider"><Clock className="w-5 h-5 text-sky-600" /> Panel 6 – Review Evaluation Timeline</div>}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {(() => {
                const cyclesToRender = (Array.isArray(reviewCycles) && reviewCycles.length > 0) ? reviewCycles.slice(0, 3) : [
                  { id: 'c1', name: 'Review 1', reviewName: 'Review 1', status: 'Active' }
                ];

                return cyclesToRender.map((cycle, idx) => {
                  const cycleEvals = teamEvaluations.filter(e => e.reviewCycleId === cycle.id || e.reviewCycle === cycle.reviewName || e.reviewCycle === cycle.name);
                  const isCompleted = cycleEvals.length > 0;
                  const cycleAvg = isCompleted ? Math.round(cycleEvals.reduce((s, e) => s + (e.teamAverage || e.totalScore || 0), 0) / cycleEvals.length) : null;
                  const isCurrentActive = cycle.status === 'Active' || (!isCompleted && idx === 0);

                  return (
                    <div key={cycle.id || idx} className={`p-4 border rounded-xl space-y-1 ${isCompleted ? 'bg-emerald-50 border-emerald-200' : isCurrentActive ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-extrabold text-sm ${isCompleted ? 'text-emerald-950' : isCurrentActive ? 'text-blue-950' : 'text-slate-700'}`}>
                          {cycle.reviewName || cycle.name || `Review ${idx + 1}`}
                        </span>
                        <Badge variant={isCompleted ? 'success' : isCurrentActive ? 'primary' : 'default'} className="text-[10px] font-bold">
                          {isCompleted ? 'Completed' : isCurrentActive ? 'Active' : 'Upcoming'}
                        </Badge>
                      </div>
                      <p className={`text-xs font-bold ${isCompleted ? 'text-emerald-800' : isCurrentActive ? 'text-blue-800' : 'text-slate-600'}`}>
                        {isCompleted ? `Score: ${cycleAvg} / 100` : isCurrentActive ? 'In Progress' : 'Pending Schedule'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isCompleted ? `${cycleEvals.length} Evaluation(s) Submitted` : `Panel: ${team.reviewerName || 'Unassigned'}`}
                      </p>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>

          {/* PANEL 7 – Meetings & Attendance */}
          <Card title={<div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm uppercase tracking-wider"><Calendar className="w-5 h-5 text-blue-600" /> Panel 7 – Meetings & Attendance Record</div>}>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-semibold text-sm">Total Guide Meetings Held:</span>
                <span className="font-extrabold text-slate-900 text-base">{teamEvaluations.length > 0 ? `${teamEvaluations.length} Evaluation Session(s)` : '0 Meetings'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-semibold text-sm">Overall Attendance Rate:</span>
                <span className="font-extrabold text-emerald-600 text-base">
                  {(() => {
                    let p = 0;
                    let t = 0;
                    (team.members || team.students || []).forEach(s => {
                      const att = getStudentAttendanceDetails(s.id || s.rollNumber);
                      if (att.totalCount > 0) {
                        p += att.presentCount;
                        t += att.totalCount;
                      }
                    });
                    return t > 0 ? `${Math.round((p / t) * 100)}%` : 'Not Evaluated';
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-semibold text-sm">Last Evaluation Timestamp:</span>
                <span className="font-extrabold text-slate-700 text-sm">
                  {teamEvaluations.length > 0 && teamEvaluations[0].submittedAt
                    ? new Date(teamEvaluations[0].submittedAt).toLocaleDateString()
                    : 'No evaluations yet'}
                </span>
              </div>
            </div>
          </Card>

          {/* PANEL 8 – Activity Feed & Notifications */}
          <Card title={<div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm uppercase tracking-wider"><Activity className="w-4 h-4 text-teal-600" /> Panel 8 – Activity Feed & Notifications</div>}>
            <div className="space-y-3 text-xs max-h-60 overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Review 1 Evaluation Completed</p>
                  <p className="text-slate-500 text-[11px]">Score 84/100 recorded by Review Panel</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Guide Remarks Recorded</p>
                  <p className="text-slate-500 text-[11px]">"Project progress on schedule."</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Reviewer Assignment Synchronized</p>
                  <p className="text-slate-500 text-[11px]">Assigned for active review cycle</p>
                </div>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* Quick Reassignment Modal */}
      <Modal
        isOpen={reassignModal.open}
        onClose={() => setReassignModal({ open: false, type: '', currentId: '' })}
        title={`Reassign ${reassignModal.type.toUpperCase()} for Team ${teamId}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Select a new staff member to reassign as the {reassignModal.type} for Team <strong>{teamId}</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select {reassignModal.type.toUpperCase()}:
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-primary-500 focus:border-primary-500 font-medium"
            >
              <option value="">-- Select Staff Member --</option>
              {(reassignModal.type === 'guide' ? guides : reassignModal.type === 'faculty' ? faculty : reviewers).map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.email || staff.employeeId || staff.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setReassignModal({ open: false, type: '', currentId: '' })}>
              Cancel
            </Button>
            <Button
              onClick={handleExecuteReassign}
              disabled={!selectedStaffId || isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2"
            >
              Confirm Reassignment
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default TeamWorkspaceView;
