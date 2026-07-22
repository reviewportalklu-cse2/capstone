import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { evaluationCenterService } from '@/firebase/services/evaluationCenterService';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { 
  ArrowLeft, 
  Lock, 
  Unlock, 
  CheckCircle, 
  User, 
  Calendar, 
  FileText, 
  Award, 
  History, 
  GitBranch, 
  ExternalLink,
  Loader2,
  Send,
  Building,
  MapPin,
  Clock
} from 'lucide-react';

const TeamDetails = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  const fetchTeamDetails = async () => {
    setLoading(true);
    try {
      const data = await evaluationCenterService.getTeamDetails(teamId);
      setTeam(data);
    } catch (err) {
      console.error("Failed to load team details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    if (!team) return;
    try {
      const updatedLock = await evaluationCenterService.toggleTeamLock(team.id, team.isLocked, 'admin');
      setTeam(prev => ({ ...prev, isLocked: updatedLock }));
    } catch (err) {
      alert("Failed to toggle lock");
    }
  };

  const handleStageChange = async (newStage) => {
    if (!team) return;
    try {
      await evaluationCenterService.updateApprovalStage(team.id, newStage, 'admin');
      setTeam(prev => ({ ...prev, approvalStage: newStage }));
    } catch (err) {
      alert("Failed to update approval stage");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!team) {
    return (
      <EmptyState
        title="Team Not Found"
        description="The requested team evaluation profile could not be retrieved."
        actionText="Back to Team Evaluations"
        onAction={() => navigate('/admin/evaluation-center/teams')}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/evaluation-center/teams')}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Teams List
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant={team.isLocked ? 'outline' : 'warning'}
            size="sm"
            onClick={handleToggleLock}
          >
            {team.isLocked ? <><Unlock className="w-4 h-4 mr-1 text-amber-600" /> Unlock Evaluation</> : <><Lock className="w-4 h-4 mr-1" /> Lock Evaluation</>}
          </Button>

          <select
            value={team.approvalStage}
            onChange={(e) => handleStageChange(e.target.value)}
            className="text-xs font-bold border-gray-300 rounded-lg focus:ring-primary-500 bg-white p-2 text-gray-800 shadow-sm"
          >
            <option value="Draft">Stage: Draft</option>
            <option value="Submitted">Stage: Submitted</option>
            <option value="Verified">Stage: Verified</option>
            <option value="Approved">Stage: Approved</option>
            <option value="Published">Stage: Published</option>
          </select>
        </div>
      </div>

      {/* Main Team Banner Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-md font-extrabold text-sm border border-primary-500/30">
                {team.teamId}
              </span>
              <Badge variant={team.approvalStage === 'Published' ? 'success' : 'warning'}>
                {team.approvalStage}
              </Badge>
              {team.isLocked && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center">
                  <Lock className="w-3 h-3 mr-1" /> Locked
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold mt-2 tracking-tight text-white">{team.teamName}</h1>
            <p className="text-slate-300 text-xs mt-1">
              Department of {team.department} • Academic Year {team.academicYear} • Batch {team.batch} • Section {team.section}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-slate-300 font-medium">Final Score</div>
              <div className="text-3xl font-black text-primary-400">{team.finalScore}<span className="text-sm font-bold text-slate-400">/100</span></div>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-xs text-slate-300 font-medium">Grade</div>
              <div className="text-2xl font-bold text-green-400">{team.grade}</div>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-xs text-slate-300 font-medium">Status</div>
              <div className="text-sm font-bold text-white">{team.passStatus}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Visual Stage Progress Tracker */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-wider uppercase">Evaluation Stage Progression</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          {[
            { stage: 'Guide Eval', score: team.guideMarks > 0 ? `${team.guideMarks}/20` : 'Pending', done: team.guideMarks > 0 },
            { stage: 'Faculty Eval', score: team.facultyMarks > 0 ? `${team.facultyMarks}/20` : 'Pending', done: team.facultyMarks > 0 },
            { stage: 'Review 1', score: team.review1Score > 0 ? `${team.review1Score}/100` : 'Pending', done: team.review1Score > 0 },
            { stage: 'Review 2', score: team.review2Score > 0 ? `${team.review2Score}/100` : 'Pending', done: team.review2Score > 0 },
            { stage: 'Review 3', score: team.review3Score > 0 ? `${team.review3Score}/100` : 'Pending', done: team.review3Score > 0 },
            { stage: 'Final Published', score: team.approvalStage === 'Published' ? 'Published' : 'Awaiting', done: team.approvalStage === 'Published' }
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-lg border text-xs font-semibold ${item.done ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
              <div className="font-bold">{item.stage}</div>
              <div className="text-xs mt-1 font-bold">{item.score}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sub-Navigation Inside Team Details */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl shadow-sm px-4 pt-2">
        {[
          { id: 'summary', name: 'Roster & Rubrics' },
          { id: 'panel', name: 'Faculty Panel & Schedule' },
          { id: 'history', name: 'Marks Version History' },
          { id: 'resources', name: 'Project Resources' },
          { id: 'timeline', name: 'Evaluation Timeline' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors ${
              activeTab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* TAB 1: Roster & Rubrics Breakdown */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Members Roster (2 Cols) */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-600" /> Team Members Roster (Drill-Down to Student Details)
            </h3>
            <div className="space-y-3">
              {team.members.map((member, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate(`/admin/evaluation-center/student/${member.id || member.uid}`)}
                  className="p-4 rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">
                      {member.name ? member.name.charAt(0) : 'S'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm hover:text-primary-600">{member.name || `Student ${idx + 1}`}</div>
                      <div className="text-xs text-gray-500">Roll: {member.rollNumber || member.id || `2200030${idx + 1}`} • {member.email}</div>
                    </div>
                  </div>
                  <Button size="xs" variant="outline">View Audit Profile</Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Rubrics Matrix (1 Col) */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary-600" /> Rubric Score Breakdown
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <div className="font-bold text-gray-900">Guide Evaluation (20 Marks Max)</div>
                <div className="flex justify-between text-gray-600"><span>Problem & Innovation:</span><span className="font-semibold">{team.rubrics?.guide?.problemStatement + team.rubrics?.guide?.innovation} pts</span></div>
                <div className="flex justify-between text-gray-600"><span>Implementation:</span><span className="font-semibold">{team.rubrics?.guide?.implementation} pts</span></div>
                <div className="flex justify-between text-gray-600"><span>Documentation:</span><span className="font-semibold">{team.rubrics?.guide?.documentation} pts</span></div>
                <div className="flex justify-between font-bold text-gray-900 border-t pt-1"><span>Total Guide Score:</span><span>{team.guideMarks}/20</span></div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <div className="font-bold text-gray-900">Faculty Internal (20 Marks Max)</div>
                <div className="flex justify-between text-gray-600"><span>Viva & Tech Defense:</span><span className="font-semibold">{team.rubrics?.faculty?.viva} pts</span></div>
                <div className="flex justify-between text-gray-600"><span>Implementation:</span><span className="font-semibold">{team.rubrics?.faculty?.implementation} pts</span></div>
                <div className="flex justify-between font-bold text-gray-900 border-t pt-1"><span>Total Faculty Score:</span><span>{team.facultyMarks}/20</span></div>
              </div>
            </div>
          </Card>

        </div>
      )}

      {/* TAB 2: Faculty Panel & Schedule */}
      {activeTab === 'panel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-primary-600" /> Assigned Faculty Panel Details
            </h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Panel Name:</span> <span className="font-bold text-gray-900">{team.facultyPanelDetails?.name}</span></div>
              <div><span className="text-gray-500">Panel Chairperson:</span> <span className="font-bold text-gray-900">{team.facultyPanelDetails?.chairperson}</span></div>
              <div>
                <span className="text-gray-500">Panel Members:</span>
                <div className="mt-1 space-y-1">
                  {team.facultyPanelDetails?.members?.map((m, i) => (
                    <div key={i} className="text-xs bg-gray-100 p-2 rounded font-medium text-gray-800">{m}</div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600" /> Review Session & Room Schedule
            </h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Assigned Room:</span> <span className="font-bold text-gray-900">{team.room}</span></div>
              <div><span className="text-gray-500">Presentation Slot:</span> <span className="font-bold text-gray-900">{team.slot}</span></div>
              <div><span className="text-gray-500">Assigned Guide:</span> <span className="font-bold text-gray-900">{team.guideName}</span></div>
              <div><span className="text-gray-500">Assigned Reviewer:</span> <span className="font-bold text-gray-900">{team.reviewerName}</span></div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Marks Version History */}
      {activeTab === 'history' && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-primary-600" /> Marks Modifications Audit Log (Version Control)
          </h3>
          <div className="space-y-3">
            {team.marksHistory?.map((h, i) => (
              <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>{h.updatedBy} ({h.role})</span>
                  <span>{h.date} • {h.time}</span>
                </div>
                <div className="text-gray-600">
                  Score updated from <span className="font-bold text-red-600">{h.previousScore}</span> to <span className="font-bold text-green-600">{h.updatedScore}</span>
                </div>
                <div className="text-gray-500 italic">Reason: "{h.reason}"</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: Project Resources */}
      {activeTab === 'resources' && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" /> Uploaded Team Resources & Repositories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {team.documents?.map((doc, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-200 flex items-center justify-between bg-white">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{doc.name}</div>
                  <div className="text-xs text-gray-500">{doc.type} • {doc.size} • Uploaded {doc.date}</div>
                </div>
                <Button size="xs" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View / Download
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: Timeline */}
      {activeTab === 'timeline' && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" /> Complete Evaluation Chronological Timeline
          </h3>
          <div className="space-y-4 relative border-l-2 border-primary-200 ml-4 pl-6">
            {team.timeline?.map((evt, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white ${evt.status === 'Completed' || evt.status === 'Published' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className="font-bold text-sm text-gray-900">{evt.title}</div>
                <div className="text-xs text-gray-500">{evt.evaluator} ({evt.role}) • {evt.date}</div>
                <div className="text-xs font-semibold text-primary-700 mt-1">Score Awarded: {evt.score}</div>
                <div className="text-xs text-gray-600 mt-0.5">Remarks: "{evt.remarks}"</div>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
};

export default TeamDetails;
