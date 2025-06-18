import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  CheckSquare,
  Bell,
  User,
  LogOut,
  Settings,
  BarChart2,
  Calendar,
  Sparkles
} from 'lucide-react';

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navigation = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'My Habits', icon: CheckSquare, path: '/habits' },
    { name: 'Statistics', icon: BarChart2, path: '/statistics' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Notifications', icon: Bell, path: '/notifications' },
    { name: 'Profile', icon: User, path: '/profile' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center px-4 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-white" />
            <span className="text-white font-bold text-xl">HabitTracker</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors ${
                isActive(item.path)
                  ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-500'
                  : ''
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
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {user.username || 'User'}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
