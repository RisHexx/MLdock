import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Moon, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-end px-6 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-btn text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="h-6 w-px bg-border" />

        <Link
          to="/settings"
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          title="Account settings"
        >
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-border">
            <UserIcon className="w-4 h-4 text-gray-500" />
          </div>
          <span className="font-medium">{user?.username || 'Admin'}</span>
        </Link>

        <div className="h-6 w-px bg-border" />

        <button
          onClick={logout}
          className="text-gray-500 hover:text-red-600 transition-colors focus:outline-none flex items-center gap-2 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
