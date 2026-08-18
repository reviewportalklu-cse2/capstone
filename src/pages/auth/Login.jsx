import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/firebase/services/authService';
import { userService } from '@/firebase/services/userService';
import { Lock, Mail, AlertCircle } from 'lucide-react';
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

const Login = () => {
  const { currentUser, activeRole, mfaRequired, mfaVerified, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.title = "KL CSE Capstone Portal - Login";
  }, []);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && currentUser) {
      if (mfaRequired && !mfaVerified) {
        navigate('/mfa-verification');
      } else if (activeRole && ROLE_ROUTES[activeRole]) {
        navigate(ROLE_ROUTES[activeRole]);
      }
    }
  }, [currentUser, activeRole, mfaRequired, mfaVerified, authLoading, navigate]);

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isLoggingIn) return;

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoggingIn(true);
    setErrorMsg('');

    try {
      console.log("[AUTH_RUNTIME] Submitting login credentials for:", email.trim());
      await authService.login(email.trim(), password);
    } catch (error) {
      console.error("[AUTH_RUNTIME] Login Error:", error);
      setErrorMsg('Invalid email or password. Please check your credentials.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="flex justify-center">
          <Logo size="lg" bgVariant="white" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-gray-900">
          KL CSE Capstone Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Official Capstone Project Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        <div className="bg-white py-8 px-4 shadow-card hover:shadow-card-hover transition-shadow duration-300 sm:rounded-xl sm:px-10 border border-gray-100">
          
          <form className="space-y-6" onSubmit={handleFormSubmit} noValidate>
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            <Input
              id="email"
              type="email"
              label="Email address"
              icon={Mail}
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoggingIn}
              required
            />

            <Input
              id="password"
              type="password"
              label="Password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn}
              required
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoggingIn}
                  className="h-4 w-4 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:outline-none border-gray-300 rounded transition-colors cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-medium cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors focus:outline-none focus:underline">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                isLoading={isLoggingIn}
                disabled={isLoggingIn}
                fullWidth
                size="lg"
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-xs font-medium text-gray-400">
          &copy; {new Date().getFullYear()} KL CSE Capstone Portal. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;
