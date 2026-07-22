import React, { useState, useEffect } from 'react';
import { evaluationCenterService } from '@/firebase/services/evaluationCenterService';
import Card from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import { 
  Users, 
  FolderCheck, 
  Clock, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Loader2,
  FileCheck,
  ShieldCheck,
  BarChart3
} from 'lucide-react';

const EvaluationDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await evaluationCenterService.getAllTeamsWithEvaluations();
      setTeams(data);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
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

  const avgTeamScore = totalTeams > 0 ? Math.round(teams.reduce((acc, t) => acc + t.finalScore, 0) / totalTeams) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Evaluated Teams"
          value={totalTeams}
          icon={Users}
          trend={{ value: '100% Live', isPositive: true }}
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={FolderCheck}
          trend={{ value: 'Enrolled', isPositive: true }}
        />
        <StatCard
          title="Average Team Score"
          value={`${avgTeamScore} / 100`}
          icon={Award}
          trend={{ value: 'Overall Performance', isPositive: avgTeamScore >= 70 }}
        />
        <StatCard
          title="Published Results"
          value={completedProjects}
          icon={CheckCircle2}
          trend={{ value: `${totalTeams > 0 ? Math.round((completedProjects/totalTeams)*100) : 0}% Complete`, isPositive: true }}
        />
      </div>

      {/* Review Stage Breakdown */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-primary-600" /> Evaluation Stage Completion Tracker
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div className="p-4 bg-gray-50 border rounded-xl">
            <div className="text-xs text-gray-500 font-medium">Guide Eval</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{guideDone} / {totalTeams}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{totalTeams > 0 ? Math.round((guideDone/totalTeams)*100) : 0}%</div>
          </div>

          <div className="p-4 bg-gray-50 border rounded-xl">
            <div className="text-xs text-gray-500 font-medium">Faculty Eval</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{facultyDone} / {totalTeams}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{totalTeams > 0 ? Math.round((facultyDone/totalTeams)*100) : 0}%</div>
          </div>

          <div className="p-4 bg-gray-50 border rounded-xl">
            <div className="text-xs text-gray-500 font-medium">Review 1</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{r1Done} / {totalTeams}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{totalTeams > 0 ? Math.round((r1Done/totalTeams)*100) : 0}%</div>
          </div>

          <div className="p-4 bg-gray-50 border rounded-xl">
            <div className="text-xs text-gray-500 font-medium">Review 2</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{r2Done} / {totalTeams}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{totalTeams > 0 ? Math.round((r2Done/totalTeams)*100) : 0}%</div>
          </div>

          <div className="p-4 bg-gray-50 border rounded-xl">
            <div className="text-xs text-gray-500 font-medium">Review 3</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{r3Done} / {totalTeams}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{totalTeams > 0 ? Math.round((r3Done/totalTeams)*100) : 0}%</div>
          </div>
        </div>
      </Card>

      {/* Activity & Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" /> Grade Distribution Overview
          </h3>
          <div className="space-y-3 text-sm">
            {['A+', 'A', 'B', 'C', 'F'].map(g => {
              const count = teams.filter(t => t.grade === g).length;
              const pct = totalTeams > 0 ? Math.round((count / totalTeams) * 100) : 0;
              return (
                <div key={g}>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Grade {g}</span>
                    <span>{count} Teams ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" /> Recent Evaluation Activity Stream
          </h3>
          <div className="space-y-3 text-xs">
            {teams.slice(0, 4).map((t, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between border">
                <div>
                  <div className="font-bold text-gray-900">{t.teamId} - {t.teamName}</div>
                  <div className="text-gray-500">Evaluated by {t.reviewerName} • Stage: {t.approvalStage}</div>
                </div>
                <div className="font-extrabold text-primary-700 text-sm">{t.finalScore}/100</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
};

export default EvaluationDashboard;
