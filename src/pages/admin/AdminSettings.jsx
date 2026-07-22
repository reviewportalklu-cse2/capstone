import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import SettingsProfile from '@/pages/shared/SettingsProfile';

const AdminSettings = () => {
  return (
    <DashboardLayout navigationItems={adminNavigation} title="Admin Settings">
      <SettingsProfile />
    </DashboardLayout>
  );
};

export default AdminSettings;
