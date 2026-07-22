import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { guideNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Download, FileText, FileSpreadsheet, Presentation, FolderArchive } from 'lucide-react';

const GuideDownloads = () => {
  const resources = [
    { id: 1, title: 'Project Proposal Template', type: 'Word Document', size: '124 KB', icon: FileText, url: '#' },
    { id: 2, title: 'Review Evaluation Rubric', type: 'PDF Document', size: '845 KB', icon: FileText, url: '#' },
    { id: 3, title: 'Bulk Marks Upload Template', type: 'Excel Spreadsheet', size: '42 KB', icon: FileSpreadsheet, url: '#' },
    { id: 4, title: 'Final Presentation Format', type: 'PowerPoint', size: '2.1 MB', icon: Presentation, url: '#' },
    { id: 5, title: 'Source Code Packaging Guide', type: 'PDF Document', size: '1.2 MB', icon: FolderArchive, url: '#' },
  ];

  return (
    <DashboardLayout navigationItems={guideNavigation} title="CapstoneFlow - Downloads">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Download className="h-6 w-6 text-primary-600" /> Reference Downloads
          </h1>
          <p className="text-sm text-gray-500 mt-1">Access university-approved templates, guidelines, and evaluation rubrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow group">
              <div className="flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-primary-50 text-primary-600 rounded-lg group-hover:bg-primary-100 transition-colors">
                    <resource.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 leading-tight">{resource.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{resource.type} • {resource.size}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <Button variant="outline" className="w-full text-sm flex items-center justify-center gap-2 group-hover:bg-primary-50 transition-colors">
                    <Download className="w-4 h-4" /> Download File
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default GuideDownloads;
