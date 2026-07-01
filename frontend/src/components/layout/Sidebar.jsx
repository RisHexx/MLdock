import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Key, Activity, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Models', path: '/models', icon: Database },
    { name: 'API Keys', path: '/api-keys', icon: Key },
    { name: 'Playground', path: '/playground', icon: Activity },
    { name: 'Logs', path: '/logs', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2 text-primary">
          <Database className="w-6 h-6" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">MlDock</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-btn text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
