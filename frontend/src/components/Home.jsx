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
  const [timeOfDay, setTimeOfDay] = useState('');

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
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
    else if (hour >= 17 && hour < 22) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);

  const quickActions = [
    {
      title: 'Create New Habit',
      description: 'Start tracking a new daily habit',
      icon: Plus,
      action: () => navigate('/new-habit')
    },
    {
      title: 'View Progress',
      description: 'Check your habit statistics',
      icon: TrendingUp,
      action: () => navigate('/statistics')
    },
    {
      title: 'Calendar View',
      description: 'See your monthly progress',
      icon: Calendar,
      action: () => navigate('/calendar')
    }
  ];

  const statsConfig = [
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
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-16 animate-fadeIn">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-[#0B1D51] mb-2">
            Good {timeOfDay}, {user.username}!
          </h1>
          <p className="text-gray-600">Here's an overview of your habit journey.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statsConfig.map((stat, index) => (
          <div
            key={stat.label}
            style={{
              background: `linear-gradient(135deg, white 0%, white 85%, rgba(114, 92, 173, 0.1) 100%)`
            }}
            className="relative bg-white rounded-2xl overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#0B1D51]" />
            <div className="px-6 pt-6 pb-4">
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500 mb-1">{stat.label}</span>
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-[#725CAD] animate-spin" />
                  ) : (
                    <span className="text-2xl font-bold text-[#0B1D51]">
                      {stat.getValue(stats)}
                    </span>
                  )}
                </div>
                <div className="p-2 rounded-full bg-[#0B1D51] bg-opacity-5 group-hover:bg-opacity-10 transition-all duration-300">
                  <stat.icon className="w-6 h-6 text-[#725CAD]" />
                </div>
              </div>
              {!loading && (
                <div className="flex items-center text-sm">
                  <div className="flex items-center text-[#725CAD]">
                    <span>{stat.getTrend(stats)}</span>
                  </div>
                </div>
              )}
            </div>
            <div 
              className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#0B1D51] to-[#725CAD] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
            />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#0B1D51] mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={action.action}
              className="group bg-gradient-to-br from-[#0B1D51] to-[#725CAD] p-[2px] rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_50px_rgba(11,29,81,0.3)]"
            >
              <div className="h-full w-full bg-white rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#0B1D51] to-[#725CAD] opacity-5 rounded-full transform translate-x-20 -translate-y-20 group-hover:translate-x-16 group-hover:-translate-y-16 transition-transform duration-500" />
                
                <div className="relative z-10">
                  <div className="inline-flex mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#0B1D51] to-[#725CAD] p-[2px] shadow-lg">
                      <div className="w-full h-full flex items-center justify-center rounded-2xl bg-white">
                        <action.icon className="w-8 h-8 text-[#725CAD]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-[#0B1D51] group-hover:translate-x-2 transition-transform duration-300">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 group-hover:translate-x-2 transition-transform duration-300 delay-75">
                      {action.description}
                    </p>
                  </div>

                  <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-gradient-to-r from-[#0B1D51] to-[#725CAD] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center transform group-hover:translate-x-1">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-[#0B1D51] to-[#725CAD] opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Inspiration */}
      <div className="max-w-3xl">
        <blockquote className="text-2xl font-light text-gray-500 leading-relaxed">
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
          <footer className="mt-4 text-sm text-gray-400">— Aristotle</footer>
        </blockquote>
      </div>
    </div>
  );
}
