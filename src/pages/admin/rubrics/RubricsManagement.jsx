import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { useData } from '@/contexts/DataContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import EmptyState from '@/components/common/EmptyState';
import { Layers, Plus, FileEdit, Copy, Archive } from 'lucide-react';
import { FirestoreService } from '@/firebase/services/firestore';
import { useAuth } from '@/contexts/AuthContext';

const RubricsManagement = () => {
  const navigate = useNavigate();
  const { rubrics, dataLoading } = useData();
  const { currentUser } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRubric = async () => {
    setIsCreating(true);
    try {
      const newRubric = {
        title: 'New Evaluation Rubric',
        version: '1.0',
        academicYear: new Date().getFullYear().toString(),
        semester: 'Odd',
        department: 'CSE',
        reviewCycle: 'Review 1',
        status: 'Draft',
        totalMarks: 0,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const id = await FirestoreService.createDocument('rubrics', newRubric);
      navigate(`/admin/rubrics/builder/${id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloneRubric = async (rubric) => {
    try {
      const { id, rubricId, ...rest } = rubric;
      const newRubric = {
        ...rest,
        title: `${rubric.title} (Copy)`,
        version: `${parseFloat(rubric.version) + 0.1}`,
        status: 'Draft',
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await FirestoreService.createDocument('rubrics', newRubric);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      header: 'Rubric Information',
      accessor: (row) => (
        <div>
          <div className="font-bold text-gray-900">{row.title}</div>
          <div className="text-xs text-gray-500">{row.department} • {row.academicYear} • Sem {row.semester}</div>
        </div>
      )
    },
    {
      header: 'Review Cycle',
      accessor: (row) => <Badge variant="primary">{row.reviewCycle}</Badge>
    },
    {
      header: 'Version',
      accessor: (row) => <span className="text-sm font-medium text-gray-600">v{row.version}</span>
    },
    {
      header: 'Total Marks',
      accessor: (row) => <span className="font-bold text-primary-600">{row.totalMarks}</span>
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'Published' ? 'success' : (row.status === 'Draft' ? 'warning' : 'default')}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/rubrics/builder/${row.id}`)}>
            <FileEdit className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleCloneRubric(row)} title="Clone">
            <Copy className="w-4 h-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="sm" title="Archive">
            <Archive className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout navigationItems={adminNavigation} title="Enterprise Rubrics Management">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary-600" /> Rubrics Engine
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage, version, and assign evaluation rubrics globally.</p>
          </div>
          <Button 
            onClick={handleCreateRubric} 
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {isCreating ? 'Creating...' : 'Create Rubric'}
          </Button>
        </div>

        <Card>
          {dataLoading ? (
            <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
          ) : rubrics && rubrics.length > 0 ? (
            <Table columns={columns} data={rubrics} keyExtractor={r => r.id} />
          ) : (
            <EmptyState 
              icon={Layers}
              title="No Rubrics Found"
              description="Create your first enterprise rubric to begin standardizing evaluations."
              action={{ label: 'Create Rubric', onClick: handleCreateRubric }}
            />
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default RubricsManagement;
