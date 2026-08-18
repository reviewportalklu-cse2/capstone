import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { useData } from '@/contexts/DataContext';
import { FirestoreService } from '@/firebase/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { UploadCloud, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

const ReviewerAssignmentImport = () => {
  const { teams, reviewers, getActiveReviewCycle, getAssignmentsByReviewCycle } = useData();
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState(null);

  const activeCycle = getActiveReviewCycle();

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
    setReport(null);
  };

  const processImport = async () => {
    if (!file || !activeCycle) return;
    setIsProcessing(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let imported = 0;
      let errors = 0;
      let skipped = 0;
      const errorLogs = [];

      const currentCycleAssignments = getAssignmentsByReviewCycle(activeCycle.id);

      for (const row of jsonData) {
        const teamId = row['Team ID'];
        const reviewerId = row['Reviewer ID'];
        
        if (!teamId || !reviewerId) {
          errors++;
          errorLogs.push(`Missing Team ID or Reviewer ID in row.`);
          continue;
        }

        const team = teams.find(t => t.id === teamId);
        const reviewer = reviewers.find(r => r.id === reviewerId);

        if (!team) {
          errors++;
          errorLogs.push(`Invalid Team ID: ${teamId}`);
          continue;
        }
        if (!reviewer) {
          errors++;
          errorLogs.push(`Invalid Reviewer ID: ${reviewerId}`);
          continue;
        }

        // Check for existing active assignment
        const existingAssignment = currentCycleAssignments.find(a => a.teamId === teamId && a.status === 'Active');
        if (existingAssignment?.reviewerId === reviewerId) {
          skipped++;
          continue; // Already assigned correctly
        }

        // 1. Deactivate old assignment if exists
        if (existingAssignment) {
          await FirestoreService.updateDocument('reviewerAssignments', existingAssignment.id, {
            status: 'Inactive',
            removedDate: new Date().toISOString()
          });
          
          await FirestoreService.createDocument('auditLogs', {
            user: currentUser.uid,
            role: 'admin',
            action: 'Reviewer Removed',
            teamId,
            reviewCycle: activeCycle.id,
            previousReviewer: existingAssignment.reviewerId,
            newReviewer: reviewerId,
            timestamp: new Date().toISOString()
          });
        }

        // 2. Create new assignment
        await FirestoreService.createDocument('reviewerAssignments', {
          reviewCycleId: activeCycle.id,
          teamId,
          projectId: team.projectId || '',
          reviewerId,
          reviewerName: reviewer.name,
          assignedBy: currentUser.uid,
          assignedDate: new Date().toISOString(),
          status: 'Active',
          timestamp: new Date().toISOString()
        });

        // 3. Update Team document
        await FirestoreService.updateDocument('teams', team.id, {
          currentReviewerId: reviewerId,
          currentReviewerName: reviewer.name,
          currentReviewCycleId: activeCycle.id,
          currentReviewCycleName: activeCycle.reviewName,
          lastReviewerUpdatedAt: new Date().toISOString()
        });

        // 4. Create Audit Log
        if (!existingAssignment) {
           await FirestoreService.createDocument('auditLogs', {
            user: currentUser.uid,
            role: 'admin',
            action: 'Reviewer Assigned',
            teamId,
            reviewCycle: activeCycle.id,
            newReviewer: reviewerId,
            timestamp: new Date().toISOString()
          });
        }

        // 5. Notify Reviewer
        await FirestoreService.createDocument('notifications', {
          title: 'New Team Assigned',
          message: `You have been assigned to team ${teamId} for ${activeCycle.reviewName}.`,
          targetRole: 'reviewer',
          recipientId: reviewerId,
          targetTeam: teamId,
          createdAt: new Date().toISOString(),
          read: false
        });

        imported++;
      }

      setReport({ imported, errors, skipped, errorLogs });

      // Notify Admin
      await FirestoreService.createDocument('notifications', {
        title: 'Reviewer Import Completed',
        message: `Import finished: ${imported} imported, ${skipped} skipped, ${errors} errors.`,
        targetRole: 'admin',
        createdAt: new Date().toISOString(),
        read: false
      });

    } catch (err) {
      console.error(err);
      alert('Failed to process import file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout navigationItems={adminNavigation} title="Reviewer Rotation Import">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reviewer Rotation Import</h1>
          <p className="text-sm text-gray-500 mt-1">Upload weekly reviewer assignments. Only applies to the active review cycle.</p>
        </div>

        {!activeCycle ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            No active review cycle found. Please activate a review cycle first in Review Cycles management.
          </div>
        ) : (
          <Card title={`Import Assignments for ${activeCycle.reviewName}`} icon={UploadCloud}>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-bold">Required Excel Columns:</p>
                  <p>Team ID, Reviewer ID</p>
                  <p className="mt-2">Note: This will safely archive existing active assignments for this cycle and assign the new ones without modifying history.</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-700">
                    {file ? file.name : 'Click to select Excel file'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">XLSX, XLS, or CSV</span>
                </label>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={processImport} 
                  disabled={!file || isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? 'Processing...' : 'Process Import'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {report && (
          <Card title="Import Report" icon={CheckCircle2}>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase">Successfully Assigned</p>
                <p className="text-2xl font-black text-emerald-700">{report.imported}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
                <p className="text-xs font-bold text-gray-500 uppercase">Skipped (No Change)</p>
                <p className="text-2xl font-black text-gray-700">{report.skipped}</p>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                <p className="text-xs font-bold text-red-600 uppercase">Errors</p>
                <p className="text-2xl font-black text-red-700">{report.errors}</p>
              </div>
            </div>

            {report.errorLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Error Logs</h4>
                <div className="bg-gray-50 rounded border border-gray-200 p-3 max-h-48 overflow-y-auto">
                  <ul className="text-xs text-red-600 space-y-1 list-disc pl-4">
                    {report.errorLogs.map((log, idx) => <li key={idx}>{log}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReviewerAssignmentImport;
