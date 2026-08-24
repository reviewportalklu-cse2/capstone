import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { useData } from '@/contexts/DataContext';
import { resolveTeamRelations } from '@/utils/relationshipResolver';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import { 
  Users, Search, Download, Filter, Target, Eye, LayoutGrid, List, 
  UserCheck, GraduationCap, UserCog, BookOpen, BarChart3, ChevronRight, Activity, Loader2
} from 'lucide-react';
import { generateTeamPDF } from '@/utils/teamPdfExport';
import TeamWorkspaceView from './components/TeamWorkspaceView';

const TeamManagement = () => {
  const navigate = useNavigate();
  const navigationItems = useAdminNavigation();
  const dataContext = useData();

  const { 
    teams = [], 
    projects = [], 
    guides = [], 
    faculty = [], 
    reviewers = [], 
    reviewCycles = [], 
    reviewerAssignments = [], 
    students = [], 
    dataLoading 
  } = dataContext || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGuide, setFilterGuide] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterReviewer, setFilterReviewer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [selectedTeamWorkspace, setSelectedTeamWorkspace] = useState(null);

  const enrichedTeams = useMemo(() => {
    const allTeamMap = new Map();

    // 1. Add teams from teams collection
    (teams || []).forEach(team => {
      const id = team.teamId || team.id;
      if (id) allTeamMap.set(String(id).toLowerCase(), team);
    });

    // 2. Discover team IDs from students collection
    (students || []).forEach(student => {
      const sTeamId = student.teamId || student.team || student['Team ID'] || student.TeamID;
      if (sTeamId && !allTeamMap.has(String(sTeamId).toLowerCase())) {
        allTeamMap.set(String(sTeamId).toLowerCase(), {
          id: sTeamId,
          teamId: sTeamId,
          batch: student.batch || '2026',
          section: student.section || 'A'
        });
      }
    });

    // 3. Discover team IDs from assignments & projects
    const collectionsToScan = [
      ...(dataContext?.guideAssignments || []),
      ...(dataContext?.facultyAssignments || []),
      ...(dataContext?.reviewerAssignments || []),
      ...(projects || [])
    ];
    collectionsToScan.forEach(item => {
      const itemTeamId = item?.teamId || item?.team || item?.['Team ID'];
      if (itemTeamId && !allTeamMap.has(String(itemTeamId).toLowerCase())) {
        allTeamMap.set(String(itemTeamId).toLowerCase(), {
          id: itemTeamId,
          teamId: itemTeamId,
          batch: item.batch || '2026',
          section: item.section || 'A'
        });
      }
    });

    const combinedTeams = Array.from(allTeamMap.values());

    return combinedTeams.map(team => {
      const rel = resolveTeamRelations(team, { 
        students, 
        projects, 
        guides, 
        faculty, 
        reviewers, 
        reviewCycles, 
        reviewerAssignments,
        evaluations: dataContext?.evaluations || [],
        guideMarks: dataContext?.guideMarks || [],
        facultyMarks: dataContext?.facultyMarks || [],
        reviews: dataContext?.reviews || []
      });

      const studentNames = (rel.members || []).map(s => s.name || s.rollNumber).join(', ');
      const avgMarks = rel?.avgMarks ?? 0;
      const cleanTId = String(team.teamId || team.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const hasEvaluations = (dataContext?.evaluations || []).some(e => String(e.teamId || e.team || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanTId);

      const health = !hasEvaluations
        ? { label: 'Not Evaluated', variant: 'secondary', bg: 'bg-gray-100 text-gray-700 border-gray-200' }
        : avgMarks >= 75
        ? { label: 'Healthy', variant: 'success', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
        : avgMarks >= 50
        ? { label: 'Attention', variant: 'warning', bg: 'bg-amber-50 text-amber-800 border-amber-200' }
        : { label: 'Critical', variant: 'danger', bg: 'bg-red-50 text-red-800 border-red-200' };

      return {
        ...rel,
        projectTitle: rel.projectTitle || 'No Project Assigned',
        projectId: rel.projectId || 'N/A',
        department: rel.department || 'Computer Science & Engineering',
        section: rel.section || 'A',
        guideName: rel.guideName,
        facultyName: rel.facultyName,
        reviewerName: rel.reviewerName,
        studentNames,
        membersCount: rel.memberCount || 0,
        progress: rel.progress || 0,
        avgMarks,
        health,
        status: rel.status || 'Active'
      };
    });
  }, [teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments, students, dataContext]);

  const filteredTeams = useMemo(() => {
    return enrichedTeams.filter(team => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        team.id?.toLowerCase().includes(searchLower) ||
        team.teamId?.toLowerCase().includes(searchLower) ||
        team.projectId?.toLowerCase().includes(searchLower) ||
        team.projectTitle?.toLowerCase().includes(searchLower) ||
        team.guideName?.toLowerCase().includes(searchLower) ||
        team.facultyName?.toLowerCase().includes(searchLower) ||
        team.reviewerName?.toLowerCase().includes(searchLower) ||
        team.studentNames?.toLowerCase().includes(searchLower);
        
      const matchesGuide = filterGuide ? team.guideId === filterGuide || team.guideName === filterGuide : true;
      const matchesFaculty = filterFaculty ? team.facultyId === filterFaculty || team.facultyName === filterFaculty : true;
      const matchesReviewer = filterReviewer ? team.reviewerId === filterReviewer || team.reviewerName === filterReviewer : true;
      const matchesStatus = filterStatus ? team.status === filterStatus : true;
      
      return matchesSearch && matchesGuide && matchesFaculty && matchesReviewer && matchesStatus;
    });
  }, [enrichedTeams, searchTerm, filterGuide, filterFaculty, filterReviewer, filterStatus]);

  const columns = [
    { header: 'Team ID', render: (row) => <span className="font-bold text-gray-900">{row.teamId || row.id}</span> },
    { 
      header: 'Project Title', 
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900 line-clamp-1">{row.projectTitle}</p>
          <p className="text-xs text-gray-400">Sec {row.section} • {row.department}</p>
        </div>
      ) 
    },
    { header: 'Guide', render: (row) => <span className="font-medium text-gray-900">{row.guideName}</span> },
    { header: 'Faculty', render: (row) => <span className="font-medium text-gray-900">{row.facultyName}</span> },
    { header: 'Reviewer', render: (row) => <span className="font-medium text-gray-900">{row.reviewerName}</span> },
    { 
      header: 'Health Status', 
      render: (row) => (
        <Badge variant={row.health.variant}>
          {row.health.label} ({row.avgMarks}%)
        </Badge>
      ) 
    },
    { 
      header: 'Action', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="xs" onClick={() => navigate(`/admin/teams/${row.teamId || row.id}`)} className="bg-primary-600 hover:bg-primary-700 text-white font-bold">
            Open Workspace
          </Button>
          <Button size="xs" variant="outline" onClick={() => generateTeamPDF(row)}>
            PDF
          </Button>
        </div>
      ) 
    }
  ];

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="KL CSE Capstone Portal - Team & Group Workspace">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-600">Loading Teams & Groups...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navigationItems} title="KL CSE Capstone Portal - Team Workspace Browser">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Header & Controls */}
        <div className="bg-white rounded-xl p-5 border shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary-600" /> Team Workspace Browser
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Azure DevOps & GitHub Projects inspired interactive team browser. Select any team to launch its full-page 360° operational workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'grid' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Grid Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'table' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" /> Table View
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Team ID, Project, Student, Guide, Reviewer..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <select
              value={filterGuide}
              onChange={(e) => setFilterGuide(e.target.value)}
              className="border rounded-lg p-2 text-xs text-gray-700 bg-white"
            >
              <option value="">-- All Guides --</option>
              {guides.map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>

            <select
              value={filterFaculty}
              onChange={(e) => setFilterFaculty(e.target.value)}
              className="border rounded-lg p-2 text-xs text-gray-700 bg-white"
            >
              <option value="">-- All Faculty --</option>
              {faculty.map(f => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>

            <select
              value={filterReviewer}
              onChange={(e) => setFilterReviewer(e.target.value)}
              className="border rounded-lg p-2 text-xs text-gray-700 bg-white"
            >
              <option value="">-- All Reviewers --</option>
              {reviewers.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Switcher */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTeams.map((team) => (
              <div 
                key={team.id || team.teamId}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">{team.teamId || team.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${team.health.bg}`}>
                      {team.health.label}
                    </span>
                  </div>
                  <Badge variant="default" className="text-[10px]">Sec {team.section || 'A'}</Badge>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 text-xs flex-1">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Project Title</span>
                    <p className="font-bold text-gray-900 line-clamp-1 mt-0.5">{team.projectTitle}</p>
                  </div>

                  <div className="space-y-1.5 bg-gray-50/80 p-2.5 rounded-lg border">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Guide:
                      </span>
                      <span className="font-bold text-gray-900">{team.guideName}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> Faculty:
                      </span>
                      <span className="font-bold text-gray-900">{team.facultyName}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <UserCog className="w-3.5 h-3.5 text-orange-600" /> Reviewer:
                      </span>
                      <span className="font-bold text-gray-900">{team.reviewerName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-3.5 h-3.5 text-primary-600" />
                      <span className="font-bold">{team.membersCount} Members</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-emerald-700">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{team.avgMarks} / 100</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-gray-50 border-t flex items-center justify-between gap-2">
                  <Button
                    size="xs"
                    onClick={() => navigate(`/admin/teams/${team.teamId || team.id}`)}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold"
                  >
                    Open Full Workspace <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => generateTeamPDF(team)}
                    className="border-gray-300 text-gray-700 hover:bg-white"
                  >
                    PDF
                  </Button>
                </div>
              </div>
            ))}

            {filteredTeams.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-xl border">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No matching teams found.</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or filters.</p>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <Table columns={columns} data={filteredTeams} isLoading={dataLoading} />
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
};

export default TeamManagement;
