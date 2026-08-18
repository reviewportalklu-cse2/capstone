import { useData } from '@/contexts/DataContext';
import { useMemo } from 'react';
import { adminNavigation } from '@/constants/navigation';

export const useAdminNavigation = () => {
  const { students = [], guides = [], faculty = [], reviewers = [], teams = [], projects = [], reviews = [], dataLoading: loading } = useData();
  const stats = { students: students.length, guides: guides.length, faculty: faculty.length, reviewers: reviewers.length, teams: teams.length, projects: projects.length, reviews: reviews.length };

  const navigationWithCounts = useMemo(() => {
    return adminNavigation.map(item => {
      let count = undefined;
      
      if (!loading && stats) {
        switch (item.name) {
          case 'Students':
            count = stats.students;
            break;
          case 'Guides':
            count = stats.guides;
            break;
          case 'Reviewers':
            count = stats.reviewers;
            break;
          case 'Faculty':
            count = stats.faculty;
            break;
          default:
            break;
        }
      }

      return {
        ...item,
        count
      };
    });
  }, [stats, loading]);

  return navigationWithCounts;
};
