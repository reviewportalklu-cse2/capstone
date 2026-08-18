import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { FirestoreService } from '@/firebase/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Save, AlertTriangle } from 'lucide-react';
import Badge from '@/components/common/Badge';

const AcademicRules = ({ settings }) => {
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  
  // Default values
  const defaultWeights = { guideWeight: 30, facultyWeight: 20, reviewerWeight: 50 };
  const defaultRules = { minimumPassPercentage: 50, requireGuidePass: false, requireFacultyPass: false, requireReviewerPass: false, attendanceMandatory: true, minimumAttendance: 75 };
  
  const [academicWeights, setAcademicWeights] = useState(defaultWeights);
  const [resultRules, setResultRules] = useState(defaultRules);
  const [error, setError] = useState(null);

  useEffect(() => {
    const aw = settings.find(s => s.id === 'academicWeights');
    const rr = settings.find(s => s.id === 'resultRules');
    
    if (aw) setAcademicWeights({ guideWeight: aw.guideWeight, facultyWeight: aw.facultyWeight, reviewerWeight: aw.reviewerWeight });
    if (rr) setResultRules(rr);
  }, [settings]);

  const handleSave = async () => {
    const total = Number(academicWeights.guideWeight) + Number(academicWeights.facultyWeight) + Number(academicWeights.reviewerWeight);
    if (total !== 100) {
      setError(`Weights must equal exactly 100%. Current total: ${total}%`);
      return;
    }
    
    setError(null);
    setSaving(true);
    
    try {
      const timestamp = new Date().toISOString();
      const updatedBy = currentUser.email;

      // Save Academic Weights
      await FirestoreService.updateDocument('settings', 'academicWeights', {
        ...academicWeights,
        guideWeight: Number(academicWeights.guideWeight),
        facultyWeight: Number(academicWeights.facultyWeight),
        reviewerWeight: Number(academicWeights.reviewerWeight),
        updatedBy,
        updatedAt: timestamp
      });

      // Save Result Rules
      await FirestoreService.updateDocument('settings', 'resultRules', {
        ...resultRules,
        minimumPassPercentage: Number(resultRules.minimumPassPercentage),
        minimumAttendance: Number(resultRules.minimumAttendance),
        updatedBy,
        updatedAt: timestamp
      });

      // Log Audit
      await FirestoreService.addDocument('auditLogs', {
        action: 'UPDATE_ACADEMIC_RULES',
        user: updatedBy,
        role: 'Admin',
        timestamp,
        details: 'Updated academic weights and passing criteria.'
      });

    } catch (err) {
      console.error(err);
      setError('Failed to save settings. Please ensure documents exist in the collection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <Card title="Academic Weights (%)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input 
            label="Guide Weight" 
            type="number" 
            value={academicWeights.guideWeight} 
            onChange={e => setAcademicWeights(prev => ({ ...prev, guideWeight: e.target.value }))}
          />
          <Input 
            label="Faculty Weight" 
            type="number" 
            value={academicWeights.facultyWeight} 
            onChange={e => setAcademicWeights(prev => ({ ...prev, facultyWeight: e.target.value }))}
          />
          <Input 
            label="Reviewer Weight" 
            type="number" 
            value={academicWeights.reviewerWeight} 
            onChange={e => setAcademicWeights(prev => ({ ...prev, reviewerWeight: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">The total weight must exactly equal 100%.</p>
          <Badge variant={Number(academicWeights.guideWeight) + Number(academicWeights.facultyWeight) + Number(academicWeights.reviewerWeight) === 100 ? 'success' : 'danger'}>
            Total: {Number(academicWeights.guideWeight) + Number(academicWeights.facultyWeight) + Number(academicWeights.reviewerWeight)}%
          </Badge>
        </div>
      </Card>

      <Card title="Passing Rules & Criteria">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Minimum Pass Percentage (%)" 
            type="number" 
            value={resultRules.minimumPassPercentage} 
            onChange={e => setResultRules(prev => ({ ...prev, minimumPassPercentage: e.target.value }))}
          />
          <Input 
            label="Minimum Attendance (%)" 
            type="number" 
            value={resultRules.minimumAttendance} 
            onChange={e => setResultRules(prev => ({ ...prev, minimumAttendance: e.target.value }))}
          />
        </div>
        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={resultRules.attendanceMandatory}
              onChange={e => setResultRules(prev => ({ ...prev, attendanceMandatory: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Attendance Mandatory (Fail if below minimum)</span>
          </label>
          <label className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={resultRules.requireGuidePass}
              onChange={e => setResultRules(prev => ({ ...prev, requireGuidePass: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Require separate passing grade for Guide marks</span>
          </label>
          <label className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={resultRules.requireFacultyPass}
              onChange={e => setResultRules(prev => ({ ...prev, requireFacultyPass: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Require separate passing grade for Faculty marks</span>
          </label>
          <label className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={resultRules.requireReviewerPass}
              onChange={e => setResultRules(prev => ({ ...prev, requireReviewerPass: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Require separate passing grade for Reviewer evaluations</span>
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};

export default AcademicRules;
