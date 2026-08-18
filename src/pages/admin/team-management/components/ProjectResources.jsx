import React from 'react';
import Card from '@/components/common/Card';
import { Link, Code, FileText, MonitorPlay, FileCheck, FolderOpen } from 'lucide-react';

const ResourceItem = ({ icon: Icon, title, link }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 transition-all hover:bg-gray-100/50 hover:border-gray-200">
    <div className="flex items-center">
      <div className="bg-white p-2 rounded shadow-sm mr-3">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
    </div>
    {link ? (
      <a href={link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
        View
      </a>
    ) : (
      <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-100 rounded-full">Not Available</span>
    )}
  </div>
);

const ProjectResources = ({ teamData }) => {
  const project = teamData.project || {};
  
  return (
    <Card title="Project Resources" icon={FolderOpen}>
      <div className="space-y-3">
        <ResourceItem 
          icon={FileText} 
          title="Project Proposal" 
          link={project.proposalLink || project.docLink} 
        />
        <ResourceItem 
          icon={MonitorPlay} 
          title="Presentation (PPT)" 
          link={project.pptLink} 
        />
        <ResourceItem 
          icon={Code} 
          title="Code Repository" 
          link={project.repoLink} 
        />
        <ResourceItem 
          icon={FileCheck} 
          title="Final Report" 
          link={project.finalReportLink} 
        />
      </div>
    </Card>
  );
};

export default ProjectResources;
