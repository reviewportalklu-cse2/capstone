import React from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Download, FileSpreadsheet, Database, CheckCircle2 } from 'lucide-react';

const EvaluationExportCenter = () => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary-600" /> Multi-Format Enterprise Export Engine
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Export live evaluation data across teams, students, rubrics, and marks version histories directly into standard format datasets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-xl bg-gray-50 text-center space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-green-600 mx-auto" />
            <div className="font-bold text-sm text-gray-900">Export CSV Dataset</div>
            <p className="text-xs text-gray-500">Full spreadsheet format compatible with Excel and Google Sheets.</p>
            <Button size="xs" variant="outline" fullWidth onClick={() => alert("CSV Exporting initiated")}>
              Download CSV
            </Button>
          </div>

          <div className="p-4 border rounded-xl bg-gray-50 text-center space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-blue-600 mx-auto" />
            <div className="font-bold text-sm text-gray-900">Export Excel (.xlsx)</div>
            <p className="text-xs text-gray-500">Formatted workbook with separate sheets for Teams, Students & Rubrics.</p>
            <Button size="xs" variant="outline" fullWidth onClick={() => alert("Excel Exporting initiated")}>
              Download XLSX
            </Button>
          </div>

          <div className="p-4 border rounded-xl bg-gray-50 text-center space-y-3">
            <Database className="w-8 h-8 text-indigo-600 mx-auto" />
            <div className="font-bold text-sm text-gray-900">Export JSON Backup</div>
            <p className="text-xs text-gray-500">Complete raw Firestore collection structure export.</p>
            <Button size="xs" variant="outline" fullWidth onClick={() => alert("JSON Exporting initiated")}>
              Download JSON
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EvaluationExportCenter;
