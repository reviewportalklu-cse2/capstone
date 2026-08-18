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
import { Layers, ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';

const RubricBuilder = () => {
  const { id, rubricId } = useParams();
  const activeRubricId = rubricId || id;
  const navigate = useNavigate();
  const { rubrics, rubricCriteria, dataLoading } = useData();

  const [rubric, setRubric] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (dataLoading || !rubrics || !activeRubricId) return;
    const r = rubrics.find(x => x.id === activeRubricId || x.rubricId === activeRubricId);
    if (r) {
      setRubric(r);
      const c = rubricCriteria.filter(x => x.rubricId === activeRubricId).sort((a, b) => a.displayOrder - b.displayOrder);
      setCriteria(c.length > 0 ? c : []);
    }
  }, [rubrics, rubricCriteria, activeRubricId, dataLoading]);

  const handleAddCriterion = () => {
    setCriteria([
      ...criteria, 
      {
        id: `temp-${Date.now()}`,
        isNew: true,
        title: '',
        description: '',
        category: 'Technical',
        maximumMarks: 10,
        weightage: 10,
        displayOrder: criteria.length + 1,
        status: 'Active'
      }
    ]);
  };

  const handleRemoveCriterion = async (index, criterionId) => {
    if (!criterionId.startsWith('temp-')) {
      try {
        await FirestoreService.deleteDocument('rubricCriteria', criterionId);
      } catch (err) {
        console.error(err);
      }
    }
    const newC = [...criteria];
    newC.splice(index, 1);
    setCriteria(newC);
  };

  const handleCriterionChange = (index, field, value) => {
    const newC = [...criteria];
    newC[index][field] = field === 'maximumMarks' || field === 'weightage' || field === 'displayOrder' ? Number(value) : value;
    setCriteria(newC);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let targetRubricId = activeRubricId;
      let totalMarks = 0;

      // If creating a new rubric or activeRubricId is 'new'
      if (!targetRubricId || targetRubricId === 'new') {
        const payload = {
          title: rubric?.title || 'New Evaluation Rubric',
          reviewCycle: rubric?.reviewCycle || 'Review 1',
          version: rubric?.version || '1.0',
          status: rubric?.status || 'Published',
          totalMarks: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        targetRubricId = await FirestoreService.createDocument('rubrics', payload);
      }

      // Save all criteria with valid targetRubricId
      for (let i = 0; i < criteria.length; i++) {
        const c = { ...criteria[i], displayOrder: i + 1, rubricId: targetRubricId };
        totalMarks += (c.maximumMarks || 0);
        
        if (c.isNew || String(c.id).startsWith('temp-')) {
          delete c.id;
          delete c.isNew;
          await FirestoreService.createDocument('rubricCriteria', c);
        } else {
          await FirestoreService.updateDocument('rubricCriteria', c.id, c);
        }
      }

      // Update rubric document
      await FirestoreService.updateDocument('rubrics', targetRubricId, {
        title: rubric?.title || 'New Evaluation Rubric',
        reviewCycle: rubric?.reviewCycle || 'Review 1',
        version: rubric?.version || '1.0',
        status: rubric?.status || 'Published',
        totalMarks,
        updatedAt: new Date().toISOString()
      });

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
        <div className="p-6 text-center text-gray-500">Rubric not found.</div>
      </DashboardLayout>
    );
  }

  const calculatedTotal = criteria.reduce((sum, c) => sum + (c.maximumMarks || 0), 0);

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
                Rubric Builder
              </h1>
              <p className="text-sm text-gray-500 mt-1">Design evaluation criteria and weightages.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Rubric'}
            </Button>
          </div>
        </div>

        <Card title="Rubric Settings" icon={Layers}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input 
                value={rubric.title} 
                onChange={(e) => setRubric({...rubric, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Cycle</label>
              <Input 
                value={rubric.reviewCycle} 
                onChange={(e) => setRubric({...rubric, reviewCycle: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <Input 
                value={rubric.version} 
                onChange={(e) => setRubric({...rubric, version: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white"
                value={rubric.status}
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
                <span className="font-bold text-primary-600 text-lg">{calculatedTotal}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddCriterion} className="flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Criterion
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {criteria.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No criteria defined yet. Click "Add Criterion" to start.</div>
            ) : (
              criteria.map((c, idx) => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex gap-4">
                  <div className="mt-2 text-gray-400 cursor-move">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Title</label>
                        <Input value={c.title} onChange={e => handleCriterionChange(idx, 'title', e.target.value)} placeholder="e.g. Literature Survey" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                        <Input value={c.category} onChange={e => handleCriterionChange(idx, 'category', e.target.value)} placeholder="e.g. Technical" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Max Marks</label>
                        <Input type="number" value={c.maximumMarks} onChange={e => handleCriterionChange(idx, 'maximumMarks', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description (Optional)</label>
                      <textarea
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border bg-white min-h-[60px]"
                        value={c.description}
                        onChange={e => handleCriterionChange(idx, 'description', e.target.value)}
                        placeholder="Explain what is expected..."
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button variant="ghost" onClick={() => handleRemoveCriterion(idx, c.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
