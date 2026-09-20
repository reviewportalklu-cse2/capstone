import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationCenterService } from '@/firebase/services/evaluationCenterService';
import { exportToCSV, exportToExcel } from '@/utils/ReportExporter';
import { useEvaluationCenterData } from '@/hooks/useEvaluationCenterData';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import EmptyState from '@/components/common/EmptyState';
import { 
  Search, 
  Filter, 
  Eye, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Download,
  Send,
  Loader2
} from 'lucide-react';

const TeamEvaluations = () => {
  const { getTeamsWithEvaluations, dataLoading } = useEvaluationCenterData();
  const [asyncTeams, setAsyncTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedTeams, setSelectedTeams] = useState([]);

  const navigate = useNavigate();

  const hookTeams = getTeamsWithEvaluations() || [];
  const teams = asyncTeams.length > 0 ? asyncTeams : hookTeams;
  const loading = dataLoading && teams.length === 0;

  const formatExportRows = (items) => {
    return items.map(t => ({
      'Team ID': t.teamId || t.id,
      'Project Title': t.projectTitle || t.teamName || t.title || 'N/A',
      'Review Cycle': 'Review 1',
      'Guide Evaluator': t.guideName || 'Unassigned',
      'Guide Employee ID': t.guideEmployeeId || t.guideId || 'N/A',
      'Guide Score': t.guideMarks !== null && t.guideMarks !== undefined ? t.guideMarks : 'PENDING',
      'Guide Status': t.guideMarks !== null && t.guideMarks !== undefined ? 'Submitted' : 'PENDING',
      'Faculty Evaluator': t.facultyPanelName || t.facultyName || 'Unassigned',
      'Faculty Employee ID': t.facultyEmployeeId || t.facultyId || 'N/A',
      'Faculty Score': t.facultyMarks !== null && t.facultyMarks !== undefined ? t.facultyMarks : 'PENDING',
      'Faculty Status': t.facultyMarks !== null && t.facultyMarks !== undefined ? 'Submitted' : 'PENDING',
      'Reviewer Evaluator': t.reviewerName || 'Unassigned',
      'Reviewer Employee ID': t.reviewerEmployeeId || t.reviewerId || 'N/A',
      'Reviewer Score': t.review1Score !== null && t.review1Score !== undefined ? t.review1Score : 'PENDING',
      'Reviewer Status': t.review1Score !== null && t.review1Score !== undefined ? 'Submitted' : 'PENDING',
      'Final Score': t.finalScore !== null && t.finalScore !== undefined ? t.finalScore : 'PENDING',
      'Grade': t.finalScore !== null && t.finalScore !== undefined ? (t.grade || 'N/A') : 'PENDING',
      'Latest Submitted Date': t.latestEvalDate && t.latestEvalDate !== 'Pending' ? t.latestEvalDate : 'PENDING'
    }));
  };

  const handleExportCSV = (teamsToExport = filteredTeams) => {
    const rows = formatExportRows(teamsToExport);
    exportToCSV('evaluation_center_teams_report', rows);
  };

  const handleExportExcel = (teamsToExport = filteredTeams) => {
    const rows = formatExportRows(teamsToExport);
    exportToExcel('evaluation_center_teams_report', rows);
  };

  const handleToggleLock = async (team) => {
    try {
      const updatedLock = await evaluationCenterService.toggleTeamLock(team.id, team.isLocked, 'admin');
      setAsyncTeams(prev => {
        const base = prev.length > 0 ? prev : hookTeams;
        return base.map(t => t.id === team.id ? { ...t, isLocked: updatedLock } : t);
      });
    } catch (err) {
      alert("Failed to toggle lock status");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTeams(filteredTeams.map(t => t.id));
    } else {
      setSelectedTeams([]);
    }
  };

  const handleSelectTeam = (id) => {
    setSelectedTeams(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredTeams = teams.filter(t => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (t.teamId || '').toLowerCase().includes(query) ||
      (t.teamName || '').toLowerCase().includes(query) ||
      (t.guideName || '').toLowerCase().includes(query) ||
      (t.reviewerName || '').toLowerCase().includes(query) ||
      (t.facultyPanelName || '').toLowerCase().includes(query) ||
      (t.department || '').toLowerCase().includes(query);

    const matchesDept = selectedDept === 'All' || t.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    const matchesStage = selectedStage === 'All' || t.approvalStage === selectedStage;

    return matchesSearch && matchesDept && matchesStatus && matchesStage;
  });

  const columns = [
    {
      key: 'select',
      header: (
        <input 
          type="checkbox" 
          onChange={handleSelectAll} 
          checked={selectedTeams.length > 0 && selectedTeams.length === filteredTeams.length}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      ),
      render: (_, row) => (
        <input 
          type="checkbox" 
          checked={selectedTeams.includes(row.id)}
          onChange={() => handleSelectTeam(row.id)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      )
    },
    {
      key: 'teamInfo',
      header: 'Team & Project',
      render: (_, row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">{row.teamId}</span>
            {row.isLocked && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                <Lock className="w-2.5 h-2.5 mr-0.5" /> Locked
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-primary-700 truncate max-w-[220px]" title={row.teamName}>
            {row.teamName}
          </div>
          <div className="text-[11px] text-gray-400">
            {row.department} • Sec {row.section} • {row.membersCount} Members
          </div>
        </div>
      )
    },
    {
      key: 'mentors',
      header: 'Assigned Mentors',
      render: (_, row) => (
        <div className="text-xs space-y-0.5">
          <div className="truncate max-w-[150px]"><span className="text-gray-400">Guide:</span> <span className="font-medium text-gray-800">{row.guideName}</span></div>
          <div className="truncate max-w-[150px]"><span className="text-gray-400">Rev:</span> <span className="font-medium text-gray-800">{row.reviewerName}</span></div>
          <div className="truncate max-w-[150px]"><span className="text-gray-400">Panel:</span> <span className="font-medium text-gray-800">{row.facultyPanelName}</span></div>
        </div>
      )
    },
    {
      key: 'guideMarks',
      header: 'Guide Marks',
      render: (_, row) => (
        <span className={`text-xs font-bold ${row.guideMarks !== null && row.guideMarks !== undefined ? 'text-gray-900' : 'text-amber-600 italic'}`}>
          {row.guideMarks !== null && row.guideMarks !== undefined ? `${row.guideMarks} / 100` : 'PENDING'}
        </span>
      )
    },
    {
      key: 'facultyMarks',
      header: 'Faculty Marks',
      render: (_, row) => (
        <span className={`text-xs font-bold ${row.facultyMarks !== null && row.facultyMarks !== undefined ? 'text-gray-900' : 'text-amber-600 italic'}`}>
          {row.facultyMarks !== null && row.facultyMarks !== undefined ? `${row.facultyMarks} / 100` : 'PENDING'}
        </span>
      )
    },
    {
      key: 'reviews',
      header: 'R1 / R2 / R3',
      render: (_, row) => (
        <div className="text-xs font-medium space-x-1">
          <span className={row.review1Score !== null && row.review1Score !== undefined ? 'text-gray-900 font-bold' : 'text-amber-600 italic'}>{row.review1Score !== null && row.review1Score !== undefined ? `${row.review1Score}` : 'PENDING'}</span> /
          <span className={row.review2Score !== null && row.review2Score !== undefined ? 'text-gray-900 font-bold' : 'text-amber-600 italic'}>{row.review2Score !== null && row.review2Score !== undefined ? `${row.review2Score}` : 'PENDING'}</span> /
          <span className={row.review3Score !== null && row.review3Score !== undefined ? 'text-gray-900 font-bold' : 'text-amber-600 italic'}>{row.review3Score !== null && row.review3Score !== undefined ? `${row.review3Score}` : 'PENDING'}</span>
        </div>
      )
    },
    {
      key: 'finalScore',
      header: 'Final Score',
      render: (_, row) => {
        if (row.finalScore === null || row.finalScore === undefined) {
          return <span className="text-xs font-bold text-amber-600 italic">PENDING</span>;
        }
        const gradeStr = String(row?.grade || 'F');
        const isGradeA = gradeStr.startsWith('A');
        return (
          <div>
            <div className="text-sm font-extrabold text-primary-700">{row.finalScore}/100</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isGradeA ? 'bg-green-100 text-green-800' :
                gradeStr === 'B' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                Grade {gradeStr}
              </span>
              <span className={`text-[10px] font-bold ${row.passStatus === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                {row.passStatus}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'approvalStage',
      header: 'Stage & Status',
      render: (_, row) => (
        <div>
          <Badge 
            variant={
              row.approvalStage === 'Published' ? 'success' :
              row.approvalStage === 'Approved' ? 'primary' :
              row.approvalStage === 'Verified' ? 'info' : 'warning'
            }
          >
            {row.approvalStage}
          </Badge>
          <div className="w-16 bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-primary-600 h-full rounded-full transition-all duration-300" style={{ width: `${row.stageProgress}%` }}></div>
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Button
            size="xs"
            variant="primary"
            onClick={() => navigate(`/admin/evaluation-center/team/${row.id}`)}
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> View Team
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleToggleLock(row)}
            title={row.isLocked ? "Unlock Evaluation" : "Lock Evaluation"}
          >
            {row.isLocked ? <Unlock className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3.5 h-3.5 text-gray-500" />}
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Controls & Filter Header */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex-1 max-w-md">
            <Input
              icon={Search}
              placeholder="Search by Team ID, Name, Guide, Reviewer, Panel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
              <Filter className="w-4 h-4 text-gray-400" /> Filters:
            </div>
            
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-gray-50 p-2 font-medium"
            >
              <option value="All">All Depts</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
            </select>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="text-xs border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-gray-50 p-2 font-medium"
            >
              <option value="All">All Stages</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Verified">Verified</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published</option>
            </select>

            <Button size="xs" variant="outline" onClick={() => handleExportCSV(filteredTeams)} className="text-xs font-semibold">
              <Download className="w-3.5 h-3.5 mr-1 text-green-600" /> Export CSV
            </Button>
            <Button size="xs" variant="outline" onClick={() => handleExportExcel(filteredTeams)} className="text-xs font-semibold">
              <Download className="w-3.5 h-3.5 mr-1 text-blue-600" /> Export XLSX
            </Button>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedTeams.length > 0 && (
          <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <span className="text-xs font-bold text-primary-900">
              {selectedTeams.length} Team(s) Selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="xs" variant="outline" onClick={() => alert(`Locking ${selectedTeams.length} team(s)`)}>
                <Lock className="w-3 h-3 mr-1" /> Lock Selected
              </Button>
              <Button size="xs" variant="outline" onClick={() => handleExportCSV(teams.filter(t => selectedTeams.includes(t.id)))}>
                <FileText className="w-3 h-3 mr-1" /> Export Selected CSV
              </Button>
              <Button size="xs" variant="outline" onClick={() => handleExportExcel(teams.filter(t => selectedTeams.includes(t.id)))}>
                <FileText className="w-3 h-3 mr-1" /> Export Selected XLSX
              </Button>
              <Button size="xs" variant="primary" onClick={() => alert(`Publishing results for ${selectedTeams.length} team(s)`)}>
                <Send className="w-3 h-3 mr-1" /> Publish Results
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Main Team Table */}
      {filteredTeams.length > 0 ? (
        <Table columns={columns} data={filteredTeams} />
      ) : (
        <EmptyState
          title="No Teams Found"
          description="No evaluation records matched your search parameters."
        />
      )}

    </div>
  );
};

export default TeamEvaluations;
