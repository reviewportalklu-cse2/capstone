import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = ({ navigationItems }) => {
  const { logout } = useAuth();

  return (
    <div className="hidden md:flex md:flex-shrink-0 shadow-lg z-20">
      <div className="flex flex-col w-64 bg-sidebar-dark border-r border-gray-800/50 relative">
        {/* Brand Header */}
        <div className="flex items-center px-5 h-16 bg-sidebar-dark/95 backdrop-blur-sm sticky top-0 border-b border-gray-800/80 mt-2 mb-2">
          <div className="flex items-center gap-3 w-full">
            <img src="/logo.png" alt="KL CSE Logo" className="h-8 w-auto object-contain bg-white rounded p-1" />
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold tracking-tight text-sm leading-tight truncate" title="KL CSE Capstone Portal">
                KL CSE Capstone Portal
              </span>
              <span className="text-gray-400 text-[9px] tracking-tight leading-tight uppercase font-medium truncate" title="Official Capstone Project Management Portal">
                Official Capstone Project Management Portal
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto pt-6 pb-4 scrollbar-hide">
          <div className="px-4 mb-3">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Main Menu</span>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                        isActive ? 'text-primary-400' : 'text-gray-400 group-hover:text-gray-300'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate flex-1">{item.name}</span>
                    {item.count !== undefined && (
                      <span className={`ml-auto inline-block py-0.5 px-2 text-xs font-semibold rounded-full ${isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-gray-800 text-gray-300 group-hover:bg-gray-700'}`}>
                        {item.count}
                      </span>
                    )}
                    {isActive && item.count === undefined && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* User Footer */}
        <div className="flex-shrink-0 flex border-t border-gray-800/80 p-4 bg-sidebar-dark/50">
          <button
            onClick={logout}
            className="flex-shrink-0 w-full group block px-3 py-2 text-sidebar-text hover:text-white hover:bg-sidebar-hover rounded-lg text-sm font-medium flex items-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <LogOut className="inline-block h-5 w-5 mr-3 text-gray-400 group-hover:text-red-400 transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
