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
      const normalized = res.map(doc => ({
        ...doc,
        name: doc.name || doc.Name || '',
        email: doc.email || doc.Email || '',
        rollNo: doc.rollNo || doc.rollNumber || doc['Roll Number'] || doc['Roll No'] || '',
        department: doc.department || doc.Department || '',
        batch: doc.batch || doc.Batch || ''
      }));
      setData(prev => ({...prev, students: normalized}));
      setStats(prev => ({...prev, students: normalized.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('projects', (res) => {
      setData(prev => ({...prev, projects: res}));
      setStats(prev => ({...prev, projects: res.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('guides', (res) => {
      const normalized = res.map(doc => ({
        ...doc,
        name: doc.name || doc.Name || '',
        email: doc.email || doc.Email || '',
        department: doc.department || doc.Department || '',
        designation: doc.designation || doc.Designation || ''
      }));
      setData(prev => ({...prev, guides: normalized}));
      setStats(prev => ({...prev, guides: normalized.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('reviewers', (res) => {
      const normalized = res.map(doc => ({
        ...doc,
        name: doc.name || doc.Name || '',
        email: doc.email || doc.Email || '',
        department: doc.department || doc.Department || '',
        assignedBatch: doc.assignedBatch || doc['Assigned Batch'] || doc.Batch || ''
      }));
      setData(prev => ({...prev, reviewers: normalized}));
      setStats(prev => ({...prev, reviewers: normalized.length}));
      checkLoaded();
    }, () => checkLoaded()));
    
    unsubs.push(FirestoreService.subscribeAll('classroomFaculty', (res) => {
      const normalized = res.map(doc => ({
        ...doc,
        name: doc.name || doc.Name || '',
        email: doc.email || doc.Email || '',
        department: doc.department || doc.Department || ''
      }));
      setData(prev => ({...prev, faculty: normalized}));
      setStats(prev => ({...prev, faculty: normalized.length}));
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
