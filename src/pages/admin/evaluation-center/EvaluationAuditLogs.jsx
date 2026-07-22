import React, { useState, useEffect } from 'react';
import { auditService } from '@/firebase/services/auditService';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Badge from '@/components/common/Badge';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Loader2,
  Clock,
  UserCheck,
  Lock,
  FileCheck
} from 'lucide-react';

const EvaluationAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAll();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load evaluation audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const sampleLogs = [
    { id: '1', action: 'STAGE_UPDATE_PUBLISHED', user: 'admin@kl.edu', role: 'Admin', department: 'CSE', entity: 'Project', entityId: 'TEAM001', prevVal: 'Approved', newVal: 'Published', timestamp: '2026-07-22 10:15 AM', status: 'Success' },
    { id: '2', action: 'LOCK_EVALUATION', user: 'admin@kl.edu', role: 'Admin', department: 'CSE', entity: 'Project', entityId: 'TEAM002', prevVal: 'Unlocked', newVal: 'Locked', timestamp: '2026-07-22 09:30 AM', status: 'Success' },
    { id: '3', action: 'UPDATE_GUIDE_MARKS', user: 'dr.ramesh@kl.edu', role: 'Guide', department: 'CSE', entity: 'Student', entityId: '22000301', prevVal: '15/20', newVal: '18/20', timestamp: '2026-07-21 04:45 PM', status: 'Success' },
    { id: '4', action: 'REASSIGN_REVIEWER', user: 'admin@kl.edu', role: 'Admin', department: 'ECE', entity: 'Team', entityId: 'TEAM004', prevVal: 'Dr. Srinivas', newVal: 'Dr. Kiran', timestamp: '2026-07-21 02:10 PM', status: 'Success' }
  ];

  const displayLogs = logs.length > 0 ? logs : sampleLogs;

  const filteredLogs = displayLogs.filter(l => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (l.action && l.action.toLowerCase().includes(query)) ||
      (l.user && l.user.toLowerCase().includes(query)) ||
      (l.entityId && l.entityId.toLowerCase().includes(query));

    const matchesRole = selectedRole === 'All' || l.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const columns = [
    {
      key: 'action',
      header: 'Action Event',
      render: (_, row) => (
        <div>
          <span className="font-bold text-gray-900 text-xs tracking-tight">{row.action}</span>
          <div className="text-[11px] text-gray-500">
            {row.prevVal && row.newVal ? `Changed from ${row.prevVal} to ${row.newVal}` : 'Evaluation record updated.'}
          </div>
        </div>
      )
    },
    {
      key: 'user',
      header: 'Operator & Role',
      render: (_, row) => (
        <div>
          <div className="text-xs font-bold text-gray-800">{row.user}</div>
          <Badge variant="primary">{row.role || 'Admin'}</Badge>
        </div>
      )
    },
    {
      key: 'target',
      header: 'Target Entity',
      render: (_, row) => (
        <span className="text-xs text-primary-700 font-extrabold">
          {row.entity} ({row.entityId})
        </span>
      )
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (_, row) => (
        <span className="text-xs text-gray-500 font-medium">{String(row.timestamp)}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => (
        <Badge variant="success">{row.status || 'Verified'}</Badge>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Search & Action Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            icon={Search}
            placeholder="Search audit trail by User, Action, Team ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs border-gray-300 rounded-lg p-2 bg-gray-50 font-medium"
          >
            <option value="All">All Operator Roles</option>
            <option value="Admin">Admin</option>
            <option value="Guide">Guide</option>
            <option value="Reviewer">Reviewer</option>
            <option value="Classroom Faculty">Classroom Faculty</option>
          </select>

          <Button size="xs" variant={viewMode === 'table' ? 'primary' : 'outline'} onClick={() => setViewMode('table')}>
            Table View
          </Button>
          <Button size="xs" variant={viewMode === 'timeline' ? 'primary' : 'outline'} onClick={() => setViewMode('timeline')}>
            Timeline Stream
          </Button>
          <Button size="xs" variant="outline" onClick={() => alert("Exporting Audit Log")}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export Audit
          </Button>
        </div>
      </Card>

      {/* Main View */}
      {viewMode === 'table' ? (
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary-600" /> System Audit Trail ({filteredLogs.length} Records)
          </h3>
          <Table columns={columns} data={filteredLogs} />
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" /> Chronological Audit Stream
          </h3>
          <div className="space-y-4 border-l-2 border-primary-200 ml-4 pl-6 relative">
            {filteredLogs.map((l, i) => (
              <div key={i} className="relative space-y-1">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary-600 border-2 border-white"></div>
                <div className="font-bold text-sm text-gray-900">{l.action}</div>
                <div className="text-xs text-gray-500">Operator: <span className="font-bold text-gray-800">{l.user}</span> ({l.role}) • {l.timestamp}</div>
                <div className="text-xs text-primary-700 font-semibold">Target: {l.entity} {l.entityId}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
};

export default EvaluationAuditLogs;
