import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  UserCheck, 
  BookOpen, 
  Users, 
  GraduationCap, 
  ChevronDown, 
  Check, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';

const ROLE_META = {
  admin: { label: 'Administrator', icon: ShieldCheck, color: 'bg-purple-100 text-purple-800 border-purple-200', path: '/admin/dashboard' },
  guide: { label: 'Guide / Mentor', icon: BookOpen, color: 'bg-blue-100 text-blue-800 border-blue-200', path: '/guide/dashboard' },
  classroom_faculty: { label: 'Classroom Faculty', icon: Users, color: 'bg-emerald-100 text-emerald-800 border-emerald-200', path: '/faculty/dashboard' },
  reviewer: { label: 'Reviewer', icon: UserCheck, color: 'bg-amber-100 text-amber-800 border-amber-200', path: '/reviewer/dashboard' },
  student: { label: 'Student', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-800 border-indigo-200', path: '/student/dashboard' }
};

const RoleSwitcher = () => {
  const { availableRoles, activeRole, switchRole, isRoleAvailable } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!availableRoles || availableRoles.length <= 1) {
    const currentMeta = ROLE_META[activeRole] || ROLE_META.student;
    const RoleIcon = currentMeta.icon;
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${currentMeta.color}`}>
        <RoleIcon className="w-3.5 h-3.5" />
        <span>{currentMeta.label}</span>
      </div>
    );
  }

  const currentMeta = ROLE_META[activeRole] || ROLE_META.student;
  const CurrentIcon = currentMeta.icon;

  const handleRoleSelect = async (targetRole) => {
    if (targetRole === activeRole) {
      setIsOpen(false);
      return;
    }

    if (!isRoleAvailable(targetRole)) {
      setErrorMsg("You are not authorized to access this role.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setSwitching(true);
    setIsOpen(false);
    setErrorMsg(null);

    try {
      const targetPath = await switchRole(targetRole);
      if (targetPath) {
        navigate(targetPath);
      }
    } catch (err) {
      console.error("Role switch error:", err);
      setErrorMsg("Failed to switch role.");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {errorMsg && (
        <div className="absolute top-12 right-0 z-50 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce">
          <AlertTriangle className="w-3.5 h-3.5" />
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 hover:opacity-90 ${currentMeta.color}`}
        title="Click to switch operational role"
      >
        {switching ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CurrentIcon className="w-3.5 h-3.5" />
        )}
        <span className="truncate max-w-[120px] sm:max-w-[150px]">{currentMeta.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
            <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Operational Role</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">Switch workspace identity</p>
          </div>
          <div className="py-1">
            {availableRoles.map((roleKey) => {
              const meta = ROLE_META[roleKey] || { label: roleKey, icon: GraduationCap, color: 'text-gray-700', path: '/' };
              const Icon = meta.icon;
              const isActive = roleKey === activeRole;

              return (
                <button
                  key={roleKey}
                  onClick={() => handleRoleSelect(roleKey)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors hover:bg-primary-50/60 ${
                    isActive ? 'bg-primary-50 text-primary-900 font-bold' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{meta.label}</span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-primary-600 font-bold" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
