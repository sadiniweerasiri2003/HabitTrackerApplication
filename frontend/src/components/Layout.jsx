import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { handleSignOut } from '../utils/auth';
import {
  Home,
  CheckSquare,
  User,
  LogOut,
  BarChart2,
  Calendar,
  Sparkles
} from 'lucide-react';

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const onSignOut = () => {
    handleSignOut(navigate);
  };
  const navigation = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'My Habits', icon: CheckSquare, path: '/habits' },
    { name: 'Statistics', icon: BarChart2, path: '/statistics' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-100 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center px-6 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-[#0B1D51]" />
            </div>
            <span className="text-[#0B1D51] font-semibold text-xl tracking-tight">HabitLoop</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-[#0B1D51] hover:bg-gray-50 transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 font-medium'
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#0B1D51] font-medium">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="ml-3 text-sm font-medium text-[#0B1D51]">
                {user.username || 'User'}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="p-2 text-[#0B1D51] opacity-75 hover:opacity-100 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
