import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, studentService } from '@/firebase/services';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { Book, Users, Calendar, Link as LinkIcon, FileText, CheckCircle } from 'lucide-react';

const MyProjectDetails = () => {
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!currentUser?.uid) return;
        const studentData = await studentService.getStudentById(currentUser.uid);
        if (studentData?.projectId) {
           const projectData = await projectService.getProjectById(studentData.projectId);
           setProject(projectData);
        } else {
           // Maybe try to find project by teamName or student ID
           const allProjects = await projectService.getAll();
           const myProj = allProjects.find(p => p.studentIds?.includes(currentUser.uid) || p.teamName === studentData?.teamName);
           setProject(myProj || null);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState 
          icon={Book}
          title="No Project Assigned" 
          description="You have not been assigned to a project yet. Please contact your guide or administrator." 
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Project Workspace</h1>
        <Badge variant={project.status === 'completed' ? 'success' : 'primary'}>
          {project.status || 'Ongoing'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Project Overview" icon={FileText}>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {project.description || 'No description provided for this project yet. Update your project proposal to include a detailed description of your objectives and methodology.'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Domain</label>
                  <div className="text-sm font-medium text-gray-900">{project.domain || 'General'}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created On</label>
                  <div className="flex items-center text-sm font-medium text-gray-900">
                    <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                    {project.createdAt?.toDate ? new Date(project.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Submission Links">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded shadow-sm mr-3">
                    <LinkIcon className="h-5 w-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Project Repository</p>
                    <p className="text-xs text-gray-500">GitHub / GitLab Link</p>
                  </div>
                </div>
                {project.repoLink ? (
                  <a href={project.repoLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-600 hover:text-primary-700">View</a>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">Not added</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded shadow-sm mr-3">
                    <Book className="h-5 w-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Documentation</p>
                    <p className="text-xs text-gray-500">Drive / Notion Link</p>
                  </div>
                </div>
                {project.docLink ? (
                  <a href={project.docLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-600 hover:text-primary-700">View</a>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">Not added</span>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Team Details" className="h-fit">
            <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
              <div className="bg-primary-50 p-2.5 rounded-lg mr-3">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Team Name</p>
                <p className="text-base font-bold text-gray-900">{project.teamName || 'Unknown Team'}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900 mb-2">Members</p>
              {project.studentIds?.length > 0 ? (
                project.studentIds.map((id, index) => (
                  <div key={id} className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 mr-2 text-success" />
                    Student UID: {id.substring(0, 8)}...
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No members listed.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyProjectDetails;
