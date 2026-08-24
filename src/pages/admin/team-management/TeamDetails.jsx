import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { useData } from '@/contexts/DataContext';
import { resolveTeamRelations } from '@/utils/relationshipResolver';
import Button from '@/components/common/Button';
import { Loader2, ArrowLeft } from 'lucide-react';
import TeamWorkspaceView from './components/TeamWorkspaceView';

const TeamDetails = () => {
  const { teamId } = useParams();
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

  const teamData = useMemo(() => {
    if (dataLoading) return null;
    
    let found = teams?.find(t => t.id === teamId || t.teamId === teamId || String(t.id).toLowerCase() === String(teamId).toLowerCase() || String(t.teamId).toLowerCase() === String(teamId).toLowerCase());
    
    if (!found && students && students.length > 0) {
      const matchingStudent = students.find(s => 
        String(s.teamId || s.team || s['Team ID'] || s.TeamID || '').toLowerCase() === String(teamId).toLowerCase()
      );
      if (matchingStudent) {
        found = { 
          id: teamId, 
          teamId, 
          batch: matchingStudent.batch || '2026', 
          section: matchingStudent.section || 'A',
          guideId: matchingStudent.guideId,
          facultyId: matchingStudent.facultyId,
          reviewerId: matchingStudent.reviewerId,
          projectId: matchingStudent.projectId
        };
      }
    }
    
    if (!found) return null;

    const rel = resolveTeamRelations(found, { 
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

    return {
      ...rel,
      projectTitle: rel.projectTitle || 'No Project Assigned',
      projectId: rel.projectId || 'N/A',
      department: rel.department || 'Computer Science & Engineering',
      section: rel.section || 'A'
    };
  }, [teams, projects, guides, faculty, reviewers, reviewCycles, reviewerAssignments, students, teamId, dataLoading, dataContext]);

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="Team Workspace Loading...">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!teamData) {
    return (
      <DashboardLayout navigationItems={navigationItems} title="Team Workspace Not Found">
        <div className="space-y-4 max-w-7xl mx-auto p-6 bg-white rounded-xl border text-center">
          <h2 className="text-lg font-bold text-gray-800">Team Workspace Not Found</h2>
          <p className="text-xs text-gray-500">The requested Team ID '{teamId}' could not be located in Firestore.</p>
          <Button size="sm" onClick={() => navigate('/admin/teams')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Team Browser
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navigationItems} title={`Team Workspace - ${teamData.teamId || teamData.id}`}>
      <div className="space-y-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/teams')} className="text-xs font-bold">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Team Browser
          </Button>
        </div>
        <TeamWorkspaceView
          team={teamData}
          contextData={{ 
            guides, 
            faculty, 
            reviewers,
            reviewCycles: dataContext?.reviewCycles || [],
            rubrics: dataContext?.rubrics || [],
            rubricCriteria: dataContext?.rubricCriteria || [],
            students: dataContext?.students || [],
            projects: dataContext?.projects || [],
            evaluations: dataContext?.evaluations || [],
            remarks: dataContext?.remarks || [],
            attendance: dataContext?.attendance || [],
            notifications: dataContext?.notifications || [],
            auditLogs: dataContext?.auditLogs || []
          }}
          onRefresh={() => {}}
        />
      </div>
    </DashboardLayout>
  );
};

export default TeamDetails;
