import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Download, FileSpreadsheet, Database, CheckCircle2, Loader2 } from 'lucide-react';
import { evaluationCenterService } from '@/firebase/services/evaluationCenterService';
import { exportToCSV, exportToExcel } from '@/utils/ReportExporter';

const EvaluationExportCenter = () => {
  const [exporting, setExporting] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchExportData = async () => {
    const teams = await evaluationCenterService.getAllTeamsWithEvaluations();
    return teams.map(t => ({
      'Team ID': t.teamId || t.id,
      'Project Title': t.projectTitle || t.teamName || t.title || 'N/A',
      'Review Cycle': 'Review 1',
      'Guide Evaluator': t.guideName || 'Unassigned',
      'Guide Employee ID': t.guideEmployeeId || t.guideId || 'N/A',
      'Guide Score': t.guideMarks !== null && t.guideMarks !== undefined ? t.guideMarks : 'PENDING',
      'Guide Status': t.guideMarks !== null && t.guideMarks !== undefined ? 'Submitted' : 'PENDING',
      'Faculty Evaluator': t.facultyPanelName || t.facultyName || 'Unassigned',
      'Faculty Employee ID': t.facultyEmployeeId || t.facultyId || 'N/A',
      'Faculty Score': t.facultyMarks !== null && t.facultyMarks !== undefined ? t.facultyMarks : 'PENDING',
      'Faculty Status': t.facultyMarks !== null && t.facultyMarks !== undefined ? 'Submitted' : 'PENDING',
      'Reviewer Evaluator': t.reviewerName || 'Unassigned',
      'Reviewer Employee ID': t.reviewerEmployeeId || t.reviewerId || 'N/A',
      'Reviewer Score': t.review1Score !== null && t.review1Score !== undefined ? t.review1Score : 'PENDING',
      'Reviewer Status': t.review1Score !== null && t.review1Score !== undefined ? 'Submitted' : 'PENDING',
      'Final Score': t.finalScore !== null && t.finalScore !== undefined ? t.finalScore : 'PENDING',
      'Grade': t.finalScore !== null && t.finalScore !== undefined ? (t.grade || 'N/A') : 'PENDING',
      'Latest Submitted Date': t.latestEvalDate && t.latestEvalDate !== 'Pending' ? t.latestEvalDate : 'PENDING'
    }));
  };

  const handleExportCSV = async () => {
    try {
      setExporting('csv');
      const rows = await fetchExportData();
      exportToCSV('evaluation_master_report', rows);
      setSuccessMessage('CSV export generated successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('CSV Export Error:', err);
      alert('Failed to export CSV dataset.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting('xlsx');
      const rows = await fetchExportData();
      exportToExcel('evaluation_master_report', rows);
      setSuccessMessage('Excel workbook generated successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('Failed to export Excel workbook.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportJSON = async () => {
    try {
      setExporting('json');
      const teams = await evaluationCenterService.getAllTeamsWithEvaluations();
      const blob = new Blob([JSON.stringify(teams, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'evaluation_master_backup.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage('JSON backup generated successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('JSON Export Error:', err);
      alert('Failed to export JSON backup.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary-600" /> Multi-Format Enterprise Export Engine
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Export live evaluation data across teams, students, rubrics, and marks version histories directly into standard format datasets.
        </p>

        {successMessage && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-xl bg-gray-50 text-center space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-green-600 mx-auto" />
            <div className="font-bold text-sm text-gray-900">Export CSV Dataset</div>
            <p className="text-xs text-gray-500">Full spreadsheet format compatible with Excel and Google Sheets.</p>
            <Button 
              size="xs" 
              variant="outline" 
              fullWidth 
              onClick={handleExportCSV}
              disabled={exporting !== null}
            >
              {exporting === 'csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Download CSV'}
            </Button>
          </div>

          <div className="p-4 border rounded-xl bg-gray-50 text-center space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-blue-600 mx-auto" />
            <div className="font-bold text-sm text-gray-900">Export Excel (.xlsx)</div>
            <p className="text-xs text-gray-500">Formatted workbook with standard columns and unsubmitted scores as PENDING.</p>
            <Button 
              size="xs" 
              variant="outline" 
              fullWidth 
              onClick={handleExportExcel}
              disabled={exporting !== null}
            >
              {exporting === 'xlsx' ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Download XLSX'}
            </Button>
          </div>

          <div className="p-4 border rounded-xl bg-gray-50 text-center space-y-3">
            <Database className="w-8 h-8 text-indigo-600 mx-auto" />
            <div className="font-bold text-sm text-gray-900">Export JSON Backup</div>
            <p className="text-xs text-gray-500">Complete raw Firestore collection structure export.</p>
            <Button 
              size="xs" 
              variant="outline" 
              fullWidth 
              onClick={handleExportJSON}
              disabled={exporting !== null}
            >
              {exporting === 'json' ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Download JSON'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EvaluationExportCenter;
