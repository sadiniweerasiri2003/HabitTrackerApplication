import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { habitsApi } from '../services/api';

export function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await habitsApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Create New Habit',
      description: 'Start tracking a new daily habit',
      icon: Plus,
      action: () => navigate('/new-habit'),
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'View Progress',
      description: 'Check your habit statistics',
      icon: TrendingUp,
      action: () => navigate('/statistics'),
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Calendar View',
      description: 'See your monthly progress',
      icon: Calendar,
      action: () => navigate('/calendar'),
      color: 'from-purple-500 to-pink-600'
    }
  ];  const statsConfig = [
    { 
      label: 'Active Habits', 
      getValue: (data) => (data?.activeHabits ?? 0).toString(), 
      icon: Target,
      getTrend: (data) => (data?.activeHabits > 0 ? 'Active now' : 'Start one today!')
    },
    { 
      label: 'Completion Rate', 
      getValue: (data) => `${data?.completionRate ?? 0}%`, 
      icon: CheckCircle2,
      getTrend: (data) => {
        const change = data?.weekOverWeekChange ?? 0;
        return `${change > 0 ? '+' : ''}${change}% vs last week`;
      }
    },
    { 
      label: 'Current Streak', 
      getValue: (data) => `${data?.currentStreak ?? 0} days`, 
      icon: Zap,
      getTrend: (data) => `Best: ${data?.bestStreak ?? 0} days`
    },
    { 
      label: 'Total Achievements', 
      getValue: (data) => (data?.achievements ?? 0).toString(), 
      icon: Trophy,
      getTrend: (data) => (data?.newAchievements > 0 ? `${data?.newAchievements} new unlocked` : 'Keep going!')
    }
  ];  return (
    <div className="content-container">
      {/* Welcome Section */}
      <div className="mb-8 animate-fadeIn">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user.username || 'User'}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Keep up the great work on building better habits.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid-container cols-3 mb-8">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="relative group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-200" 
                 style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
            </div>
            <div className={`w-12 h-12 mb-4 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {action.title}
            </h3>
            <p className="text-gray-600">
              {action.description}
            </p>
          </button>
        ))}
      </div>      {/* Stats Grid */}
      <div className="grid-container cols-4">
        {loading ? (
          <>
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-6 h-6 bg-blue-200 rounded" />
                  <div className="w-20 h-4 bg-gray-200 rounded" />
                </div>
                <div className="w-16 h-8 bg-gray-300 rounded mb-1" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </>
        ) : error ? (          <div className="col-span-4 bg-red-50 p-4 rounded-xl border border-red-100">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={fetchStats}
                className="text-sm px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            {statsConfig.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="w-6 h-6 text-blue-500" />
                  <span className="text-sm text-gray-500">{stat.getTrend(stats)}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.getValue(stats)}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Motivational Quote */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 text-white">
        <blockquote className="text-xl font-medium italic">
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
        </blockquote>
        <p className="mt-2 text-blue-100">- Aristotle</p>
      </div>
    </div>
  );
}
