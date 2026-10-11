import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { memberService } from '@/firebase/services/memberService';
import { exportToCsv } from '@/utils/csvExport';
import { 
  Users, UserPlus, RefreshCw, Download, Edit2, ShieldCheck, 
  Clock, CheckCircle, AlertCircle, Search, Filter, BookOpen, 
  UserCheck, UserCog, Key, Info, Check, X
} from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Information Technology',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Biotechnology'
];

const AVAILABLE_ROLES = [
  {
    id: 'guide',
    label: 'Project Guide',
    description: 'Mentors teams, approves milestones, and submits guide evaluations.',
    icon: UserCheck,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    id: 'classroom_faculty',
    label: 'Classroom Faculty',
    description: 'Tracks batch cohorts and submits classroom assessments.',
    icon: BookOpen,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  },
  {
    id: 'reviewer',
    label: 'Reviewer',
    description: 'Conducts formal milestone panel evaluations and rubric scoring.',
    icon: UserCog,
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  }
];

const MembersManagement = () => {
  const navigationItems = useAdminNavigation();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');
  const [addForm, setAddForm] = useState({
    name: '',
    employeeId: '',
    email: '',
    department: 'Computer Science & Engineering',
    roles: ['guide']
  });

  // Edit Member Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    uid: '',
    name: '',
    employeeId: '',
    email: '',
    department: '',
    roles: [],
    status: 'Active'
  });

  const loadMembers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setErrorMsg('');

    try {
      const data = await memberService.getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error('[MEMBERS_MANAGEMENT] Failed to fetch members:', err);
      setErrorMsg(err.message || 'Failed to load evaluator members. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Stats computation
  const stats = useMemo(() => {
    const total = members.length;
    const guidesCount = members.filter(m => m.availableRoles?.includes('guide')).length;
    const facultyCount = members.filter(m => m.availableRoles?.some(r => ['classroom_faculty', 'faculty'].includes(r))).length;
    const reviewersCount = members.filter(m => m.availableRoles?.includes('reviewer')).length;
    const pendingFirstLoginCount = members.filter(m => m.requiresPasswordChange).length;
    return { total, guidesCount, facultyCount, reviewersCount, pendingFirstLoginCount };
  }, [members]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Role filter
      if (selectedRoleFilter !== 'ALL') {
        const hasRole = member.availableRoles?.some(r => {
          if (selectedRoleFilter === 'guide') return r === 'guide';
          if (selectedRoleFilter === 'classroom_faculty') return r === 'classroom_faculty' || r === 'faculty';
          if (selectedRoleFilter === 'reviewer') return r === 'reviewer';
          return false;
        });
        if (!hasRole) return false;
      }

      // Password status filter
      if (selectedStatusFilter === 'PENDING' && !member.requiresPasswordChange) return false;
      if (selectedStatusFilter === 'ACTIVE' && member.requiresPasswordChange) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (member.name || '').toLowerCase().includes(q);
        const matchEmail = (member.email || '').toLowerCase().includes(q);
        const matchEmpId = String(member.employeeId || '').toLowerCase().includes(q);
        const matchDept = (member.department || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchEmpId && !matchDept) return false;
      }

      return true;
    });
  }, [members, selectedRoleFilter, selectedStatusFilter, searchQuery]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setAddError('');
    setAddForm({
      name: '',
      employeeId: '',
      email: '',
      department: 'Computer Science & Engineering',
      roles: ['guide']
    });
    setIsAddModalOpen(true);
  };

  // Toggle role in Add form
  const handleToggleAddRole = (roleId) => {
    setAddForm(prev => {
      const exists = prev.roles.includes(roleId);
      if (exists) {
        if (prev.roles.length === 1) return prev; // Keep at least one
        return { ...prev, roles: prev.roles.filter(r => r !== roleId) };
      } else {
        return { ...prev, roles: [...prev.roles, roleId] };
      }
    });
  };

  // Submit Add Member
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!addForm.name.trim()) {
      setAddError('Full Name is required.');
      return;
    }
    if (!addForm.employeeId.trim()) {
      setAddError('Employee ID is required.');
      return;
    }
    if (!addForm.email.trim()) {
      setAddError('Official Email is required.');
      return;
    }
    if (addForm.roles.length === 0) {
      setAddError('Please select at least one role.');
      return;
    }

    setSubmittingAdd(true);
    try {
      const result = await memberService.createMember({
        name: addForm.name.trim(),
        employeeId: addForm.employeeId.trim(),
        email: addForm.email.trim(),
        department: addForm.department,
        availableRoles: addForm.roles
      });

      const note = result?.initialPasswordNote || `Initial password is Employee ID ${addForm.employeeId}.`;
      setSuccessMsg(`Member ${addForm.name} onboarded successfully! ${note}`);
      setIsAddModalOpen(false);
      await loadMembers();
      setTimeout(() => setSuccessMsg(''), 8000);
    } catch (err) {
      console.error('[MEMBERS_MANAGEMENT] Creation error:', err);
      setAddError(err.message || 'Failed to create member account.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (member) => {
    setEditError('');
    setEditingMember(member);
    const normalizedRoles = (member.availableRoles || []).map(r => r === 'faculty' ? 'classroom_faculty' : r);
    setEditForm({
      uid: member.uid || member.id,
      name: member.name || '',
      employeeId: member.employeeId || '',
      email: member.email || '',
      department: member.department || 'Computer Science & Engineering',
      roles: normalizedRoles.length > 0 ? normalizedRoles : ['guide'],
      status: member.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  // Toggle role in Edit form
  const handleToggleEditRole = (roleId) => {
    setEditForm(prev => {
      const exists = prev.roles.includes(roleId);
      if (exists) {
        if (prev.roles.length === 1) return prev; // Keep at least one
        return { ...prev, roles: prev.roles.filter(r => r !== roleId) };
      } else {
        return { ...prev, roles: [...prev.roles, roleId] };
      }
    });
  };

  // Submit Edit Member
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editForm.name.trim()) {
      setEditError('Full Name is required.');
      return;
    }
    if (editForm.roles.length === 0) {
      setEditError('Please select at least one role.');
      return;
    }

    setSubmittingEdit(true);
    try {
      await memberService.updateMember(editForm.uid, {
        name: editForm.name.trim(),
        department: editForm.department,
        availableRoles: editForm.roles,
        status: editForm.status
      });

      setSuccessMsg(`Member ${editForm.name} updated successfully!`);
      setIsEditModalOpen(false);
      await loadMembers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('[MEMBERS_MANAGEMENT] Update error:', err);
      setEditError(err.message || 'Failed to update member.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Export to CSV
  const handleExport = () => {
    const exportData = filteredMembers.map(m => ({
      'Full Name': m.name,
      'Employee ID': m.employeeId,
      'Email': m.email,
      'Department': m.department,
      'Roles': (m.availableRoles || []).join(', '),
      'Account Security': m.requiresPasswordChange ? 'First Login Pending' : 'Password Active',
      'Status': m.status || 'Active'
    }));

    exportToCsv(exportData, `evaluator-members-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Member Details',
      accessor: 'name',
      render: (row) => {
        const initials = (row.name || 'Member')
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-white shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-snug">{row.name}</div>
              <div className="text-xs text-gray-500 font-mono">{row.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Employee ID',
      accessor: 'employeeId',
      render: (row) => (
        <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 font-semibold border border-gray-200">
          {row.employeeId || '—'}
        </span>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <span className="text-xs text-gray-700 font-medium truncate max-w-xs block">
          {row.department || 'Computer Science & Engineering'}
        </span>
      )
    },
    {
      header: 'Assigned Roles',
      accessor: 'availableRoles',
      render: (row) => {
        const roles = row.availableRoles || [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {roles.includes('guide') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <UserCheck className="w-3 h-3" />
                Guide
              </span>
            )}
            {(roles.includes('classroom_faculty') || roles.includes('faculty')) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <BookOpen className="w-3 h-3" />
                Faculty
              </span>
            )}
            {roles.includes('reviewer') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <UserCog className="w-3 h-3" />
                Reviewer
              </span>
            )}
            {roles.length === 0 && (
              <span className="text-xs text-gray-400 italic">No roles assigned</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Account Security',
      accessor: 'requiresPasswordChange',
      render: (row) => {
        if (row.requiresPasswordChange) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              First Login Pending
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Password Active
          </span>
        );
      }
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            className="text-gray-600 hover:text-primary-600 hover:bg-primary-50 p-1.5 rounded-lg transition-colors"
            title="Edit Member Details"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout navigationItems={navigationItems}>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Evaluator & Faculty Members
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              Provision and manage evaluator accounts with multi-role access (Guide, Classroom Faculty, Reviewer).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => loadMembers(true)}
              disabled={refreshing || loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={handleExport}
              disabled={filteredMembers.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>

            <Button
              id="addMemberBtn"
              variant="primary"
              size="md"
              onClick={handleOpenAdd}
              className="gap-2 shadow-md shadow-primary-500/20"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm animate-fade-in shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm animate-fade-in shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 border-l-4 border-l-primary-500 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Members</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Guides</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats.guidesCount}</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-500 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Classroom Faculty</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats.facultyCount}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reviewers</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats.reviewersCount}</p>
              </div>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <UserCog className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500 bg-white col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">First Login Pending</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats.pendingFirstLoginCount}</p>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <Card className="p-4 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="membersSearchInput"
                type="text"
                placeholder="Search by name, employee ID, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
                <span className="px-2 text-gray-400 uppercase tracking-wider text-[10px]">Role:</span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'guide', label: 'Guide' },
                  { id: 'classroom_faculty', label: 'Faculty' },
                  { id: 'reviewer', label: 'Reviewer' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleFilter(r.id)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      selectedRoleFilter === r.id
                        ? 'bg-white text-primary-700 shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
                <span className="px-2 text-gray-400 uppercase tracking-wider text-[10px]">Password:</span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'ACTIVE', label: 'Active' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStatusFilter(s.id)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      selectedStatusFilter === s.id
                        ? 'bg-white text-primary-700 shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </Card>

        {/* Members Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Table
            columns={columns}
            data={filteredMembers}
            keyField="id"
            isLoading={loading}
            enableSearch={false}
            enablePagination={true}
            itemsPerPage={10}
          />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ADD MEMBER MODAL                                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !submittingAdd && setIsAddModalOpen(false)}
        title="Onboard Evaluator Member"
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-5" noValidate>
          
          {addError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="font-semibold">{addError}</span>
            </div>
          )}

          {/* Security Notice Box */}
          <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
            <Key className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-1">
              <div className="font-bold text-indigo-900 text-sm">Initial Password & Security Policy</div>
              <p className="leading-relaxed">
                The account will be initialized with their <span className="font-bold text-indigo-950">Employee ID</span> as the initial password.
                In compliance with Firebase Authentication's 6-character minimum requirement, Employee IDs shorter than 6 digits are zero-padded to 6 digits (e.g., <span className="font-mono font-bold">1379</span> becomes <span className="font-mono font-bold">001379</span>).
              </p>
              <p className="text-[11px] text-indigo-700">
                Upon their first login, the member is strictly required to change their password before accessing portal dashboards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="memberName"
              label="Full Name *"
              placeholder="e.g. Dr. Rajesh Sharma"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              disabled={submittingAdd}
              required
            />

            <div>
              <Input
                id="employeeId"
                label="Employee ID *"
                placeholder="e.g. 8137"
                value={addForm.employeeId}
                onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                disabled={submittingAdd}
                required
              />
              {addForm.employeeId.trim().length > 0 && addForm.employeeId.trim().length < 6 && (
                <p className="mt-1.5 text-[11px] font-medium text-amber-600 flex items-center gap-1">
                  <span>ℹ️</span> 
                  <span>Initial password will be zero-padded to 6 digits: <strong className="font-mono font-bold">{addForm.employeeId.trim().padStart(6, '0')}</strong></span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="officialEmail"
              type="email"
              label="Official Email *"
              placeholder="e.g. rsharma@kluniversity.in"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              disabled={submittingAdd}
              required
            />

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Department *
              </label>
              <select
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                value={addForm.department}
                onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                disabled={submittingAdd}
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Roles Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Available Role(s) * (Select one or more)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {AVAILABLE_ROLES.map(role => {
                const isSelected = addForm.roles.includes(role.id);
                const Icon = role.icon;
                return (
                  <div
                    key={role.id}
                    id={`add-role-${role.id}`}
                    onClick={() => !submittingAdd && handleToggleAddRole(role.id)}
                    className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-primary-600 bg-primary-50/40 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg border ${role.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{role.label}</div>
                      <div className="text-[11px] text-gray-500 leading-tight mt-1">{role.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={submittingAdd}
            >
              Cancel
            </Button>
            <Button
              id="submitOnboardMemberBtn"
              type="submit"
              variant="primary"
              isLoading={submittingAdd}
              disabled={submittingAdd}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Onboard Member
            </Button>
          </div>

        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* EDIT MEMBER MODAL                                                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !submittingEdit && setIsEditModalOpen(false)}
        title="Edit Evaluator Member"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-5" noValidate>

          {editError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="font-semibold">{editError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="editName"
              label="Full Name *"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              disabled={submittingEdit}
              required
            />

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Employee ID (Read-only)
              </label>
              <input
                type="text"
                value={editForm.employeeId}
                disabled
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Official Email (Read-only)
              </label>
              <input
                type="text"
                value={editForm.email}
                disabled
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Department *
              </label>
              <select
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                disabled={submittingEdit}
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editStatus"
                  value="Active"
                  checked={editForm.status === 'Active'}
                  onChange={() => setEditForm({ ...editForm, status: 'Active' })}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-800">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editStatus"
                  value="Inactive"
                  checked={editForm.status === 'Inactive'}
                  onChange={() => setEditForm({ ...editForm, status: 'Inactive' })}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-800">Inactive</span>
              </label>
            </div>
          </div>

          {/* Assigned Roles Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Available Role(s) * (Select one or more)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {AVAILABLE_ROLES.map(role => {
                const isSelected = editForm.roles.includes(role.id);
                const Icon = role.icon;
                return (
                  <div
                    key={role.id}
                    onClick={() => !submittingEdit && handleToggleEditRole(role.id)}
                    className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-primary-600 bg-primary-50/40 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg border ${role.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{role.label}</div>
                      <div className="text-[11px] text-gray-500 leading-tight mt-1">{role.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={submittingEdit}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submittingEdit}
              disabled={submittingEdit}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </Button>
          </div>

        </form>
      </Modal>

    </DashboardLayout>
  );
};

export default MembersManagement;
