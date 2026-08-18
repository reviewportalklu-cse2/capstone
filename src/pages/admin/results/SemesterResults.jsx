import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useOutcomeEngine } from '@/hooks/useOutcomeEngine';
import { exportToPDF, exportToCSV } from '@/utils/ReportExporter';
import { Search, Download, Award, ShieldCheck, Users } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const SemesterResults = () => {
  const navigationItems = useAdminNavigation();
  const { dataLoading } = useData();
  const { generateSemesterRankings, generateStatistics } = useOutcomeEngine();
  const [activeTab, setActiveTab] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');

  const { students, teams } = generateSemesterRankings();
  const stats = generateStatistics();

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter(t => 
    t.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const studentColumns = [
    { header: 'Rank', accessor: 'rank', render: (row) => <span className="font-bold text-gray-900">#{row.rank}</span> },
    { header: 'Roll No', accessor: 'rollNo', render: (row) => <span className="font-semibold">{row.rollNo || 'N/A'}</span> },
    { header: 'Name', accessor: 'name' },
    { header: 'Team', accessor: 'teamId', render: (row) => <span className="text-primary-600">{row.teamId}</span> },
    { header: 'Guide (30%)', accessor: 'weightedGuide', render: (row) => row.weightedGuide },
    { header: 'Faculty (20%)', accessor: 'weightedFaculty', render: (row) => row.weightedFaculty },
    { header: 'Reviewer (50%)', accessor: 'weightedReviewer', render: (row) => row.weightedReviewer },
    { header: 'Final Score', accessor: 'finalScore', render: (row) => <span className="font-bold text-gray-900">{row.finalScore}</span> },
    { header: 'Grade', accessor: 'grade', render: (row) => <span className="font-bold text-primary-600">{row.grade}</span> },
    { header: 'Status', accessor: 'status', render: (row) => (
      <Badge variant={row.status === 'Pass' ? 'success' : 'danger'}>{row.status}</Badge>
    )}
  ];

  const teamColumns = [
    { header: 'Rank', accessor: 'rank', render: (row) => <span className="font-bold text-gray-900">#{row.rank}</span> },
    { header: 'Team ID', accessor: 'id', render: (row) => <span className="font-semibold">{row.id}</span> },
    { header: 'Project', accessor: 'projectName', render: (row) => <div className="max-w-[200px] truncate" title={row.projectName}>{row.projectName}</div> },
    { header: 'Guide (30%)', accessor: 'weightedGuide', render: (row) => row.weightedGuide },
    { header: 'Faculty (20%)', accessor: 'weightedFaculty', render: (row) => row.weightedFaculty },
    { header: 'Reviewer (50%)', accessor: 'weightedReviewer', render: (row) => row.weightedReviewer },
    { header: 'Final Team Score', accessor: 'finalTeamScore', render: (row) => <span className="font-bold text-gray-900">{row.finalTeamScore}</span> }
  ];

  const handleExportPDF = () => {
    if (activeTab === 'students') {
      const headers = ['Rank', 'Roll No', 'Name', 'Team', 'Guide Score', 'Faculty Score', 'Reviewer Score', 'Final Score', 'Grade', 'Status'];
      const rows = filteredStudents.map(s => [
        s.rank, s.rollNo || 'N/A', s.name, s.teamId, s.weightedGuide, s.weightedFaculty, s.weightedReviewer, s.finalScore, s.grade, s.status
      ]);
      exportToPDF('Official_Student_Results', 'Official Semester Result Leaderboard', headers, rows, 'landscape');
    } else {
      const headers = ['Rank', 'Team ID', 'Project', 'Guide Score', 'Faculty Score', 'Reviewer Score', 'Final Score'];
      const rows = filteredTeams.map(t => [
        t.rank, t.id, t.projectName, t.weightedGuide, t.weightedFaculty, t.weightedReviewer, t.finalTeamScore
      ]);
      exportToPDF('Official_Team_Results', 'Official Team Semester Results', headers, rows, 'landscape');
    }
  };

  return (
    <DashboardLayout navigationItems={navigationItems} title="Semester Results Compilation">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg text-white gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-xl">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Official Semester Results</h1>
              <p className="text-gray-300 mt-1 text-lg">Compiled outcomes based on live academic weights.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Statistics Banner */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-primary-50 border-primary-100">
              <p className="text-sm text-primary-600 font-medium">Mean Score</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.mean}</h3>
            </Card>
            <Card className="bg-emerald-50 border-emerald-100">
              <p className="text-sm text-emerald-600 font-medium">Pass Rate</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.passPercentage}%</h3>
            </Card>
            <Card className="bg-amber-50 border-amber-100">
              <p className="text-sm text-amber-600 font-medium">Highest Score</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.highestMarks}</h3>
            </Card>
            <Card className="bg-blue-50 border-blue-100">
              <p className="text-sm text-blue-600 font-medium">Evaluated</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalEvaluated}</h3>
            </Card>
            <Card className="bg-red-50 border-red-100">
              <p className="text-sm text-red-600 font-medium">Fail Rate</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.failPercentage}%</h3>
            </Card>
          </div>
        )}

        <Card className="p-0 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4 flex justify-between items-center">
            <nav className="-mb-px flex space-x-8">
              <button onClick={() => setActiveTab('students')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'students' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <Users className="w-4 h-4" /> Student Rankings
              </button>
              <button onClick={() => setActiveTab('teams')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'teams' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <ShieldCheck className="w-4 h-4" /> Team Rankings
              </button>
            </nav>
            <div className="py-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  className="pl-9 h-9" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="p-0">
            {dataLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'students' ? (
                  <Table columns={studentColumns} data={filteredStudents} />
                ) : (
                  <Table columns={teamColumns} data={filteredTeams} />
                )}
              </div>
            )}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default SemesterResults;
