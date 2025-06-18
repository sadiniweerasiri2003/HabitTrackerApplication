import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInDays, parseISO } from 'date-fns';
import { 
  Trophy, 
  Target, 
  Flame, 
  Calendar, 
  BarChart3, 
  Award, 
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { habitsApi } from '../services/api';

// Reusable stat card component with improved visibility
const StatCard = ({ icon: Icon, title, value, description, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">{title}</p>
        <h4 className="text-3xl font-bold text-gray-900 mb-2" style={{ textShadow: '0 0 1px rgba(0,0,0,0.1)' }}>{value}</h4>
        <p className="text-sm font-medium text-gray-600">{description}</p>
      </div>
      <div 
        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${color}`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Calendar heatmap component
const HeatmapCalendar = ({ data }) => {
  const today = new Date();
  const startDate = startOfWeek(today);
  const endDate = endOfWeek(today);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => {
        const dayData = data.find(d => isSameDay(parseISO(d.date), day));
        const completionRate = dayData ? (dayData.completed / dayData.total) * 100 : 0;
        
        let bgColor;
        if (completionRate === 0) bgColor = 'bg-gray-100';
        else if (completionRate < 30) bgColor = 'bg-green-100';
        else if (completionRate < 60) bgColor = 'bg-green-300';
        else if (completionRate < 90) bgColor = 'bg-green-500';
        else bgColor = 'bg-green-600';

        return (
          <div key={day.toISOString()} className="relative">
            <div className={`w-full aspect-square rounded-lg ${bgColor} flex items-center justify-center`}>
              <span className="text-xs font-medium text-gray-700">
                {format(day, 'd')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Streak chart component
const StreakChart = ({ streaks }) => {
  const maxStreak = Math.max(...streaks);
  return (
    <div className="flex items-end gap-1 h-32">
      {streaks.map((streak, index) => (
        <div
          key={index}
          className="w-4 bg-blue-500 rounded-t transition-all duration-300"
          style={{ 
            height: `${(streak / maxStreak) * 100}%`,
            opacity: 0.5 + (index / streaks.length) * 0.5
          }}
        />
      ))}
    </div>
  );
};

export function Statistics() {
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHabits: 0,
    activeStreak: 0,
    completionRate: 0,
    consistencyScore: 0,
    habitsByPriority: { high: 0, medium: 0, low: 0 },
    weeklyData: [],
    longestStreak: 0,
    mostConsistentHabit: '',
    totalCompletions: 0,
    streaks: []
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const data = await habitsApi.getAllHabits();
      setHabits(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (habits) => {
    const today = new Date();
    let totalCompletions = 0;
    let completedToday = 0;
    let dueToday = 0;
    let habitsByPriority = { high: 0, medium: 0, low: 0 };
    let longestStreak = 0;
    let currentStreak = 0;
    let mostConsistentHabit = '';
    let bestCompletionRate = 0;
    let weeklyData = [];
    let allStreaks = [];

    // Count habits by priority
    habits.forEach(habit => {
      habitsByPriority[habit.priority]++;
    });

    // Calculate completions and streaks for each habit
    habits.forEach(habit => {
      if (!habit.progress) return;

      // Sort progress by date
      const sortedProgress = [...habit.progress].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      // Calculate individual habit streak and completions
      let habitCurrentStreak = 0;
      let habitMaxStreak = 0;
      let habitCompletions = 0;
      let lastCompletedDate = null;

      sortedProgress.forEach(progress => {
        const progressDate = new Date(progress.date);
        
        // Count total completions
        if (progress.completed) {
          habitCompletions++;

          // Check for streak
          if (!lastCompletedDate) {
            habitCurrentStreak = 1;
          } else {
            const dayDiff = Math.abs(differenceInDays(progressDate, lastCompletedDate));
            if (dayDiff === 1) {
              habitCurrentStreak++;
            } else {
              habitCurrentStreak = 1;
            }
          }
          lastCompletedDate = progressDate;
        } else {
          habitCurrentStreak = 0;
        }

        habitMaxStreak = Math.max(habitMaxStreak, habitCurrentStreak);
      });

      // Update total completions
      totalCompletions += habitCompletions;

      // Update longest streak
      longestStreak = Math.max(longestStreak, habitMaxStreak);
      
      // Track all streaks for the streak history
      allStreaks.push(habitMaxStreak);

      // Check if due today and if completed
      if (isHabitDueToday(habit)) {
        dueToday++;
        const todayProgress = habit.progress.find(p => 
          isSameDay(parseISO(p.date), today)
        );
        if (todayProgress?.completed) {
          completedToday++;
        }
      }

      // Calculate completion rate for this habit
      const completionRate = habitCompletions / sortedProgress.length;
      if (completionRate > bestCompletionRate && habit.name) {
        bestCompletionRate = completionRate;
        mostConsistentHabit = habit.name;
      }

      // Update current streak if this is the highest
      if (habitCurrentStreak > currentStreak) {
        currentStreak = habitCurrentStreak;
      }
    });

    // Calculate weekly data
    const startDate = startOfWeek(today);
    const endDate = endOfWeek(today);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    weeklyData = days.map(day => {
      const dueHabits = habits.filter(habit => isHabitDueOnDate(habit, day));
      const completedCount = dueHabits.reduce((acc, habit) => {
        const progress = habit.progress?.find(p => isSameDay(parseISO(p.date), day));
        return acc + (progress?.completed ? 1 : 0);
      }, 0);
      
      return { 
        date: day.toISOString(), 
        completed: completedCount, 
        total: dueHabits.length 
      };
    });

    // Calculate overall consistency score (0-100)
    const totalPossibleCompletions = habits.reduce((acc, habit) => {
      if (!habit.progress) return acc;
      return acc + habit.progress.length;
    }, 0);

    const consistencyScore = totalPossibleCompletions > 0
      ? Math.round((totalCompletions / totalPossibleCompletions) * 100)
      : 0;

    setStats({
      totalHabits: habits.length,
      activeStreak: currentStreak,
      completionRate: dueToday ? Math.round((completedToday / dueToday) * 100) : 0,
      consistencyScore,
      habitsByPriority,
      weeklyData,
      longestStreak,
      mostConsistentHabit: mostConsistentHabit || 'No habits yet',
      totalCompletions,
      streaks: allStreaks.slice(-15) // Show last 15 streaks
    });
  };

  const isHabitDueOnDate = (habit, date) => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

    // Don't count habits before their start date
    if (new Date(habit.startDate) > date) {
      return false;
    }

    switch (habit.frequency) {
      case 'daily':
        return true;
      case 'weekdays':
        return !['sat', 'sun'].includes(dayOfWeek);
      case 'weekly':
      case 'custom':
        return habit.days.includes(dayOfWeek.slice(0, 3));
      default:
        return false;
    }
  };

  const isHabitDueToday = (habit) => {
    return isHabitDueOnDate(habit, new Date());
  };

  if (isLoading) {
    return (
      <div className="content-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="content-container">
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm py-4 z-10 -mx-6 px-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
        <p className="text-gray-700 mt-1">Track your progress and achievements</p>
      </div>

      {/* Main stats grid with improved visibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Trophy}
          title="Active Streak"
          value={`${stats.activeStreak} days`}
          description="Keep it going!"
          color="bg-yellow-500"
        />
        <StatCard
          icon={Target}
          title="Today's Progress"
          value={`${stats.completionRate}%`}
          description="Of today's habits completed"
          color="bg-green-600"
        />
        <StatCard
          icon={Flame}
          title="Consistency Score"
          value={`${stats.consistencyScore}%`}
          description="Overall completion rate"
          color="bg-red-600"
        />
        <StatCard
          icon={Star}
          title="Total Completions"
          value={stats.totalCompletions}
          description="Habits marked as done"
          color="bg-purple-600"
        />
      </div>

      {/* Secondary stats grid with improved contrast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Weekly Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Weekly Overview</h3>
            <Calendar className="w-5 h-5 text-gray-600" />
          </div>
          <HeatmapCalendar data={stats.weeklyData} />
          <div className="mt-4 grid grid-cols-5 gap-2">
            <div className="text-xs text-center">
              <div className="w-full h-4 bg-gray-200 rounded mb-1"></div>
              <span className="text-gray-700 font-medium">0%</span>
            </div>
            <div className="text-xs text-center">
              <div className="w-full h-4 bg-green-200 rounded mb-1"></div>
              <span className="text-gray-700 font-medium">&lt;30%</span>
            </div>
            <div className="text-xs text-center">
              <div className="w-full h-4 bg-green-400 rounded mb-1"></div>
              <span className="text-gray-700 font-medium">&lt;60%</span>
            </div>
            <div className="text-xs text-center">
              <div className="w-full h-4 bg-green-500 rounded mb-1"></div>
              <span className="text-gray-700 font-medium">&lt;90%</span>
            </div>
            <div className="text-xs text-center">
              <div className="w-full h-4 bg-green-600 rounded mb-1"></div>
              <span className="text-gray-700 font-medium">90%+</span>
            </div>
          </div>
        </div>

        {/* Streak History with improved contrast */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Streak History</h3>
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </div>
          <StreakChart streaks={stats.streaks} />
          <div className="mt-4 flex items-center justify-between text-sm font-medium">
            <span className="text-gray-700">Last 15 streaks</span>
            <span className="text-gray-900">Longest: {stats.longestStreak} days</span>
          </div>
        </div>
      </div>

      {/* Additional stats with improved visibility */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Habits by Priority */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Habits by Priority</h3>
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">High Priority</span>
                <span className="text-sm font-bold text-gray-900">{stats.habitsByPriority.high}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full">
                <div 
                  className="h-3 bg-red-500 rounded-full shadow-sm"
                  style={{ width: `${(stats.habitsByPriority.high / stats.totalHabits) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Medium Priority</span>
                <span className="text-sm font-bold text-gray-900">{stats.habitsByPriority.medium}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full">
                <div 
                  className="h-3 bg-yellow-500 rounded-full shadow-sm"
                  style={{ width: `${(stats.habitsByPriority.medium / stats.totalHabits) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Low Priority</span>
                <span className="text-sm font-bold text-gray-900">{stats.habitsByPriority.low}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full">
                <div 
                  className="h-3 bg-green-500 rounded-full shadow-sm"
                  style={{ width: `${(stats.habitsByPriority.low / stats.totalHabits) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Most Consistent Habit */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Most Consistent</h3>
            <Award className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="w-10 h-10 text-purple-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">{stats.mostConsistentHabit}</h4>
            <p className="text-sm font-medium text-gray-700">Keep up the great work!</p>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Today's Summary</h3>
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}% <span className="text-base font-medium text-gray-600">of habits</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shadow-sm">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Total Habits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHabits} <span className="text-base font-medium text-gray-600">active</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
