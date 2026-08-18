import Logo from '@/components/common/Logo';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = ({ navigationItems = [] }) => {
  const { logout } = useAuth();

  // Group items by section if available
  const hasSections = navigationItems.some(item => item.section);

  const renderNavItem = (item) => (
    <NavLink
      key={item.name}
      to={item.href}
      className={({ isActive }) =>
        `group flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          isActive
            ? 'bg-primary-500/15 text-primary-400 font-semibold'
            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-gray-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={`mr-2.5 flex-shrink-0 h-4 w-4 transition-colors duration-200 ${
              isActive ? 'text-primary-400' : 'text-gray-400 group-hover:text-gray-300'
            }`}
            aria-hidden="true"
          />
          <span className="truncate flex-1">{item.name}</span>
          {item.count !== undefined && (
            <span className={`ml-auto inline-block py-0.5 px-2 text-[10px] font-bold rounded-full ${isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'}`}>
              {item.count}
            </span>
          )}
          {isActive && item.count === undefined && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="hidden md:flex md:flex-shrink-0 shadow-lg z-20">
      <div className="flex flex-col w-64 bg-sidebar-dark border-r border-gray-800/50 relative">
        {/* Brand Header */}
        <div className="flex items-center px-5 h-16 bg-sidebar-dark/95 backdrop-blur-sm sticky top-0 border-b border-gray-800/80 z-10">
          <div className="flex items-center gap-3 w-full">
            <Logo size="sm" bgVariant="white" />
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold tracking-tight text-sm leading-tight truncate" title="KL CSE Capstone Portal">
                KL CSE Capstone Portal
              </span>
              <span className="text-gray-400 text-[9px] tracking-tight leading-tight uppercase font-medium truncate" title="Official Capstone Project Management Portal">
                Enterprise Admin Center
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto pt-4 pb-4 scrollbar-hide">
          {hasSections ? (
            <div className="px-3 space-y-4">
              {Array.from(new Set(navigationItems.map(i => i.section || 'General'))).map((sectionName) => {
                const sectionItems = navigationItems.filter(i => (i.section || 'General') === sectionName);
                return (
                  <div key={sectionName} className="space-y-1">
                    <div className="px-3 py-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {sectionName}
                      </span>
                    </div>
                    {sectionItems.map(renderNavItem)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3 space-y-1">
              <div className="px-3 mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main Menu</span>
              </div>
              <nav className="space-y-1">
                {navigationItems.map(renderNavItem)}
              </nav>
            </div>
          )}
        </div>
        
        {/* User Footer */}
        <div className="flex-shrink-0 flex border-t border-gray-800/80 p-3 bg-sidebar-dark/50">
          <button
            onClick={logout}
            className="flex-shrink-0 w-full group px-3 py-2 text-sidebar-text hover:text-white hover:bg-sidebar-hover rounded-lg text-xs font-medium flex items-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <LogOut className="inline-block h-4 w-4 mr-2.5 text-gray-400 group-hover:text-red-400 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
