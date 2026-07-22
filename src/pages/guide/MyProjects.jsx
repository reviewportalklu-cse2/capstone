import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/firebase/services/projectService';
import { Loader2, Search, FileText, ExternalLink, AlertCircle } from 'lucide-react';

const MyProjects = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProjects(currentUser.uid);
    }
  }, [currentUser]);

  const fetchProjects = async (guideId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectsByGuide(guideId);
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to fetch projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const lowerQ = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.title?.toLowerCase().includes(lowerQ) || 
      p.description?.toLowerCase().includes(lowerQ) ||
      p.currentMilestone?.toLowerCase().includes(lowerQ)
    );
  }, [projects, searchQuery]);

  const columns = [
    { header: 'Project Title', accessor: 'title', render: (row) => <span className="font-semibold text-gray-900">{row.title || 'Untitled Project'}</span> },
    { header: 'Description', accessor: 'description', render: (row) => <div className="max-w-[200px] truncate text-sm text-gray-500">{row.description || '-'}</div> },
    { header: 'Current Milestone', accessor: 'currentMilestone', render: (row) => <Badge variant="primary">{row.currentMilestone || 'Not Started'}</Badge> },
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'Completed' ? 'success' : 'warning'}>
        {row.status || 'Ongoing'}
      </Badge>
    )},
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        {row.repositoryLink && (
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => window.open(row.repositoryLink, '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-1" /> Repo
          </Button>
        )}
      </div>
    )}
  ];

  if (loading) {
    return (
      <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - My Projects">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={guideNavigation} title="KL CSE Capstone Portal - My Projects">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary-600" /> My Assigned Projects
            </h1>
            <p className="text-sm text-gray-500 mt-1">Monitor the status and repositories of groups you are guiding.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <Card>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="w-full md:w-96 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by title, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
               <Badge variant="primary" className="px-3 py-1.5 text-sm font-medium">
                 {filteredProjects.length} Projects
               </Badge>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            {filteredProjects.length > 0 ? (
              <Table columns={columns} data={filteredProjects} />
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={FileText}
                  title="No Projects Found"
                  description={searchQuery ? `No matches found for "${searchQuery}".` : "You have no assigned projects yet."}
                />
              </div>
            )}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default MyProjects;
