import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import SettingsProfile from '@/pages/shared/SettingsProfile';
import AcademicRules from './settings/AcademicRules';
import Card from '@/components/common/Card';
import { useData } from '@/contexts/DataContext';

const AdminSettings = () => {
  const navigationItems = useAdminNavigation();
  const { settings } = useData();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Admin Profile' },
    { id: 'academic', label: 'Academic Weights & Rules' },
  ];

  return (
    <DashboardLayout navigationItems={navigationItems} title="Admin Settings">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'profile' && <SettingsProfile />}
            {activeTab === 'academic' && <AcademicRules settings={settings} />}
          </div>
        </Card>
        
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
