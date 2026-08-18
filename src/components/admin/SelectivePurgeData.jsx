import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { syncService } from '@/firebase/services/syncService';
import { auditService } from '@/firebase/services/auditService';
import { notificationService } from '@/firebase/services/notificationService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { 
  Trash2, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, 
  RotateCcw, CheckSquare, Square, Clock, Database, Layers, Loader2, AlertCircle, FileCheck
} from 'lucide-react';

export const ALL_PURGE_CATEGORIES = [
  {
    categoryTitle: 'SECTION A – Semester Master Data (Permanent)',
    items: [
      { id: 'students', colName: 'students', label: 'Students', dataKey: 'students' },
      { id: 'teams', colName: 'teams', label: 'Teams', dataKey: 'teams' },
      { id: 'projects', colName: 'projects', label: 'Projects', dataKey: 'projects' },
      { id: 'guides', colName: 'guides', label: 'Guides', dataKey: 'guides' },
      { id: 'classroomFaculty', colName: 'classroomFaculty', label: 'Classroom Faculty', dataKey: 'faculty' },
      { id: 'guideAssignments', colName: 'guideAssignments', label: 'Guide Assignments', dataKey: 'guideAssignments' },
      { id: 'facultyAssignments', colName: 'facultyAssignments', label: 'Faculty Assignments', dataKey: 'facultyAssignments' },
    ]
  },
  {
    categoryTitle: 'SECTION B – Review Cycle Data (Dynamic - Rotates Every Review)',
    items: [
      { id: 'reviewerAssignments', colName: 'reviewerAssignments', label: 'Reviewer Assignments', dataKey: 'reviewerAssignments' },
      { id: 'reviews', colName: 'reviews', label: 'Reviewer Marks', dataKey: 'reviews' },
      { id: 'evaluations', colName: 'evaluations', label: 'Evaluations', dataKey: 'evaluations' },
      { id: 'attendance', colName: 'attendance', label: 'Review Attendance', dataKey: 'attendance' },
      { id: 'remarks', colName: 'remarks', label: 'Review Comments', dataKey: 'remarks' },
      { id: 'notifications', colName: 'notifications', label: 'Review Notifications', dataKey: 'notifications' },
      { id: 'reports', colName: 'reports', label: 'Review Reports', dataKey: 'reports' },
      { id: 'analyticsCache', colName: 'analyticsCache', label: 'Analytics Cache', dataKey: 'analyticsCache' },
    ]
  },
  {
    categoryTitle: 'SECTION C – Administration',
    items: [
      { id: 'auditLogs', colName: 'auditLogs', label: 'Audit Logs', dataKey: 'auditLogs' },
      { id: 'loginHistory', colName: 'loginHistory', label: 'Login History', dataKey: 'loginHistory' },
      { id: 'otpSessions', colName: 'otpSessions', label: 'MFA Sessions', dataKey: 'otpSessions' },
      { id: 'trustedDevices', colName: 'trustedDevices', label: 'Trusted Devices', dataKey: 'trustedDevices' },
      { id: 'notificationHistory', colName: 'notificationHistory', label: 'Notification History', dataKey: 'notificationHistory' },
    ]
  }
];

const SelectivePurgeData = () => {
  const dataContext = useData();
  const { currentUser, domainUser } = useAuth();

  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentProgressMsg, setCurrentProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [completionReport, setCompletionReport] = useState(null);

  // Flatten all available items
  const allItems = useMemo(() => {
    return ALL_PURGE_CATEGORIES.flatMap(cat => cat.items);
  }, []);

  // Compute realtime counts from DataContext
  const countsMap = useMemo(() => {
    const map = {};
    allItems.forEach(item => {
      const val = dataContext[item.dataKey];
      if (Array.isArray(val)) {
        map[item.id] = val.length;
      } else if (val && typeof val === 'object') {
        map[item.id] = Object.keys(val).length;
      } else {
        map[item.id] = 0;
      }
    });
    return map;
  }, [dataContext, allItems]);

  const isAllSelected = selectedIds.length === allItems.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allItems.map(i => i.id));
    }
  };

  const handleResetSelection = () => {
    setSelectedIds([]);
    setCompletionReport(null);
  };

  const handleToggleItem = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Selected item objects
  const selectedItemsList = useMemo(() => {
    return allItems.filter(i => selectedIds.includes(i.id));
  }, [selectedIds, allItems]);

  // Dependency relationship warnings
  const dependencyWarnings = useMemo(() => {
    const warnings = [];
    const sel = new Set(selectedIds);

    if (sel.has('students') && !sel.has('teams')) {
      warnings.push('Students are linked to Teams. Deleting Students may leave orphan Team records.');
    }
    if (sel.has('projects') && !sel.has('teams')) {
      warnings.push('Projects are linked to Teams. Deleting Projects without Teams may leave unlinked teams.');
    }
    if ((sel.has('guides') || sel.has('classroomFaculty') || sel.has('reviewers')) && !sel.has('reviewerAssignments')) {
      warnings.push('Staff members are linked to Reviewer Assignments.');
    }
    if (sel.has('reviewCycles') && !sel.has('evaluations')) {
      warnings.push('Review Cycles are linked to Evaluations. Deleting cycles may affect active evaluation records.');
    }
    if (sel.has('rubrics') && !sel.has('rubricCriteria')) {
      warnings.push('Deleting Rubrics without Rubric Criteria may leave orphan criteria.');
    }
    return warnings;
  }, [selectedIds]);

  const handleOpenConfirmModal = () => {
    if (selectedIds.length === 0) return;
    setConfirmInput('');
    setShowConfirmModal(true);
  };

  const handleExecutePurge = async () => {
    if (confirmInput !== 'DELETE') return;

    setShowConfirmModal(false);
    setIsExecuting(true);
    setProgressPercent(0);
    setCompletionReport(null);

    const totalToProcess = selectedItemsList.length;
    let processedCount = 0;

    try {
      const summary = await syncService.purgeSelectiveCollections(
        selectedItemsList,
        (colName, label, msg) => {
          processedCount++;
          setCurrentProgressMsg(msg);
          setProgressPercent(Math.round((processedCount / totalToProcess) * 100));
        }
      );

      setCompletionReport(summary);

      // Audit Log
      await auditService.log(
        currentUser?.uid || 'admin',
        'SELECTIVE_DATA_PURGE',
        'System',
        null,
        {
          adminUid: currentUser?.uid || 'admin',
          adminName: domainUser?.name || currentUser?.email || 'Admin',
          collectionsDeleted: summary.collectionsDeleted.map(c => c.label),
          recordsDeletedCount: summary.recordsDeletedTotal,
          executionTimeMs: summary.executionTimeMs,
          status: summary.errors.length === 0 ? 'Success' : 'Completed with Errors'
        }
      );

      // Admin Notification
      await notificationService.sendNotification({
        title: summary.errors.length === 0 ? 'Selective Data Purge Completed' : 'Selective Data Purge Completed with Errors',
        message: `Purged ${summary.recordsDeletedTotal} records across ${summary.collectionsDeleted.length} collections in ${summary.executionTimeMs}ms.`,
        type: summary.errors.length === 0 ? 'info' : 'warning',
        recipientType: 'role',
        recipientRole: 'admin',
        priority: 'high',
        category: 'System'
      });

    } catch (err) {
      console.error("Selective purge failed:", err);
      alert("Execution failed: " + err.message);
    } finally {
      setIsExecuting(false);
      setProgressPercent(100);
    }
  };

  const handleSelectReviewCycleDataOnly = () => {
    const sectionB = ALL_PURGE_CATEGORIES.find(c => c.categoryTitle.includes('SECTION B'))?.items.map(i => i.id) || [];
    setSelectedIds(sectionB);
    setShowConfirmModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls Card */}
      <Card className="border-red-200 bg-red-50/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" /> Enterprise Selective Purge Data Module
            </h2>
            <p className="text-xs text-red-700 mt-1">
              Selectively purge specific Firestore collections via grouped checkboxes with dependency checks and audit logs. Semester Master Data remains untouched when purging Review Cycle Data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              size="sm" 
              onClick={handleSelectReviewCycleDataOnly}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Purge Review Cycle Data Only
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetSelection}
              className="border-gray-300 text-gray-700 hover:bg-white"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleSelectAll}
              className={`border-gray-300 ${isAllSelected ? 'bg-primary-50 text-primary-700 border-primary-300' : 'bg-white text-gray-700'}`}
            >
              {isAllSelected ? <CheckSquare className="w-3.5 h-3.5 mr-1 text-primary-600" /> : <Square className="w-3.5 h-3.5 mr-1" />}
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </Button>

            <Button
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={handleOpenConfirmModal}
              className="bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Purge Selected ({selectedIds.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Category Checkbox Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ALL_PURGE_CATEGORIES.map((category) => {
          const categoryItemIds = category.items.map(i => i.id);
          const categorySelectedCount = categoryItemIds.filter(id => selectedIds.includes(id)).length;
          const isCategoryAllSelected = categorySelectedCount === categoryItemIds.length;

          const toggleCategoryAll = () => {
            if (isCategoryAllSelected) {
              setSelectedIds(prev => prev.filter(id => !categoryItemIds.includes(id)));
            } else {
              setSelectedIds(prev => Array.from(new Set([...prev, ...categoryItemIds])));
            }
          };

          return (
            <Card 
              key={category.categoryTitle} 
              title={
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-gray-900">{category.categoryTitle}</span>
                  <button 
                    type="button" 
                    onClick={toggleCategoryAll} 
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    {isCategoryAllSelected ? 'Deselect Group' : 'Select Group'}
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {category.items.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  const docCount = countsMap[item.id] || 0;

                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                        isChecked 
                          ? 'bg-red-50/80 border-red-300 text-red-900 shadow-sm' 
                          : 'bg-gray-50/50 border-gray-200 text-gray-700 hover:bg-gray-100/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleItem(item.id)}
                          className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                        />
                        <span className="text-xs font-semibold truncate" title={item.label}>
                          {item.label}
                        </span>
                      </div>
                      <Badge variant={docCount > 0 ? (isChecked ? 'danger' : 'default') : 'default'} className="text-[10px]">
                        {docCount}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Safety Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Permanent Selective Data Deletion"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 space-y-1">
              <p className="font-bold">WARNING: Permanent Deletion</p>
              <p>You are about to permanently delete records from {selectedItemsList.length} selected collections. This action cannot be undone.</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Selected Collections ({selectedItemsList.length}):</p>
            <div className="max-h-36 overflow-y-auto border rounded-lg p-2 bg-gray-50 space-y-1 text-xs">
              {selectedItemsList.map(item => (
                <div key={item.id} className="flex items-center justify-between text-gray-800 py-0.5 px-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {item.label}
                  </span>
                  <span className="font-bold text-gray-600">{countsMap[item.id] || 0} docs</span>
                </div>
              ))}
            </div>
          </div>

          {dependencyWarnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1 text-xs text-amber-900">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Dependency Warnings:
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                {dependencyWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Type <span className="text-red-600 font-extrabold select-all">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full border border-gray-300 rounded-md p-2 text-sm font-mono focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExecutePurge}
              disabled={confirmInput !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-40"
            >
              Purge Selected Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Progress Dialog */}
      {isExecuting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 text-center shadow-2xl">
            <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-gray-900">Purging Selected Data...</h3>
              <p className="text-xs text-gray-500 mt-1">{currentProgressMsg || 'Executing Firestore WriteBatches...'}</p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-red-600 h-2.5 rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs font-bold text-gray-600">{progressPercent}% Completed</p>
          </div>
        </div>
      )}

      {/* Completion Summary Report Card */}
      {completionReport && (
        <Card className="border-emerald-200 bg-emerald-50/40" title={
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <FileCheck className="w-5 h-5 text-emerald-600" /> Purge Execution Completion Summary Report
          </div>
        }>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <p className="text-xl font-bold text-emerald-700">{completionReport.collectionsDeleted.length}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Collections Deleted</p>
              </div>
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <p className="text-xl font-bold text-blue-700">{completionReport.recordsDeletedTotal}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Records Deleted</p>
              </div>
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <p className="text-xl font-bold text-slate-700">{completionReport.executionTimeMs} ms</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Execution Time</p>
              </div>
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <p className="text-xl font-bold text-purple-700">{completionReport.successRate}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Success Rate</p>
              </div>
            </div>

            {completionReport.collectionsDeleted.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Purged Collections Breakdown:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {completionReport.collectionsDeleted.map(c => (
                    <div key={c.colName} className="p-2 bg-white border rounded flex justify-between">
                      <span className="font-semibold text-gray-800">{c.label}</span>
                      <span className="font-bold text-emerald-600">{c.count} records</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completionReport.collectionsSkipped.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Skipped (0 Documents):</p>
                <p className="text-xs text-gray-600">
                  {completionReport.collectionsSkipped.map(s => s.label).join(', ')}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

    </div>
  );
};

export default SelectivePurgeData;
