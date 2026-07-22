import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reviewerNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { DatabaseBackup, FileText, Download } from 'lucide-react';

const ExportData = () => {
  const handleExport = (type) => {
    alert(`Generating ${type} export... (Simulated download)`);
  };

  return (
    <DashboardLayout navigationItems={reviewerNavigation} title="CapstoneFlow - Export Data">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <DatabaseBackup className="h-6 w-6 text-primary-600" /> Data Export
            </h1>
            <p className="text-sm text-gray-500 mt-1">Export review evaluations and student marks for offline analysis or university records.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:border-primary-300 transition-colors">
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-primary-50 p-4 rounded-full text-primary-600 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Student Evaluation Summary</h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">Complete CSV mapping of assigned students and their current progress stages.</p>
              <Button onClick={() => handleExport('Student Summary')} className="w-full justify-center">
                <Download className="w-4 h-4 mr-2" /> Download CSV
              </Button>
            </div>
          </Card>

          <Card className="hover:border-emerald-300 transition-colors">
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-emerald-50 p-4 rounded-full text-emerald-600 mb-4">
                <DatabaseBackup className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Comprehensive Marks Dump</h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">Detailed spreadsheet containing Presentation, Technical, and QA scores across all reviews.</p>
              <Button variant="outline" onClick={() => handleExport('Comprehensive Marks')} className="w-full justify-center border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                <Download className="w-4 h-4 mr-2" /> Download Excel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExportData;
