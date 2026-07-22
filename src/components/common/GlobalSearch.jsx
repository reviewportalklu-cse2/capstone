import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, User, BookOpen, UserCheck, UserCog, GraduationCap, MessageSquare, Award, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { studentService, projectService, guideService, reviewerService, facultyService, remarkService, reviewService } from '@/firebase/services';

const GlobalSearch = () => {
  const { userRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query.trim().toLowerCase());
    }, 250);

    return () => clearTimeout(timer);
  }, [query, userRole, currentUser]);

  const performSearch = async (q) => {
    setLoading(true);
    setIsOpen(true);
    setSelectedIndex(-1);
    
    try {
      const items = [];

      if (userRole === 'admin') {
        const [students, projects, guides, reviewers, faculty] = await Promise.all([
          studentService.getAll(),
          projectService.getAll(),
          guideService.getAll(),
          reviewerService.getAll(),
          facultyService.getAll()
        ]);

        students.filter(s => 
          s.name?.toLowerCase().includes(q) || 
          (s.rollNumber || s.rollNo)?.toLowerCase().includes(q) ||
          s.batch?.toLowerCase().includes(q)
        ).slice(0, 4).forEach(s => {
          items.push({
            id: `st-${s.id || s.uid}`,
            category: 'Students',
            title: s.name,
            subtitle: `Roll: ${s.rollNumber || s.rollNo || 'N/A'} | Batch: ${s.batch || 'N/A'}`,
            route: `/admin/students`,
            icon: User
          });
        });

        projects.filter(p => 
          p.title?.toLowerCase().includes(q) || 
          p.teamName?.toLowerCase().includes(q) ||
          p.domain?.toLowerCase().includes(q)
        ).slice(0, 4).forEach(p => {
          items.push({
            id: `pr-${p.id}`,
            category: 'Projects',
            title: p.title || p.teamName,
            subtitle: `Domain: ${p.domain || 'N/A'} | Team: ${p.teamName || 'N/A'}`,
            route: `/admin/projects`,
            icon: BookOpen
          });
        });

        guides.filter(g => 
          g.name?.toLowerCase().includes(q) || 
          g.email?.toLowerCase().includes(q) ||
          g.department?.toLowerCase().includes(q)
        ).slice(0, 3).forEach(g => {
          items.push({
            id: `gu-${g.id}`,
            category: 'Guides',
            title: g.name,
            subtitle: `Dept: ${g.department || 'N/A'} | ${g.email}`,
            route: `/admin/guides`,
            icon: UserCheck
          });
        });

        reviewers.filter(r => 
          r.name?.toLowerCase().includes(q) || 
          r.email?.toLowerCase().includes(q)
        ).slice(0, 3).forEach(r => {
          items.push({
            id: `re-${r.id}`,
            category: 'Reviewers',
            title: r.name,
            subtitle: `Department: ${r.department || 'N/A'}`,
            route: `/admin/reviewers`,
            icon: UserCog
          });
        });

        faculty.filter(f => 
          f.name?.toLowerCase().includes(q) || 
          f.email?.toLowerCase().includes(q)
        ).slice(0, 3).forEach(f => {
          items.push({
            id: `fa-${f.id}`,
            category: 'Faculty',
            title: f.name,
            subtitle: `Dept: ${f.department || 'N/A'}`,
            route: `/admin/faculty`,
            icon: GraduationCap
          });
        });
      } else if (userRole === 'faculty') {
        const [students, projects] = await Promise.all([
          studentService.getByFacultyId(currentUser?.uid),
          projectService.getAll()
        ]);

        students.filter(s => 
          s.name?.toLowerCase().includes(q) || 
          (s.rollNumber || s.rollNo)?.toLowerCase().includes(q)
        ).slice(0, 5).forEach(s => {
          items.push({
            id: `st-${s.id || s.uid}`,
            category: 'Assigned Students',
            title: s.name,
            subtitle: `Roll: ${s.rollNumber || s.rollNo || 'N/A'}`,
            route: `/faculty/students`,
            icon: User
          });
        });

        projects.filter(p => 
          p.title?.toLowerCase().includes(q) || 
          p.teamName?.toLowerCase().includes(q)
        ).slice(0, 5).forEach(p => {
          items.push({
            id: `pr-${p.id}`,
            category: 'Projects',
            title: p.title || p.teamName,
            subtitle: `Domain: ${p.domain || 'N/A'}`,
            route: `/faculty/search`,
            icon: BookOpen
          });
        });
      } else if (userRole === 'guide') {
        const [students, projects, remarks] = await Promise.all([
          studentService.getByGuideId(currentUser?.uid),
          projectService.getAll(),
          remarkService.getRemarksByAuthor(currentUser?.uid)
        ]);

        students.filter(s => 
          s.name?.toLowerCase().includes(q) || 
          (s.rollNumber || s.rollNo)?.toLowerCase().includes(q)
        ).slice(0, 5).forEach(s => {
          items.push({
            id: `st-${s.id || s.uid}`,
            category: 'Assigned Students',
            title: s.name,
            subtitle: `Roll: ${s.rollNumber || s.rollNo || 'N/A'}`,
            route: `/guide/students`,
            icon: User
          });
        });

        projects.filter(p => p.guideId === currentUser?.uid && (p.title?.toLowerCase().includes(q) || p.teamName?.toLowerCase().includes(q)))
          .slice(0, 5).forEach(p => {
            items.push({
              id: `pr-${p.id}`,
              category: 'My Projects',
              title: p.title || p.teamName,
              subtitle: `Domain: ${p.domain || 'N/A'}`,
              route: `/guide/projects`,
              icon: BookOpen
            });
          });

        remarks.filter(r => r.title?.toLowerCase().includes(q) || r.content?.toLowerCase().includes(q))
          .slice(0, 4).forEach(r => {
            items.push({
              id: `rm-${r.id}`,
              category: 'Review Remarks',
              title: r.title,
              subtitle: r.content,
              route: `/guide/remarks`,
              icon: MessageSquare
            });
          });
      } else if (userRole === 'reviewer') {
        const [students, reviews] = await Promise.all([
          studentService.getByReviewerId(currentUser?.uid),
          reviewService.getByReviewerId(currentUser?.uid)
        ]);

        students.filter(s => 
          s.name?.toLowerCase().includes(q) || 
          (s.rollNumber || s.rollNo)?.toLowerCase().includes(q)
        ).slice(0, 5).forEach(s => {
          items.push({
            id: `st-${s.id || s.uid}`,
            category: 'Assigned Students',
            title: s.name,
            subtitle: `Roll: ${s.rollNumber || s.rollNo || 'N/A'} | Stage: ${s.reviewStage || 'Review 1'}`,
            route: `/reviewer/students`,
            icon: UserCheck
          });
        });

        reviews.filter(r => r.reviewType?.toLowerCase().includes(q) || r.remarks?.toLowerCase().includes(q))
          .slice(0, 5).forEach(r => {
            items.push({
              id: `rv-${r.id}`,
              category: 'Evaluations',
              title: `${r.reviewType} - Score: ${r.totalScore}/100`,
              subtitle: r.remarks || 'No remarks',
              route: `/reviewer/review1`,
              icon: Award
            });
          });
      } else if (userRole === 'student') {
        const [studentDoc, remarks] = await Promise.all([
          studentService.getById(currentUser?.uid),
          remarkService.getAll()
        ]);

        if (studentDoc) {
          if ('project'.includes(q) || studentDoc.projectTitle?.toLowerCase().includes(q)) {
            items.push({
              id: 'st-proj',
              category: 'Project',
              title: studentDoc.projectTitle || 'My Capstone Project',
              subtitle: 'View your project details',
              route: '/student/project',
              icon: BookOpen
            });
          }
          if ('guide'.includes(q) || studentDoc.guideName?.toLowerCase().includes(q)) {
            items.push({
              id: 'st-guide',
              category: 'Guide',
              title: studentDoc.guideName || 'Assigned Guide',
              subtitle: 'View your guide information',
              route: '/student/guide',
              icon: UserCheck
            });
          }
          if ('marks'.includes(q) || 'score'.includes(q)) {
            items.push({
              id: 'st-marks',
              category: 'Marks',
              title: 'Academic Marks & Evaluation',
              subtitle: 'View review scores and faculty marks',
              route: '/student/marks',
              icon: Award
            });
          }
        }

        remarks.filter(r => r.studentId === currentUser?.uid && (r.title?.toLowerCase().includes(q) || r.content?.toLowerCase().includes(q)))
          .slice(0, 4).forEach(r => {
            items.push({
              id: `rm-${r.id}`,
              category: 'Remarks',
              title: r.title,
              subtitle: r.content,
              route: '/student/remarks',
              icon: MessageSquare
            });
          });
      }

      setResults(items);
    } catch (err) {
      console.error("Global search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery('');
    navigate(item.route);
  };

  const highlightMatch = (text, q) => {
    if (!text || !q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5 font-bold">{part}</mark>
      ) : part
    );
  };

  const groupedResults = results.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-primary-600 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
          )}
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm"
          placeholder={`Search ${userRole || 'portal'}... (Press /)`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[28rem] overflow-y-auto z-50 divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              Searching live Firestore records...
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No matching records found.
            </div>
          ) : (
            Object.keys(groupedResults).map((category) => (
              <div key={category} className="p-2">
                <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {groupedResults[category].map((item) => {
                  const globalIdx = results.findIndex(r => r.id === item.id);
                  const isSelected = globalIdx === selectedIndex;
                  const Icon = item.icon || FileText;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-50 text-primary-900' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md mt-0.5 ${isSelected ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {highlightMatch(item.title, query)}
                        </p>
                        {item.subtitle && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {highlightMatch(item.subtitle, query)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
