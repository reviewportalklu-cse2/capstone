import React, { useState } from 'react';
import Card from '@/components/common/Card';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/firebase/services/authService';
import { Loader2, Key, User, Shield } from 'lucide-react';

const SettingsProfile = () => {
  const { currentUser, userRole } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      return setMessage({ type: 'error', text: 'New passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return setMessage({ type: 'error', text: 'Password should be at least 6 characters.' });
    }

    setLoading(true);
    try {
      await authService.changePassword(currentUser, currentPassword, newPassword);
      
      setMessage({ type: 'success', text: 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setMessage({ type: 'error', text: 'Incorrect current password.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update password. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Profile Overview */}
      <Card title="Profile Information" icon={<User className="h-5 w-5 text-gray-500 mr-2" />}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4">
          <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl">
            {currentUser?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Email Address</p>
              <p className="text-lg font-semibold text-gray-900">{currentUser?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Account Role</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {userRole?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card title="Security & Authentication" icon={<Shield className="h-5 w-5 text-gray-500 mr-2" />}>
        <div className="md:w-2/3 p-4">
          <h3 className="text-md font-medium text-gray-900 mb-1">Change Password</h3>
          <p className="text-sm text-gray-500 mb-6">Ensure your account is using a long, random password to stay secure.</p>
          
          {message.text && (
            <div className={`p-4 mb-6 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </Card>

    </div>
  );
};

export default SettingsProfile;
