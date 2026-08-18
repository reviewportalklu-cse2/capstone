import React, { useMemo } from 'react';
import Card from '@/components/common/Card';
import { BarChart3, TrendingUp, TrendingDown, UserCheck, GraduationCap, ShieldCheck, ArrowRight, Activity, AlertCircle } from 'lucide-react';
import Badge from '@/components/common/Badge';

const MarksAnalysis = ({ teamData }) => {
  // Extract locked evaluations for calculations
  const lockedEvaluations = useMemo(() => {
    return (teamData.evaluations || []).filter(e => e.status === 'Locked');
  }, [teamData.evaluations]);

  // Aggregate by role
  const guideEvals = lockedEvaluations.filter(e => e.role === 'guide');
  const facultyEvals = lockedEvaluations.filter(e => e.role === 'faculty');
  const reviewerEvals = lockedEvaluations.filter(e => e.role === 'reviewer');

  const avgGuide = guideEvals.length > 0 ? Math.round(guideEvals.reduce((sum, e) => sum + (e.teamAverage || 0), 0) / guideEvals.length) : 0;
  const avgFaculty = facultyEvals.length > 0 ? Math.round(facultyEvals.reduce((sum, e) => sum + (e.teamAverage || 0), 0) / facultyEvals.length) : 0;
  const avgReviewer = reviewerEvals.length > 0 ? Math.round(reviewerEvals.reduce((sum, e) => sum + (e.teamAverage || 0), 0) / reviewerEvals.length) : 0;

  const totalPossible = (avgGuide > 0 ? 1 : 0) + (avgFaculty > 0 ? 1 : 0) + (avgReviewer > 0 ? 1 : 0);
  const overallAverage = totalPossible > 0 ? Math.round((avgGuide + avgFaculty + avgReviewer) / totalPossible) : 0;

  // Highest & Lowest among all individual scores
  const allScores = lockedEvaluations.map(e => e.teamAverage || 0);
  const highestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
  const lowestScore = allScores.length > 0 ? Math.min(...allScores) : 0;

  // Review-wise Progression (averaging all roles per cycle)
  const cycles = ['Review 1', 'Review 2', 'Review 3', 'Final'];
  const reviewMarksList = [];
  cycles.forEach(cycle => {
    const cycleEvals = lockedEvaluations.filter(e => e.reviewCycle === cycle);
    if (cycleEvals.length > 0) {
      const avg = Math.round(cycleEvals.reduce((sum, e) => sum + (e.teamAverage || 0), 0) / cycleEvals.length);
      reviewMarksList.push({ reviewType: cycle, totalScore: avg });
    }
  });

  // Latest & Previous for Trend
  const latestReviewScore = reviewMarksList.length > 0 ? reviewMarksList[reviewMarksList.length - 1].totalScore : 0;
  const previousReviewScore = reviewMarksList.length > 1 ? reviewMarksList[reviewMarksList.length - 2].totalScore : 0;
  
  const trend = latestReviewScore - previousReviewScore;
  const trendPercent = previousReviewScore > 0 ? Math.round((trend / previousReviewScore) * 100) : 0;

  return (
    <div className="space-y-6">
      {teamData.hasPendingEvaluations && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          This team has active Pending Evaluations. The current review cycle cannot be closed until they are resolved.
        </div>
      )}

      <Card title="Enterprise Marks Analytics" icon={BarChart3}>
        <div className="space-y-6">
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg border border-primary-100">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Overall Team Average
              </p>
              <p className="text-sm text-gray-600">Combined from all evaluator rubrics</p>
            </div>
            <div className="text-3xl font-black text-primary-700">
              {overallAverage} <span className="text-lg font-bold text-primary-400">/ 100</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Highest Score</p>
              <p className="text-lg font-bold text-emerald-600">{highestScore || 'N/A'}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Lowest Score</p>
              <p className="text-lg font-bold text-red-600">{lowestScore || 'N/A'}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Latest Review</p>
              <p className="text-lg font-bold text-gray-900">{latestReviewScore || 'N/A'}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Trend</p>
              <div className="flex items-center gap-1">
                {reviewMarksList.length > 1 ? (
                  <>
                    {trend > 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : (trend < 0 ? <TrendingDown className="w-4 h-4 text-red-500" /> : <ArrowRight className="w-4 h-4 text-gray-400" />)}
                    <span className={`text-sm font-bold ${trend > 0 ? 'text-emerald-600' : (trend < 0 ? 'text-red-600' : 'text-gray-500')}`}>
                      {trend > 0 ? '+' : ''}{trendPercent}%
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-gray-400">N/A</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                <UserCheck className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Guide Avg</p>
              <p className="text-xl font-bold text-gray-900">{avgGuide || 'N/A'}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <GraduationCap className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Faculty Avg</p>
              <p className="text-xl font-bold text-gray-900">{avgFaculty || 'N/A'}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Reviewer Avg</p>
              <p className="text-xl font-bold text-gray-900">{avgReviewer || 'N/A'}</p>
            </div>
          </div>

          {/* Review-wise comparison */}
          {reviewMarksList.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Review-wise Progression</p>
              <div className="space-y-2">
                {reviewMarksList.map((r, idx) => (
                  <div key={r.reviewType} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 w-24">{r.reviewType}</span>
                    <div className="flex-1 mx-3 bg-gray-100 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${r.totalScore || 0}%` }}></div>
                    </div>
                    <span className="font-bold text-gray-900 w-8 text-right">{r.totalScore || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
};

export default MarksAnalysis;
