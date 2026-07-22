import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authService } from '@/firebase/services/authService';
import { userService } from '@/firebase/services/userService';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await authService.login(data.email, data.password);
      
      const role = await userService.getUserRole(user.uid);
      
      if (role) {
        if (role === 'admin') navigate('/admin');
        else if (role === 'guide') navigate('/guide');
        else if (role === 'reviewer') navigate('/reviewer');
        else if (role === 'classroom_faculty') navigate('/faculty');
        else if (role === 'student') navigate('/student');
        else {
          setErrorMsg('Invalid user role assigned.');
          await authService.logout();
        }
      } else {
        setErrorMsg('User profile not found in database.');
        await authService.logout();
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMsg('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="flex justify-center">
          <img src="/logo.png" alt="CapstoneFlow Logo" className="h-16 w-auto object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-gray-900">
          CapstoneFlow
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Enterprise Capstone Project Management & Review Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        <div className="bg-white py-8 px-4 shadow-card hover:shadow-card-hover transition-shadow duration-300 sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center">
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            <Input
              id="email"
              type="email"
              label="Email address"
              icon={Mail}
              placeholder="name@university.edu"
              error={errors.email?.message}
              {...register("email", { required: "Email is required" })}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password", { required: "Password is required" })}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
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
                isLoading={loading}
                fullWidth
                size="lg"
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>
        <div className="mt-8 text-center text-xs font-medium text-gray-400">
          &copy; {new Date().getFullYear()} CapstoneFlow. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;
