import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-end px-6 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-border">
            <UserIcon className="w-4 h-4 text-gray-500" />
          </div>
          <span className="font-medium">{user?.username || 'Admin'}</span>
        </div>
        
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
