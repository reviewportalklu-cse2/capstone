import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { facultyNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import { Upload, FileUp, AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react';
import { marksService } from '@/firebase/services/marksService';
import { useAuth } from '@/contexts/AuthContext';

const BulkMarks = () => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      setError("File appears to be empty or missing data rows.");
      return;
    }
    
    // Simple naive CSV parser (assumes standard comma separation without complex escaping)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const requiredHeaders = ['rollnumber', 'marks'];
    const missing = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missing.length > 0) {
      setError(`Missing required columns: ${missing.join(', ')}`);
      return;
    }

    const data = lines.slice(1).map((line, idx) => {
      const values = line.split(',');
      const row = { id: idx };
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      
      // Validation
      row.status = 'Valid';
      if (!row.rollnumber) row.status = 'Missing Roll No';
      else if (isNaN(row.marks) || row.marks === '') row.status = 'Invalid Marks';
      else if (Number(row.marks) < 0 || Number(row.marks) > 100) row.status = 'Marks out of range';
      
      return row;
    });

    setPreviewData(data);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (e) => processCSV(e.target.result);
      reader.readAsText(droppedFile);
    } else {
      setError("Please upload a valid CSV file.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => processCSV(e.target.result);
      reader.readAsText(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewData([]);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    const validRows = previewData.filter(r => r.status === 'Valid');
    if (validRows.length === 0) return;

    setSubmitting(true);
    setSuccess(false);
    
    try {
      // Simulate bulk upload processing via Promise.all
      const promises = validRows.map(row => 
        marksService.addFacultyMark({
          facultyId: currentUser?.uid,
          rollNumber: row.rollnumber, // We use rollnumber here as an identifier since we don't have UID from CSV easily
          marks: Number(row.marks),
          total: 100, // Defaulting to 100 or extracting from CSV if available
          comments: row.comments || 'Bulk Uploaded',
          submittedAt: new Date().toISOString()
        })
      );
      
      await Promise.all(promises);
      setSuccess(true);
      setTimeout(() => {
        clearFile();
      }, 3000);
    } catch (err) {
      console.error("Bulk upload failed:", err);
      setError("Failed to upload marks to the database.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Roll Number', accessor: 'rollnumber', render: (row) => <span className="font-semibold">{row.rollnumber}</span> },
    { header: 'Marks', accessor: 'marks' },
    { header: 'Comments', accessor: 'comments', render: (row) => row.comments || '-' },
    { header: 'Status', render: (row) => (
      <Badge variant={row.status === 'Valid' ? 'success' : 'danger'}>
        {row.status}
      </Badge>
    )}
  ];

  const validCount = previewData.filter(r => r.status === 'Valid').length;
  const invalidCount = previewData.length - validCount;

  return (
    <DashboardLayout navigationItems={facultyNavigation} title="KL CSE Capstone Portal - Bulk Upload Marks">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bulk Upload Marks</h1>
          <p className="text-sm text-gray-500 mt-1">Upload a CSV file to evaluate multiple students simultaneously.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-200">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Successfully imported {validCount} student marks!</p>
          </div>
        )}

        <Card>
          {!file ? (
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileUp className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Click or drag file to upload</h3>
              <p className="text-sm text-gray-500 mt-1">Strictly CSV formats only. Download the <a href="#" className="text-primary-600 hover:underline" onClick={e => e.stopPropagation()}>Template File</a>.</p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-2 rounded text-primary-700">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB • {previewData.length} rows detected</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFile} className="text-gray-500 hover:text-red-500">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {previewData.length > 0 && (
                <div>
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      {validCount} Valid rows
                    </div>
                    {invalidCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        {invalidCount} Invalid rows
                      </div>
                    )}
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                     <Table columns={columns} data={previewData} />
                  </div>
                  
                  <div className="flex justify-end mt-6 gap-3">
                    <Button variant="outline" onClick={clearFile} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={validCount === 0 || submitting}>
                      {submitting ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Importing...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Import {validCount} Records</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BulkMarks;
