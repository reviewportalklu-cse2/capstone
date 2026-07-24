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
  const [data, setData] = useState({
    students: [],
    guides: [],
    faculty: [],
    reviewers: [],
    teams: [],
    projects: [],
    reviews: []
  });
  
  const [loading, setLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    // Only fetch if admin is logged in
    if (!currentUser) return;
    
    setLoading(true);
    const unsubs = [];
    
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 7) setLoading(false);
    };

    unsubs.push(FirestoreService.subscribeAll('students', (res) => {
      setData(prev => ({...prev, students: res}));
      setStats(prev => ({...prev, students: res.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('projects', (res) => {
      setData(prev => ({...prev, projects: res}));
      setStats(prev => ({...prev, projects: res.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('guides', (res) => {
      setData(prev => ({...prev, guides: res}));
      setStats(prev => ({...prev, guides: res.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('reviewers', (res) => {
      setData(prev => ({...prev, reviewers: res}));
      setStats(prev => ({...prev, reviewers: res.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('classroomFaculty', (res) => {
      setData(prev => ({...prev, faculty: res}));
      setStats(prev => ({...prev, faculty: res.length}));
      checkLoaded();
    }, () => checkLoaded()));

    unsubs.push(FirestoreService.subscribeAll('teams', (res) => {
      setData(prev => ({...prev, teams: res}));
      setStats(prev => ({...prev, teams: res.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('reviews', (res) => {
      setData(prev => ({...prev, reviews: res}));
      setStats(prev => ({...prev, reviews: res.length}));
      const sorted = [...res].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
      setRecentReviews(sorted);
      checkLoaded();
    }, () => checkLoaded()));

    return () => unsubs.forEach(unsub => unsub && unsub());
  }, [currentUser]);

  return (
    <AdminStatsContext.Provider value={{ stats, data, loading, recentReviews }}>
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
