import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirestoreService } from '@/firebase/services/firestore';
import { useAuth } from './AuthContext';

const AdminStatsContext = createContext(null);

export const AdminStatsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    guides: 0,
    faculty: 0,
    reviewers: 0,
    teams: 0,
    projects: 0,
    reviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    // Only fetch if admin is logged in (or we assume this context is only used in AdminRoutes)
    if (!currentUser) return;
    
    setLoading(true);
    const unsubs = [];
    
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 7) setLoading(false);
    };

    unsubs.push(FirestoreService.subscribeAll('students', (data) => {
      setStats(prev => ({...prev, students: data.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('projects', (data) => {
      setStats(prev => ({...prev, projects: data.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('guides', (data) => {
      setStats(prev => ({...prev, guides: data.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('reviewers', (data) => {
      setStats(prev => ({...prev, reviewers: data.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('classroomFaculty', (data) => {
      setStats(prev => ({...prev, faculty: data.length}));
      checkLoaded();
    }, () => checkLoaded()));

    unsubs.push(FirestoreService.subscribeAll('teams', (data) => {
      setStats(prev => ({...prev, teams: data.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('reviews', (data) => {
      setStats(prev => ({...prev, reviews: data.length}));
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
      setRecentReviews(sorted);
      checkLoaded();
    }, () => checkLoaded()));

    return () => unsubs.forEach(unsub => unsub && unsub());
  }, [currentUser]);

  return (
    <AdminStatsContext.Provider value={{ stats, loading, recentReviews }}>
      {children}
    </AdminStatsContext.Provider>
  );
};

export const useAdminStats = () => {
  const context = useContext(AdminStatsContext);
  if (!context) {
    throw new Error('useAdminStats must be used within an AdminStatsProvider');
  }
  return context;
};
