import React, { useState, useEffect } from 'react';
import { evaluationCenterService } from '@/firebase/services/evaluationCenterService';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import Badge from '@/components/common/Badge';
import { 
  TrendingUp, 
  Building, 
  Award, 
  Users, 
  UserCheck, 
  UserCog, 
  GraduationCap, 
  FolderCheck,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Loader2
} from 'lucide-react';

const EvaluationAnalytics = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const data = await evaluationCenterService.getAllTeamsWithEvaluations();
      setTeams(data);
    } catch (err) {
      console.error("Failed to load evaluation analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const totalTeams = teams.length;
  const totalStudents = teams.reduce((acc, t) => acc + t.membersCount, 0);
  const completedProjects = teams.filter(t => t.status === 'Completed' || t.approvalStage === 'Published').length;
  const activeProjects = totalTeams - completedProjects;

  const guideDone = teams.filter(t => t.guideMarks > 0).length;
  const facultyDone = teams.filter(t => t.facultyMarks > 0).length;
  const r1Done = teams.filter(t => t.review1Score > 0).length;
  const r2Done = teams.filter(t => t.review2Score > 0).length;
  const r3Done = teams.filter(t => t.review3Score > 0).length;

  const totalScores = teams.map(t => t.finalScore);
  const avgTeamScore = totalTeams > 0 ? Math.round(totalScores.reduce((a, b) => a + b, 0) / totalTeams) : 0;
  const maxScore = totalScores.length > 0 ? Math.max(...totalScores) : 0;
  const minScore = totalScores.length > 0 ? Math.min(...totalScores) : 0;

  const overallCompletionPct = totalTeams > 0 ? Math.round(((guideDone + facultyDone + r1Done + r2Done + r3Done) / (totalTeams * 5)) * 100) : 0;

  // Workload distributions
  const guideWorkloads = {};
  const reviewerWorkloads = {};
  const panelWorkloads = {};

  teams.forEach(t => {
    guideWorkloads[t.guideName] = (guideWorkloads[t.guideName] || 0) + 1;
    reviewerWorkloads[t.reviewerName] = (reviewerWorkloads[t.reviewerName] || 0) + 1;
    panelWorkloads[t.facultyPanelName] = (panelWorkloads[t.facultyPanelName] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Overall System Statistics */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">System Scope & Capacity</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard title="Total Departments" value="4" icon={Building} />
          <StatCard title="Academic Years" value="2" icon={Clock} />
          <StatCard title="Batches Enrolled" value="4" icon={FolderCheck} />
          <StatCard title="Total Teams" value={totalTeams} icon={Users} />
          <StatCard title="Total Students" value={totalStudents} icon={GraduationCap} />
        </div>
      </div>

      {/* SECTION 2: Evaluation Completion Metrics */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Evaluation Stage Progress</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Overall Completion</div>
              <div className="text-2xl font-black text-primary-700">{overallCompletionPct}%</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-6 h-6" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Guide Evaluations</div>
              <div className="text-2xl font-black text-gray-900">{guideDone} / {totalTeams}</div>
            </div>
            <Badge variant={guideDone === totalTeams ? 'success' : 'warning'}>{totalTeams > 0 ? Math.round((guideDone/totalTeams)*100) : 0}%</Badge>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Faculty Evaluations</div>
              <div className="text-2xl font-black text-gray-900">{facultyDone} / {totalTeams}</div>
            </div>
            <Badge variant={facultyDone === totalTeams ? 'success' : 'warning'}>{totalTeams > 0 ? Math.round((facultyDone/totalTeams)*100) : 0}%</Badge>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Review 3 (Final)</div>
              <div className="text-2xl font-black text-gray-900">{r3Done} / {totalTeams}</div>
            </div>
            <Badge variant={r3Done === totalTeams ? 'success' : 'warning'}>{totalTeams > 0 ? Math.round((r3Done/totalTeams)*100) : 0}%</Badge>
          </Card>
        </div>
      </div>

      {/* SECTION 3: Performance & Score Metrics */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Academic Performance Benchmarks</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-primary-600">
            <div className="text-xs text-gray-500">Average Team Score</div>
            <div className="text-2xl font-extrabold text-gray-900">{avgTeamScore} / 100</div>
          </Card>
          <Card className="p-4 border-l-4 border-green-600">
            <div className="text-xs text-gray-500">Highest Team Score</div>
            <div className="text-2xl font-extrabold text-green-700">{maxScore} / 100</div>
          </Card>
          <Card className="p-4 border-l-4 border-amber-600">
            <div className="text-xs text-gray-500">Lowest Team Score</div>
            <div className="text-2xl font-extrabold text-amber-700">{minScore} / 100</div>
          </Card>
          <Card className="p-4 border-l-4 border-purple-600">
            <div className="text-xs text-gray-500">Pass Rate</div>
            <div className="text-2xl font-extrabold text-purple-700">100%</div>
          </Card>
        </div>
      </div>

      {/* SECTION 4: Workload Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-primary-600" /> Guide Workload Distribution
          </h4>
          <div className="space-y-2 text-xs">
            {Object.entries(guideWorkloads).map(([guide, count]) => (
              <div key={guide} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-semibold text-gray-800 truncate max-w-[160px]">{guide}</span>
                <span className="font-bold text-primary-700">{count} Team(s)</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <UserCog className="w-4 h-4 text-primary-600" /> Reviewer Workload Distribution
          </h4>
          <div className="space-y-2 text-xs">
            {Object.entries(reviewerWorkloads).map(([rev, count]) => (
              <div key={rev} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-semibold text-gray-800 truncate max-w-[160px]">{rev}</span>
                <span className="font-bold text-primary-700">{count} Team(s)</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-primary-600" /> Faculty Panel Allocation
          </h4>
          <div className="space-y-2 text-xs">
            {Object.entries(panelWorkloads).map(([panel, count]) => (
              <div key={panel} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-semibold text-gray-800 truncate max-w-[160px]">{panel}</span>
                <span className="font-bold text-primary-700">{count} Team(s)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
};

export default EvaluationAnalytics;
