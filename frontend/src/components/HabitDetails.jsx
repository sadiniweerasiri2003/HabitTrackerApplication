import React from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock, Flag, Target, Award, Bell } from 'lucide-react';
import { habitIcons } from './NewHabitForm';

export function HabitDetails({ habit, onClose }) {
  if (!habit) return null;

  const IconComponent = habitIcons[habit.selectedIcon]?.icon;
  // Calculate streak and completion rate
  const calculateStats = () => {
    if (!habit.progress || habit.progress.length === 0) {
      return { streak: 0, completionRate: 0 };
    }

    // Sort progress by date in descending order
    const sortedProgress = [...habit.progress].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let totalCompleted = 0;
    const today = new Date().setHours(0, 0, 0, 0);
    let lastDate = new Date(today);

    // Calculate streak
    for (const progress of sortedProgress) {
      const progressDate = new Date(progress.date).setHours(0, 0, 0, 0);
      const isCompleted = progress.completed || (habit.isQuantityBased && progress.quantityDone >= habit.quantity);
      
      // Break streak if a day was missed or not completed
      if (progressDate < today && 
          (Math.abs(lastDate - progressDate) > 86400000 || !isCompleted)) {
        break;
      }

      if (isCompleted) {
        currentStreak++;
        lastDate = new Date(progressDate);
      }
    }

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProgress = sortedProgress.filter(p => 
      new Date(p.date) >= thirtyDaysAgo
    );

    const completedDays = recentProgress.filter(p => 
      p.completed || (habit.isQuantityBased && p.quantityDone >= habit.quantity)
    ).length;

    const completionRate = recentProgress.length > 0 
      ? (completedDays / recentProgress.length) * 100 
      : 0;

    return { streak: currentStreak, completionRate };
  };

  const { streak, completionRate } = calculateStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header with Icon and Title */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${habit.color}30` }}
            >
              {IconComponent && (
                <IconComponent
                  className="w-8 h-8"
                  style={{ color: habit.color }}
                />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{habit.name}</h2>
              <p className="text-gray-600">{habit.description}</p>
            </div>
          </div>

          {/* Stats Grid */}          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Target className="w-5 h-5" style={{ color: habit.color }} />
                <span>Goal</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {habit.isQuantityBased
                  ? `${habit.quantity} ${habit.metric}`
                  : 'Complete Daily'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Award className="w-5 h-5" style={{ color: habit.color }} />
                <span>Current Streak</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{streak} days</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Flag className="w-5 h-5" style={{ color: habit.color }} />
                <span>Completion Rate</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {completionRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>Started on {format(new Date(habit.startDate), 'MMMM d, yyyy')}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>Frequency: {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</span>
            </div>

            {habit.reminderTime && (              <div className="flex items-center gap-3 text-gray-600">
                <Bell className="w-5 h-5" />
                <span>
                  {habit.reminderTime ? 
                    new Date(habit.reminderTime).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                    : 'No reminder set'}
                </span>
              </div>
            )}

            {habit.days && habit.days.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {habit.days.map((day, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{ backgroundColor: `${habit.color}30`, color: habit.color }}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Priority Badge */}
          <div className="mt-6 mb-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                habit.priority === 'high'
                  ? 'bg-red-100 text-red-800'
                  : habit.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {habit.priority.charAt(0).toUpperCase() + habit.priority.slice(1)} Priority
            </span>
          </div>

          {/* Recent Activities */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-3">
              {habit.progress && habit.progress
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 7)
                .map((progress, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          progress.completed || (habit.isQuantityBased && progress.quantityDone >= habit.quantity)
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span className="text-gray-900">{format(new Date(progress.date), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {habit.isQuantityBased ? (
                        <span className="text-gray-700">
                          {progress.quantityDone} / {habit.quantity} {habit.metric}
                        </span>
                      ) : (
                        <span className={`text-sm font-medium ${
                          progress.completed ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {progress.completed ? 'Completed' : 'Not Completed'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              {(!habit.progress || habit.progress.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  No activities recorded yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
