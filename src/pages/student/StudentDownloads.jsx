import React, { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Download, FileText, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { useData } from '@/contexts/DataContext';
import EmptyState from '@/components/common/EmptyState';

const StudentDownloads = () => {
  const { getStudentEvaluations, dataLoading } = useStudentAnalytics();
  const { settings } = useData();

  const isPublished = useMemo(() => {
    const pubSettings = settings?.find(s => s.id === 'resultPublication');
    return pubSettings?.isPublished || false; // default false
  }, [settings]);

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Downloads">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const evaluations = getStudentEvaluations();

  return (
    <DashboardLayout navigationItems={studentNavigation} title="Downloads">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Download className="h-6 w-6 text-primary-600" /> Official Documents
            </h1>
            <p className="text-sm text-gray-500 mt-1">Download your official evaluations, attendance reports, and semester results.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Official Result Transcripts" className="shadow-sm">
            {isPublished ? (
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-green-900">Official Semester Result</h4>
                      <p className="text-xs text-green-700">Final Marksheet • PDF</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 border border-dashed border-gray-200 mt-2 rounded-lg bg-gray-50">
                <EmptyState 
                  icon={Lock}
                  title="Results Not Published"
                  description="Your official semester transcripts will be available for download once the department publishes them."
                />
              </div>
            )}
          </Card>

          <Card title="Published Evaluations" className="shadow-sm">
            {evaluations && evaluations.length > 0 ? (
              <div className="divide-y divide-gray-100 mt-2">
                {evaluations.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between py-4 hover:bg-gray-50 px-2 rounded transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{ev.cycleName} Transcript</h4>
                        <p className="text-xs text-gray-500">Evaluation Record • PDF</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Download className="w-4 h-4" /> PDF
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 mt-2">
                <EmptyState 
                  icon={CheckCircle}
                  title="No Evaluations Found"
                  description="Your formal evaluations will appear here for download after they are completed."
                />
              </div>
            )}
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default StudentDownloads;
