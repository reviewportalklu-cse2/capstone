import { useMemo } from 'react';
import { adminNavigation } from '@/constants/navigation';
import { useAdminStats } from '@/contexts/AdminStatsContext';

export const useAdminNavigation = () => {
  const { stats, loading } = useAdminStats();

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
