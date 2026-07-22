import React from 'react';
import { Bell, Menu, ChevronDown, Moon, CalendarDays, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GlobalSearch from '@/components/common/GlobalSearch';

const Header = ({ title = "Dashboard", setMobileMenuOpen }) => {
  const { currentUser, userRole } = useAuth();

  return (
    <header className="bg-white shadow-sm z-10 relative border-b border-gray-200/60 sticky top-0">
      <div className="flex-1 flex justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center flex-1">
          <button
            type="button"
            className="md:hidden px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <h1 className="text-xl font-bold text-gray-900 ml-2 md:ml-0 hidden lg:block tracking-tight">{title}</h1>

          {/* Global Search */}
          <div className="flex-1 max-w-xl ml-8 hidden md:block">
            <GlobalSearch />
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-3 sm:space-x-5">
          {/* Academic Year */}
          <div className="hidden sm:flex items-center px-3 py-1.5 bg-surface-dim rounded-md border border-gray-100">
            <CalendarDays className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-xs font-semibold text-gray-600">AY 2026-27</span>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

          {/* Action Icons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              type="button"
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              title="Help & Support"
            >
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              title="Toggle Theme"
            >
              <Moon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="relative p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          {/* User Profile */}
          <div className="relative flex items-center">
            <button 
              type="button"
              className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white">
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-primary-700 transition-colors">{currentUser?.email || 'User'}</p>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{userRole}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 hidden md:block" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
