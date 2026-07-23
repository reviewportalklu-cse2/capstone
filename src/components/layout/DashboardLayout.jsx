import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const DashboardLayout = ({ children, navigationItems, title }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    document.title = "KL CSE Capstone Portal";
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-surface-dim font-sans">
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-sidebar-dark pt-5 pb-4">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            
            <div className="flex-shrink-0 flex items-center px-4 gap-3">
              <img src="/logo.png" alt="KL CSE Logo" className="h-8 w-auto bg-white p-1 rounded" />
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-tight tracking-tight">KL CSE Capstone Portal</span>
                <span className="text-gray-400 text-[9px] uppercase font-medium">Official Capstone Project Management Portal</span>
              </div>
            </div>
            
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-sidebar-hover text-primary-400'
                          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={`mr-4 flex-shrink-0 h-6 w-6 transition-colors ${
                            isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-300'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="flex-1">{item.name}</span>
                        {item.count !== undefined && (
                          <span className={`ml-auto inline-block py-0.5 px-2 text-xs font-semibold rounded-full ${isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-gray-800 text-gray-300 group-hover:bg-gray-700'}`}>
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
              <button
                onClick={logout}
                className="flex-shrink-0 w-full group block text-sidebar-text hover:text-white text-base font-medium flex items-center transition-colors hover:bg-sidebar-hover p-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar navigationItems={navigationItems} />

      {/* Main Content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden bg-surface-dim">
        <Header title={title} setMobileMenuOpen={setMobileMenuOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
