import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import SettingsProfile from '@/pages/shared/SettingsProfile';

const AdminSettings = () => {
  const navigationItems = useAdminNavigation();

  return (
    <DashboardLayout navigationItems={navigationItems} title="Admin Settings">
      <SettingsProfile />
    </DashboardLayout>
  );
};

export default AdminSettings;
