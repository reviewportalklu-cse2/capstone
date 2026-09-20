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
import { Layers, ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle, CheckCircle } from 'lucide-react';

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
    if (dataLoading || !rubrics || !activeRubricId) return;

    const cleanActiveId = String(activeRubricId).trim().toLowerCase();

    // 1. Try finding rubric by doc ID, id, rubricId, or matching reviewCycle
    let r = rubrics.find(x =>
      String(x.id || '').toLowerCase() === cleanActiveId ||
      String(x._id || '').toLowerCase() === cleanActiveId ||
      String(x.rubricId || '').toLowerCase() === cleanActiveId ||
      String(x.reviewCycle || '').trim().toLowerCase() === cleanActiveId ||
      String(x.reviewCycle || '').trim().toLowerCase().replace(/\s+/g, '-') === cleanActiveId ||
      String(x.reviewCycle || '').trim().toLowerCase().replace(/\s+/g, '_') === cleanActiveId
    );

    // 2. If activeRubricId was an obsolete/deleted ID or not found directly, try finding published rubric matching cycle
    if (!r) {
      r = rubrics.find(x => (x.status === 'Published' || x.status === 'Active'));
    }

    if (r) {
      setRubric(r);

      const targetIds = new Set([r.id, r._id, r.rubricId, activeRubricId].filter(Boolean).map(s => String(s).toLowerCase()));

      // Look up criteria in rubricCriteria collection first
      let c = rubricCriteria
        .filter(x => targetIds.has(String(x.rubricId).toLowerCase()))
        .sort((a, b) => (a.displayOrder || a.order || 0) - (b.displayOrder || b.order || 0));

      if (c.length === 0 && Array.isArray(r.criteria) && r.criteria.length > 0) {
        c = r.criteria;
      }

      if (c.length > 0) {
        setCriteria(c.map((item, idx) => ({
          ...item,
          id: item.id || `crit_${r.id || activeRubricId}_${idx + 1}`,
          criterionId: item.criterionId || item.id || `c${idx + 1}`,
          title: item.title || item.criterionName || `Criterion ${idx + 1}`,
          criterionName: item.criterionName || item.title || `Criterion ${idx + 1}`,
          description: item.description || '',
          maximumMarks: Number(item.maximumMarks || item.maxMarks || 10),
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
        id: `temp-${Date.now()}`,
        criterionId: `crit_${nextIdx}`,
        isNew: true,
        title: '',
        criterionName: '',
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
      const numVal = isNaN(Number(value)) ? 0 : Math.max(0, Number(value));
      newC[index].maximumMarks = numVal;
      newC[index].maxMarks = numVal;
    } else if (field === 'title') {
      newC[index].title = value;
      newC[index].criterionName = value;
    } else if (field === 'weight') {
      const numVal = isNaN(Number(value)) ? 1.0 : Number(value);
      newC[index].weight = numVal;
      newC[index].weightage = numVal;
    } else {
      newC[index][field] = value;
    }
    setCriteria(newC);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let targetRubricId = rubric?.id || activeRubricId;
      let totalMarks = 0;

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
      if (!targetRubricId || targetRubricId === 'new') {
        const payload = {
          title: rubric?.title || 'New Evaluation Rubric',
          reviewCycle: rubric?.reviewCycle || 'Review 1',
          version: rubric?.version || '1.0',
          status: rubric?.status || 'Published',
          academicYear: rubric?.academicYear || '2026',
          semester: rubric?.semester || 'Odd',
          department: rubric?.department || 'CSE',
          totalMarks: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        targetRubricId = await FirestoreService.createDocument('rubrics', payload);
      }

      // 3. Save criteria into rubricCriteria collection
      const sanitizedCriteria = [];
      const now = new Date().toISOString();

      for (let i = 0; i < criteria.length; i++) {
        const item = criteria[i];
        const maxMarks = Number(item.maximumMarks || item.maxMarks || 0);
        totalMarks += maxMarks;

        const critDocId = (item.isNew || String(item.id).startsWith('temp-'))
          ? `crit_${targetRubricId}_r${i+1}_${Date.now()}`
          : item.id;

        const critPayload = {
          id: critDocId,
          criterionId: item.criterionId || `c${i+1}`,
          rubricId: targetRubricId,
          title: item.title || item.criterionName || `Criterion ${i+1}`,
          criterionName: item.title || item.criterionName || `Criterion ${i+1}`,
          category: item.category || 'Technical',
          description: item.description || '',
          maximumMarks: maxMarks,
          maxMarks: maxMarks,
          weight: Number(item.weight || item.weightage || 1.0),
          weightage: Number(item.weight || item.weightage || 1.0),
          displayOrder: i + 1,
          order: i + 1,
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
        title: rubric?.title || 'Evaluation Rubric',
        reviewCycle: rubric?.reviewCycle || 'Review 1',
        version: rubric?.version || '1.0',
        status: rubric?.status || 'Published',
        academicYear: rubric?.academicYear || '2026',
        semester: rubric?.semester || 'Odd',
        department: rubric?.department || 'CSE',
        totalMarks,
        criteria: sanitizedCriteria,
        updatedAt: now
      });

      alert('Rubric saved successfully!');
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
        <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
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

  const calculatedTotal = criteria.reduce((sum, c) => sum + (Number(c.maximumMarks) || 0), 0);
  const isValidTotal = calculatedTotal === 100;

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
                Rubric Builder — {rubric.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Configure evaluation criteria, maximum marks, and ordering.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Rubric'}
            </Button>
          </div>
        </div>

        {/* Validation Alert */}
        {!isValidTotal ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-center justify-between gap-3 text-sm shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Total Marks Warning:</strong> Current total is <strong>{calculatedTotal} Marks</strong> (Expected exactly 100 Marks).
              </span>
            </div>
            <Badge variant="warning">Validation Warning</Badge>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center justify-between gap-3 text-sm shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Rubric Valid:</strong> Total marks reaches exactly <strong>100 / 100 Marks</strong>.
              </span>
            </div>
            <Badge variant="success">VALID</Badge>
          </div>
        )}

        <Card title="Rubric Settings" icon={Layers}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                value={rubric.title || ''}
                onChange={(e) => setRubric({...rubric, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Cycle</label>
              <Input
                value={rubric.reviewCycle || ''}
                onChange={(e) => setRubric({...rubric, reviewCycle: e.target.value})}
              />
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
                  {calculatedTotal} / 100
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddCriterion} className="flex items-center gap-1">
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
              criteria.map((c, idx) => (
                <div key={c.id || idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex gap-4">
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
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Criterion Name / Title</label>
                        <Input
                          value={c.title || c.criterionName || ''}
                          onChange={e => handleCriterionChange(idx, 'title', e.target.value)}
                          placeholder="e.g. Technical Implementation"
                        />
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
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Max Marks</label>
                        <Input
                          type="number"
                          min={0}
                          value={c.maximumMarks === undefined ? 10 : c.maximumMarks}
                          onChange={e => handleCriterionChange(idx, 'maximumMarks', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description (Visible to Evaluators)</label>
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
              ))
            )}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default RubricBuilder;
