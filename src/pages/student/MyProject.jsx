import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/firebase/services/projectService';
import { studentService } from '@/firebase/services/studentService';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { Book, Users, Calendar, Link as LinkIcon, FileText, CheckCircle, Save, Loader2, Target, Code } from 'lucide-react';

const MyProject = () => {
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    repoLink: '',
    docLink: '',
    technologies: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchProject(currentUser.uid);
    }
  }, [currentUser]);

  const fetchProject = async (uid) => {
    try {
      setLoading(true);
      const studentData = await studentService.getById(uid);
      if (studentData) {
        const projects = await projectService.getByStudentId(uid);
        if (projects.length > 0) {
          const proj = projects[0];
          setProject(proj);
          setFormData({
            description: proj.description || '',
            repoLink: proj.repoLink || '',
            docLink: proj.docLink || '',
            technologies: proj.technologies || ''
          });
        }
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project) return;
    
    setSubmitting(true);
    try {
      await projectService.update(project.id, {
        description: formData.description,
        repoLink: formData.repoLink,
        docLink: formData.docLink,
        technologies: formData.technologies,
        updatedAt: new Date().toISOString()
      });
      setProject(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update project:", err);
      alert("Failed to update project details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="KL CSE Capstone Portal - My Project">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="KL CSE Capstone Portal - My Project">
        <div className="p-6 max-w-4xl mx-auto py-12">
          <EmptyState 
            icon={Target}
            title="No Project Assigned" 
            description="You have not been assigned to a project yet. Please coordinate with your faculty to form a team and register your capstone project." 
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={studentNavigation} title="KL CSE Capstone Portal - My Project">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Book className="h-6 w-6 text-primary-600" /> Project Workspace
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your project definition, links, and technologies.</p>
          </div>
          <Badge variant={project.status === 'Completed' ? 'success' : 'primary'} className="px-3 py-1 text-sm font-medium">
            {project.status || 'Active'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="text-xl font-bold text-gray-900">Edit Project Details</h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button type="submit" size="sm" disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Save
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                    <textarea 
                      required
                      rows={5}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 border resize-y"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Detail your core objectives and approach..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
                    <Input 
                      value={formData.technologies}
                      onChange={(e) => setFormData({...formData, technologies: e.target.value})}
                      placeholder="e.g. React, Node.js, Python, TensorFlow"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Repository Link</label>
                      <Input 
                        type="url"
                        value={formData.repoLink}
                        onChange={(e) => setFormData({...formData, repoLink: e.target.value})}
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documentation Link</label>
                      <Input 
                        type="url"
                        value={formData.docLink}
                        onChange={(e) => setFormData({...formData, docLink: e.target.value})}
                        placeholder="Google Drive, Notion, etc."
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{project.title}</h3>
                      <p className="text-sm font-medium text-primary-600">Domain: {project.domain || 'General'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Details</Button>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {project.description || 'No description provided. Click Edit Details to add one.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Technologies Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies ? project.technologies.split(',').map((tech, i) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {tech.trim()}
                        </span>
                      )) : (
                        <span className="text-sm text-gray-500">Not specified</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center">
                        <Code className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Code Repository</p>
                        </div>
                      </div>
                      {project.repoLink ? (
                        <a href={project.repoLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-600 hover:text-primary-700">View</a>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Missing</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center">
                        <LinkIcon className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Documentation</p>
                        </div>
                      </div>
                      {project.docLink ? (
                        <a href={project.docLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-600 hover:text-primary-700">View</a>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Missing</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Team Structure" className="h-fit">
              <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
                <div className="bg-primary-50 p-2.5 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Team Handle</p>
                  <p className="text-base font-bold text-gray-900">{project.teamName || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Members</p>
                {project.studentIds?.length > 0 ? (
                  project.studentIds.map((id, index) => (
                    <div key={id} className="flex items-center text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                      <CheckCircle className="h-4 w-4 mr-2 text-success flex-shrink-0" />
                      Student ({id.substring(0, 5)})
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No members listed.</div>
                )}
              </div>
            </Card>
            
            <Card title="Project Dates">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Initialized</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Last Updated</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyProject;
