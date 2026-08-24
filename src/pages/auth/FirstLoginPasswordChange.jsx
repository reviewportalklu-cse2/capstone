import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/firebase/services/authService';
import { Lock, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Logo from '@/components/common/Logo';

const ROLE_ROUTES = {
  admin: '/admin',
  guide: '/guide',
  reviewer: '/reviewer',
  classroom_faculty: '/faculty',
  faculty: '/faculty',
  student: '/student'
};

const FirstLoginPasswordChange = () => {
  const { currentUser, activeRole, requiresPasswordChange, completePasswordChange } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    document.title = "KL CSE Capstone Portal - First Login Password Change";
  }, []);

  useEffect(() => {
    // If password change is not required or user is not logged in, redirect
    if (!currentUser) {
      navigate('/login');
    } else if (requiresPasswordChange === false) {
      const targetPath = ROLE_ROUTES[activeRole] || '/';
      navigate(targetPath);
    }
  }, [currentUser, requiresPasswordChange, activeRole, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please enter both your new password and confirmation.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Determine effective current password: if provided use it, else attempt initial employee ID candidates
      let passToUse = currentPassword;
      if (!passToUse) {
        const empIdFromEmail = currentUser.email ? currentUser.email.split('@')[0] : '';
        passToUse = empIdFromEmail;
      }

      // Try changing password via authService
      try {
        await authService.changePassword(currentUser, passToUse, newPassword);
      } catch (changeErr) {
        // Fallback: If user entered exact 4/5 digit employee ID, try padded version if current password failed
        if (passToUse && passToUse.length < 6) {
          const paddedPass = passToUse.padStart(6, '0');
          await authService.changePassword(currentUser, paddedPass, newPassword);
        } else {
          throw changeErr;
        }
      }

      // 2. Mark password change complete in Firestore & AuthContext state
      await completePasswordChange();

      setSuccessMsg('Password successfully changed! Redirecting to dashboard...');

      setTimeout(() => {
        const targetPath = ROLE_ROUTES[activeRole] || '/';
        navigate(targetPath);
      }, 1000);

    } catch (err) {
      console.error("[FIRST_LOGIN_AUTH] Password change failed:", err);
      setErrorMsg(err.message || 'Failed to update password. Please check your current password and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="flex justify-center">
          <Logo size="lg" bgVariant="white" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-gray-900">
          First Login — Set New Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          For security, please set a new password for account <span className="font-semibold text-primary-600">{currentUser?.email}</span> before proceeding.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        <div className="bg-white py-8 px-4 shadow-card hover:shadow-card-hover transition-shadow duration-300 sm:rounded-xl sm:px-10 border border-gray-100">
          
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            <Input
              id="currentPassword"
              type="password"
              label="Initial Password (Employee ID)"
              icon={Lock}
              placeholder="Enter initial Employee ID"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
            />

            <Input
              id="newPassword"
              type="password"
              label="New Password"
              icon={Lock}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm New Password"
              icon={ShieldCheck}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                fullWidth
                size="lg"
              >
                Set New Password & Access Portal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPasswordChange;
