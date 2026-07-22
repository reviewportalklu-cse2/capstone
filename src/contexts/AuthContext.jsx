import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/firebase/services/authService';
import { userService } from '@/firebase/services/userService';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges(async (user) => {
      if (user) {
        try {
          const role = await userService.getUserRole(user.uid);
          setUserRole(role);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await authService.logout();
  };

  const value = {
    currentUser,
    userRole,
    logout,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dim flex flex-col justify-center items-center font-sans">
        <div className="animate-pulse flex flex-col items-center">
          <img src="/logo.png" alt="CapstoneFlow Logo" className="h-16 w-auto mb-6 opacity-80" />
          <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          <p className="mt-4 text-sm font-semibold text-gray-500 tracking-wide">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
