import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Download, FileText, File as FileIcon, Archive, Upload } from 'lucide-react';

const StudentDownloads = () => {

  const resources = [
    { id: 1, title: 'Capstone Project Guidelines 2026', type: 'PDF', size: '2.4 MB', icon: FileText, color: 'text-red-500' },
    { id: 2, title: 'Report Formatting Template', type: 'DOCX', size: '1.1 MB', icon: FileIcon, color: 'text-blue-500' },
    { id: 3, title: 'Review 1 Presentation Template', type: 'PPTX', size: '4.5 MB', icon: FileIcon, color: 'text-orange-500' },
    { id: 4, title: 'Standard UML Diagram Examples', type: 'ZIP', size: '8.2 MB', icon: Archive, color: 'text-purple-500' }
  ];

  const handleDownload = (title) => {
    alert(`Downloading ${title}... (Simulated)`);
  };

  const handleUpload = () => {
    alert(`Upload dialog opened. (Simulated)`);
  };

  return (
    <DashboardLayout navigationItems={studentNavigation} title="CapstoneFlow - Downloads">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Download className="h-6 w-6 text-primary-600" /> Resources & Submissions
            </h1>
            <p className="text-sm text-gray-500 mt-1">Download official guidelines and manage your project document uploads.</p>
          </div>
          <Button onClick={handleUpload} className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Official Department Resources">
            <div className="divide-y divide-gray-100 mt-2">
              {resources.map(res => (
                <div key={res.id} className="flex items-center justify-between py-4 hover:bg-gray-50 px-2 rounded transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-gray-100 rounded-lg ${res.color}`}>
                      <res.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{res.title}</h4>
                      <p className="text-xs text-gray-500">{res.type} • {res.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(res.title)}>
                    <Download className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="My Submissions">
            <div className="space-y-4 mt-2">
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={handleUpload}>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-gray-900">Upload Project Proposal</h4>
                <p className="text-xs text-gray-500 mt-1">PDF format only. Max 10MB.</p>
              </div>

              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={handleUpload}>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-gray-900">Upload Review 1 Slides</h4>
                <p className="text-xs text-gray-500 mt-1">PPTX/PDF format. Max 20MB.</p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default StudentDownloads;
