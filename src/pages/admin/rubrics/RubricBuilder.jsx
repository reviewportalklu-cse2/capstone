import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { useData } from '@/contexts/DataContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FirestoreService } from '@/firebase/services/firestore';
import { Layers, ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle, CheckCircle, Send } from 'lucide-react';

const RubricBuilder = () => {
  const { id, rubricId } = useParams();
  const activeRubricId = rubricId || id;
  const navigate = useNavigate();
  const { rubrics, rubricCriteria, dataLoading } = useData();

  const [rubric, setRubric] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [deletedCriteriaIds, setDeletedCriteriaIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (dataLoading || !rubrics) return;

    if (!activeRubricId || activeRubricId === 'new' || activeRubricId === 'create') {
      if (!rubric || rubric.id !== 'new') {
        setRubric({
          id: 'new',
          rubricId: 'new',
          title: 'New Evaluation Rubric',
          reviewCycle: 'Review 3',
          reviewCycleId: 'Review 3',
          version: '1.0',
          status: 'Draft',
          totalMarks: 50,
          academicYear: '2026',
          semester: 'Odd',
          department: 'CSE',
          criteria: []
        });
        setCriteria([]);
      }
      return;
    }

    const cleanActiveId = String(activeRubricId).trim().toLowerCase();

    // Find rubric by doc ID, id, or rubricId
    let r = rubrics.find(x =>
      String(x.id || '').toLowerCase() === cleanActiveId ||
      String(x._id || '').toLowerCase() === cleanActiveId ||
      String(x.rubricId || '').toLowerCase() === cleanActiveId
    );

    if (r) {
      setRubric({
        ...r,
        totalMarks: r.totalMarks !== undefined ? Number(r.totalMarks) : 50
      });

      const targetIds = new Set([r.id, r._id, r.rubricId, activeRubricId].filter(Boolean).map(s => String(s).toLowerCase()));

      // Look up criteria in rubricCriteria collection first
      let c = (rubricCriteria || [])
        .filter(x => targetIds.has(String(x.rubricId || '').toLowerCase()))
        .sort((a, b) => (a.displayOrder || a.order || 0) - (b.displayOrder || b.order || 0));

      if (c.length === 0 && Array.isArray(r.criteria) && r.criteria.length > 0) {
        c = r.criteria;
      }

      if (c.length > 0) {
        setCriteria(c.map((item, idx) => ({
          ...item,
          id: item.id || `crit_${r.id || activeRubricId}_${idx + 1}`,
          criterionId: item.criterionId || item.id || `c${idx + 1}`,
          title: item.title || item.criterionName || item.name || `Criterion ${idx + 1}`,
          criterionName: item.criterionName || item.title || item.name || `Criterion ${idx + 1}`,
          name: item.name || item.title || item.criterionName || `Criterion ${idx + 1}`,
          description: item.description || '',
          maximumMarks: item.maximumMarks !== undefined ? item.maximumMarks : (item.maxMarks !== undefined ? item.maxMarks : 10),
          maxMarks: item.maximumMarks !== undefined ? item.maximumMarks : (item.maxMarks !== undefined ? item.maxMarks : 10),
          weight: Number(item.weight || item.weightage || 1.0),
          displayOrder: idx + 1,
          order: idx + 1
        })));
      } else {
        setCriteria([]);
      }
    }
  }, [rubrics, rubricCriteria, activeRubricId, dataLoading]);

  const handleAddCriterion = () => {
    const nextIdx = criteria.length + 1;
    setCriteria([
      ...criteria,
      {
        id: `temp-${Date.now()}-${nextIdx}`,
        criterionId: `c${nextIdx}`,
        isNew: true,
        title: '',
        criterionName: '',
        name: '',
        description: '',
        category: 'Technical',
        maximumMarks: 10,
        maxMarks: 10,
        weight: 1.0,
        weightage: 1.0,
        displayOrder: nextIdx,
        order: nextIdx,
        status: 'Active'
      }
    ]);
  };

  const handleRemoveCriterion = (index, criterionId) => {
    if (criterionId && !String(criterionId).startsWith('temp-')) {
      setDeletedCriteriaIds(prev => [...prev, criterionId]);
    }
    const newC = [...criteria];
    newC.splice(index, 1);
    const reindexed = newC.map((item, i) => ({
      ...item,
      displayOrder: i + 1,
      order: i + 1
    }));
    setCriteria(reindexed);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newC = [...criteria];
    const temp = newC[index - 1];
    newC[index - 1] = newC[index];
    newC[index] = temp;
    const reindexed = newC.map((item, i) => ({
      ...item,
      displayOrder: i + 1,
      order: i + 1
    }));
    setCriteria(reindexed);
  };

  const handleMoveDown = (index) => {
    if (index === criteria.length - 1) return;
    const newC = [...criteria];
    const temp = newC[index + 1];
    newC[index + 1] = newC[index];
    newC[index] = temp;
    const reindexed = newC.map((item, i) => ({
      ...item,
      displayOrder: i + 1,
      order: i + 1
    }));
    setCriteria(reindexed);
  };

  const handleCriterionChange = (index, field, value) => {
    const newC = [...criteria];
    if (field === 'maximumMarks') {
      // Do NOT silently convert to 0. Preserve input for validation
      newC[index].maximumMarks = value === '' ? '' : (isNaN(Number(value)) ? value : Number(value));
      newC[index].maxMarks = newC[index].maximumMarks;
    } else if (field === 'title') {
      newC[index].title = value;
      newC[index].criterionName = value;
      newC[index].name = value;
    } else if (field === 'weight') {
      newC[index].weight = value === '' ? '' : (isNaN(Number(value)) ? value : Number(value));
      newC[index].weightage = newC[index].weight;
    } else {
      newC[index][field] = value;
    }
    setCriteria(newC);
  };

  // Validation
  const targetTotal = rubric?.totalMarks !== undefined ? Number(rubric.totalMarks) : 50;

  const calculatedTotal = criteria.reduce((sum, c) => {
    const val = Number(c.maximumMarks !== undefined ? c.maximumMarks : c.maxMarks);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const getValidationErrors = (forPublish = false) => {
    const errors = [];

    if (!rubric?.title?.trim()) {
      errors.push('Rubric Title is required.');
    }
    if (!rubric?.reviewCycle?.trim()) {
      errors.push('Review Cycle is required.');
    }
    if (isNaN(targetTotal) || targetTotal <= 0) {
      errors.push('Target Total Marks must be a valid positive number.');
    }
    if (criteria.length === 0) {
      errors.push('At least one criterion is required.');
    }

    criteria.forEach((c, idx) => {
      const name = (c.title || c.criterionName || c.name || '').trim();
      if (!name) {
        errors.push(`Criterion ${idx + 1}: Name / Title is missing.`);
      }

      const rawMarks = c.maximumMarks !== undefined ? c.maximumMarks : c.maxMarks;
      if (rawMarks === '' || rawMarks === null || rawMarks === undefined) {
        errors.push(`Criterion ${idx + 1} ("${name || 'Untitled'}"): Maximum Marks is missing.`);
      } else {
        const num = Number(rawMarks);
        if (isNaN(num)) {
          errors.push(`Criterion ${idx + 1} ("${name || 'Untitled'}"): Maximum Marks cannot be NaN.`);
        } else if (num < 0) {
          errors.push(`Criterion ${idx + 1} ("${name || 'Untitled'}"): Maximum Marks cannot be negative (${num}).`);
        } else if (num === 0) {
          errors.push(`Criterion ${idx + 1} ("${name || 'Untitled'}"): Maximum Marks must be greater than 0.`);
        }
      }
    });

    if (forPublish && calculatedTotal !== targetTotal) {
      errors.push(`Publishing blocked: Calculated Criteria Total (${calculatedTotal}) must match configured Total Marks (${targetTotal}). Difference: ${calculatedTotal - targetTotal}.`);
    }

    return errors;
  };

  const validationErrors = getValidationErrors(rubric?.status === 'Published');
  const isValidTotal = calculatedTotal === targetTotal && validationErrors.length === 0;

  const handleSave = async (publishRequested = false) => {
    const intendedStatus = publishRequested ? 'Published' : (rubric?.status || 'Draft');
    const errors = getValidationErrors(intendedStatus === 'Published');

    if (intendedStatus === 'Published' && errors.length > 0) {
      alert(`Cannot publish rubric. Please correct the following issues:\n\nâ€¢ ${errors.join('\nâ€¢ ')}`);
      return;
    }

    // For Draft, still block negative marks, NaN, or missing names
    const draftErrors = getValidationErrors(false);
    if (draftErrors.length > 0) {
      alert(`Cannot save rubric. Please correct the following issues:\n\nâ€¢ ${draftErrors.join('\nâ€¢ ')}`);
      return;
    }

    setIsSaving(true);
    try {
      let targetRubricId = rubric?.id || activeRubricId;
      const now = new Date().toISOString();

      // 1. Delete removed criteria from Firestore rubricCriteria
      for (const delId of deletedCriteriaIds) {
        try {
          await FirestoreService.deleteDocument('rubricCriteria', delId);
        } catch (err) {
          console.warn("Could not delete criterion:", delId, err);
        }
      }
      setDeletedCriteriaIds([]);

      // 2. Handle creating/updating Rubric document
      if (!targetRubricId || targetRubricId === 'new' || targetRubricId === 'create') {
        const payload = {
          title: rubric?.title || 'Evaluation Rubric',
          reviewCycle: rubric?.reviewCycle || 'Review 3',
          reviewCycleId: rubric?.reviewCycle || 'Review 3',
          version: rubric?.version || '1.0',
          status: intendedStatus,
          academicYear: rubric?.academicYear || '2026',
          semester: rubric?.semester || 'Odd',
          department: rubric?.department || 'CSE',
          totalMarks: targetTotal,
          createdAt: now,
          updatedAt: now
        };
        targetRubricId = await FirestoreService.createDocument('rubrics', payload);
      }

      // 3. Save criteria into rubricCriteria collection
      const sanitizedCriteria = [];
      for (let i = 0; i < criteria.length; i++) {
        const item = criteria[i];
        const maxMarks = Number(item.maximumMarks !== undefined ? item.maximumMarks : item.maxMarks);

        const critDocId = (item.isNew || String(item.id).startsWith('temp-') || !item.id)
          ? `crit_${targetRubricId}_${item.criterionId || `c${i+1}`}`
          : item.id;

        const critPayload = {
          id: critDocId,
          criterionId: item.criterionId || `crit_${targetRubricId}_c${i+1}`,
          rubricId: targetRubricId,
          reviewCycleId: rubric?.reviewCycle || 'Review 3',
          name: item.title || item.criterionName || item.name || `Criterion ${i+1}`,
          title: item.title || item.criterionName || item.name || `Criterion ${i+1}`,
          criterionName: item.title || item.criterionName || item.name || `Criterion ${i+1}`,
          category: item.category || 'Technical',
          description: item.description || '',
          maximumMarks: maxMarks,
          maxMarks: maxMarks,
          weight: Number(item.weight || item.weightage || 1.0),
          weightage: Number(item.weight || item.weightage || 1.0),
          order: i + 1,
          displayOrder: i + 1,
          status: 'Active',
          updatedAt: now
        };

        if (item.isNew || String(item.id).startsWith('temp-')) {
          critPayload.createdAt = now;
          await FirestoreService.set('rubricCriteria', critDocId, critPayload);
        } else {
          await FirestoreService.updateDocument('rubricCriteria', critDocId, critPayload);
        }

        sanitizedCriteria.push(critPayload);
      }

      // 4. Update parent rubric document totalMarks & embedded criteria
      await FirestoreService.updateDocument('rubrics', targetRubricId, {
        id: targetRubricId,
        rubricId: targetRubricId,
        title: rubric?.title || 'Evaluation Rubric',
        reviewCycle: rubric?.reviewCycle || 'Review 3',
        reviewCycleId: rubric?.reviewCycle || 'Review 3',
        version: rubric?.version || '1.0',
        status: intendedStatus,
        academicYear: rubric?.academicYear || '2026',
        semester: rubric?.semester || 'Odd',
        department: rubric?.department || 'CSE',
        totalMarks: targetTotal,
        criteria: sanitizedCriteria,
        updatedAt: now
      });

      alert(intendedStatus === 'Published' ? 'Rubric published successfully!' : 'Rubric draft saved successfully!');
      navigate('/admin/rubrics');
    } catch (err) {
      console.error("Error saving rubric:", err);
      alert("Failed to save rubric: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={adminNavigation} title="Rubric Builder">
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!rubric) {
    return (
      <DashboardLayout navigationItems={adminNavigation} title="Rubric Builder">
        <div className="p-6 text-center text-gray-500">
          <p className="text-lg font-bold text-gray-800">Rubric Document Not Found</p>
          <p className="text-sm text-gray-500 mt-1">The requested rubric could not be found or has been removed.</p>
          <Button onClick={() => navigate('/admin/rubrics')} className="mt-4">Back to Rubrics Engine</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={adminNavigation} title="Rubric Builder">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/rubrics')} className="px-2">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Rubric Builder â€” {rubric.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Configure evaluation criteria, maximum marks, and ordering.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Draft
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving || !isValidTotal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Publish Rubric'}
            </Button>
          </div>
        </div>

        {/* Dynamic Validation Alert */}
        {!isValidTotal ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm shadow-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span>
                  <strong>Total Marks Warning:</strong> Current criteria sum is <strong>{calculatedTotal} Marks</strong> (Expected exactly <strong>{targetTotal} Marks</strong>).
                </span>
                {validationErrors.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-amber-800 mt-1.5 space-y-0.5">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <Badge variant="warning">Validation Warning</Badge>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center justify-between gap-3 text-sm shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Rubric Valid:</strong> Total marks reaches exactly <strong>{calculatedTotal} / {targetTotal} Marks</strong>. Ready for publishing.
              </span>
            </div>
            <Badge variant="success">VALID</Badge>
          </div>
        )}

        <Card title="Rubric Settings" icon={Layers}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rubric Title *</label>
              <Input
                value={rubric.title || ''}
                onChange={(e) => setRubric({...rubric, title: e.target.value})}
                placeholder="e.g. Review 3 Evaluation Rubric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Cycle *</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white font-medium"
                value={rubric.reviewCycle || 'Review 3'}
                onChange={(e) => setRubric({...rubric, reviewCycle: e.target.value, reviewCycleId: e.target.value})}
              >
                <option value="Review 1">Review 1</option>
                <option value="Review 2">Review 2</option>
                <option value="Review 3">Review 3</option>
                <option value="Review 4">Review 4</option>
                <option value="Final Defense">Final Defense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Configured Total Marks *</label>
              <Input
                type="number"
                min={1}
                value={rubric.totalMarks === undefined ? 50 : rubric.totalMarks}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setRubric({...rubric, totalMarks: val});
                }}
                placeholder="e.g. 50"
              />
              <span className="text-xs text-gray-400 mt-1 block">Enter official maximum total (e.g. 50 for Review 3 rubrics).</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <Input
                value={rubric.version || '1.0'}
                onChange={(e) => setRubric({...rubric, version: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white"
                value={rubric.status || 'Draft'}
                onChange={(e) => setRubric({...rubric, status: e.target.value})}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
        </Card>

        <Card
          title="Evaluation Criteria"
          headerAction={
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-500">Total Marks: </span>
                <span className={`font-bold text-lg ${isValidTotal ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {calculatedTotal} / {targetTotal}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCriterion}
                className="flex items-center gap-1 bg-white hover:bg-gray-50 text-primary-600 border-primary-300 font-bold"
              >
                <Plus className="w-4 h-4" /> Add Criterion
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {criteria.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No criteria defined yet. Click "Add Criterion" to start.
              </div>
            ) : (
              criteria.map((c, idx) => {
                const maxMarksVal = c.maximumMarks !== undefined ? c.maximumMarks : c.maxMarks;
                const isInvalidMarks = maxMarksVal === '' || isNaN(Number(maxMarksVal)) || Number(maxMarksVal) <= 0;
                const isInvalidTitle = !(c.title || c.criterionName || c.name || '').trim();

                return (
                  <div key={c.id || idx} className={`border rounded-lg p-4 flex gap-4 transition-all ${isInvalidMarks || isInvalidTitle ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200 bg-gray-50'}`}>
                    {/* Reorder Buttons */}
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === criteria.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-6">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Criterion Name / Title *
                          </label>
                          <Input
                            value={c.title || c.criterionName || c.name || ''}
                            onChange={e => handleCriterionChange(idx, 'title', e.target.value)}
                            placeholder="e.g. Completed System Functionality"
                            className={isInvalidTitle ? 'border-red-400 focus:border-red-500' : ''}
                          />
                          {isInvalidTitle && (
                            <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">Criterion name cannot be blank.</span>
                          )}
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                          <Input
                            value={c.category || ''}
                            onChange={e => handleCriterionChange(idx, 'category', e.target.value)}
                            placeholder="e.g. Technical"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Max Marks *
                          </label>
                          <Input
                            type="number"
                            min={1}
                            value={maxMarksVal}
                            onChange={e => handleCriterionChange(idx, 'maximumMarks', e.target.value)}
                            className={isInvalidMarks ? 'border-red-400 focus:border-red-500' : ''}
                          />
                          {isInvalidMarks && (
                            <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">Must be a number &gt; 0.</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Description (Visible to Evaluators)
                        </label>
                        <textarea
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white min-h-[60px]"
                          value={c.description || ''}
                          onChange={e => handleCriterionChange(idx, 'description', e.target.value)}
                          placeholder="Explain evaluation expectations and parameters..."
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleRemoveCriterion(idx, c.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete Criterion"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default RubricBuilder;
