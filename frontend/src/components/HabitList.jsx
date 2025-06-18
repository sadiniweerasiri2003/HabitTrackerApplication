import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Pencil,
  Trash2,
  CheckCircle,
  Circle,
  Plus,
  Calendar,
  ArrowRight,
  MoreVertical,
  AlertCircle,
  Info
} from 'lucide-react';
import { HabitDetails } from './HabitDetails';
import { habitIcons } from './NewHabitForm';
import { habitsApi } from '../services/api';
import { notificationService } from '../services/notificationService';

const DeleteConfirmDialog = ({ habit, onConfirm, onCancel }) => {
  const messages = [
    `🥺 Are you really giving up on "${habit.name}"? That's not the spirit!`,
    `😱 Wait! "${habit.name}" still believes in you! Are you sure?`,
    `🤔 Deleting "${habit.name}"? Your future self might not be happy about this...`,
    `😮 Hold up! Are you sure you want to drop "${habit.name}" like a hot potato?`,
    `🎭 "${habit.name}" is having an existential crisis right now. Still want to delete?`
  ];
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div 
        className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full transform transition-all duration-300 scale-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold text-gray-800 mb-4 leading-relaxed">
            {messages[Math.floor(Math.random() * messages.length)]}
          </div>
          <p className="text-gray-700 font-medium">This action cannot be undone!</p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 font-semibold text-lg transition-colors duration-200"
          >
            😌 Keep it
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold text-lg transition-colors duration-200 shadow-sm"
          >
            😢 Yes, delete it
          </button>
        </div>
      </div>
    </div>
  );
};

export function HabitList() {
  const navigate = useNavigate();  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    sortBy: 'newest'
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const data = await habitsApi.getAllHabits();
      setHabits(data);
      // Schedule notifications for all habits
      data.forEach(habit => {
        if (isHabitDueToday(habit)) {
          notificationService.scheduleHabitReminders(habit);
        }
      });
    } catch (error) {
      toast.error('Failed to load habits');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async (habit) => {
    setHabitToDelete(habit);
  };

  const confirmDelete = async () => {
    try {
      await habitsApi.deleteHabit(habitToDelete._id);
      setHabits(habits.filter(h => h._id !== habitToDelete._id));
      toast.success(
        <div className="flex flex-col gap-1">
          <span>😔 "{habitToDelete.name}" has been deleted.</span>
          <span className="text-sm">Don't worry, you can always start a new habit!</span>
        </div>
      );
      setHabitToDelete(null);
    } catch (error) {
      toast.error('Failed to delete habit');
      console.error('Error:', error);
    }
  };
  const isHabitDueToday = (habit) => {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

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

  const toggleHabitCompletion = async (habit) => {
    const today = new Date().toISOString().split('T')[0];
      if (!isHabitDueToday(habit)) {
      // Array of funny messages
      const funnyMessages = [
        "Hey! 🤨 No cheating! This habit's not for today!",
        "Whoa there! 😠 You can't just complete habits whenever you feel like it!",
        "Nice try! 😤 But this habit is taking a break today!",
        "Hold up! 😡 This isn't your habit's scheduled day!",
        "Nuh-uh! 🙅‍♂️ Your habit isn't ready for action today!"
      ];
      
      // Pick a random message
      const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      
      // Show the error message
      toast.error(
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span>{randomMessage}</span>
          </div>
          <div className="text-sm opacity-80">
            Scheduled for: {
              habit.frequency === 'weekdays' 
                ? 'Monday to Friday'
                : habit.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
            }
          </div>
        </div>,
        { duration: 3000 }
      );

      // Show the tip after a delay
      setTimeout(() => {
        toast(
          <div className="flex items-center gap-2">
            <span>💡 Psst! Want to change your habit days? Just click the edit button!</span>
          </div>,
          { 
            duration: 4000,
            style: {
              background: '#F0F9FF',
              color: '#0369A1',
              border: '1px solid #7DD3FC'
            }
          }
        );
      }, 1500);

      return;
    }

    const existingProgress = habit.progress?.find(
      p => p.date.split('T')[0] === today
    );
    const completed = !existingProgress?.completed;

    try {
      const updatedHabit = await habitsApi.updateProgress(habit._id, {
        date: today,
        completed,
        quantityDone: completed ? habit.quantity : 0
      });
      
      setHabits(habits.map(h => h._id === habit._id ? updatedHabit : h));
      toast.success(completed ? 'Marked as completed!' : 'Marked as incomplete');
    } catch (error) {
      toast.error('Failed to update progress');
      console.error('Error:', error);
    }
  };

  const getHabitIcon = (iconIndex) => {
    return habitIcons[iconIndex]?.icon || Circle;
  };

  const getFilteredAndSortedHabits = () => {
    let filteredHabits = [...habits];

    // Apply priority filter
    if (filters.priority !== 'all') {
      filteredHabits = filteredHabits.filter(habit => habit.priority === filters.priority);
    }

    // Apply sorting
    return filteredHabits.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.startDate) - new Date(a.startDate);
        case 'oldest':
          return new Date(a.startDate) - new Date(b.startDate);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'completion':
          const getCompletionRate = (habit) => {
            if (!habit.progress || habit.progress.length === 0) return 0;
            const completed = habit.progress.filter(p => p.completed).length;
            return (completed / habit.progress.length) * 100;
          };
          return getCompletionRate(b) - getCompletionRate(a);
        default:
          return 0;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="content-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }
  return (
    <>
      <div className="content-container">
        {/* Header Section with sticky behavior */}      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm py-4 z-10 -mx-6 px-6 mb-6">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Habits</h1>
            <p className="text-gray-700 mt-1">Track and manage your daily habits</p>
          </div>
          <button
            onClick={() => navigate('/new-habit')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow"
          >
            <Plus className="w-5 h-5" />
            New Habit
          </button>
        </div>        {/* Filter Section */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <select
              value={filters.priority}
              onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
              className="text-sm border-gray-300 rounded-lg py-1.5 pl-3 pr-8 bg-white font-medium focus:ring-2 focus:ring-blue-500 text-gray-800 shadow-sm"
              style={{
                borderColor: filters.priority === 'high' ? '#DC2626' :
                           filters.priority === 'medium' ? '#D97706' :
                           filters.priority === 'low' ? '#059669' :
                           '#D1D5DB',
                minWidth: '140px'
              }}
            >
              <option value="all" className="text-gray-800">All Priorities</option>
              <option value="high" className="text-red-700">High Priority</option>
              <option value="medium" className="text-yellow-700">Medium Priority</option>
              <option value="low" className="text-green-700">Low Priority</option>
            </select>
          </div>

          <div className="h-5 w-px bg-gray-300 mx-2"></div>

          <div className="flex items-center">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
              className="text-sm border-gray-300 rounded-lg py-1.5 pl-3 pr-8 bg-white font-medium focus:ring-2 focus:ring-blue-500 text-gray-800 shadow-sm"
              style={{ minWidth: '140px' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name</option>
              <option value="completion">Completion Rate</option>
            </select>
          </div>
        </div>
      </div>{/* Main Content */}
      <div className="grid-container cols-1">
        {habits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No habits yet</h3>
            <p className="text-gray-600 mb-4">Start creating habits to track your progress</p>
            <button
              onClick={() => navigate('/new-habit')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredAndSortedHabits().map(habit => {
            const HabitIcon = getHabitIcon(habit.selectedIcon);
            const todayProgress = habit.progress?.find(
              p => p.date.split('T')[0] === new Date().toISOString().split('T')[0]
            );
            const isCompleted = todayProgress?.completed;

            return (              <div
                key={habit._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
                style={{
                  '--habit-color': habit.color,
                  '--habit-color-10': `${habit.color}1A`,
                  '--habit-color-20': `${habit.color}33`,
                }}
                onClick={() => setSelectedHabit(habit)}
              >
                {/* Priority indicator */}
                <div 
                  className="absolute top-0 right-12 h-6 w-2 rounded-b-full"
                  style={{ 
                    backgroundColor: habit.priority === 'high' ? '#EF4444' 
                      : habit.priority === 'medium' ? '#F59E0B' 
                      : '#10B981'
                  }}
                />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transform transition-transform group-hover:scale-110 ${
                        isCompleted ? 'bg-opacity-90' : 'bg-opacity-80'
                      }`}
                      style={{ 
                        backgroundColor: habit.color,
                        boxShadow: `0 8px 20px ${habit.color}40`
                      }}
                    >
                      <HabitIcon
                        className="w-8 h-8"
                        style={{ color: 'white' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900 truncate">
                          {habit.name}
                        </h3>
                        {habit.reminderTime && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {new Date(habit.reminderTime).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{format(new Date(habit.startDate), 'MMM d, yyyy')}</span>
                        </div>
                        {habit.frequency !== 'daily' && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <ArrowRight className="w-4 h-4 flex-shrink-0" />
                            <span className="capitalize truncate">{habit.frequency}</span>
                          </div>
                        )}
                        {habit.isQuantityBased && (
                          <div className="text-sm font-semibold px-2 py-0.5 rounded-full" 
                            style={{ 
                              backgroundColor: `${habit.color}30`,
                              color: habit.color 
                            }}>
                            {habit.quantity} {habit.metric}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHabitCompletion(habit);
                      }}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        !isHabitDueToday(habit)
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : isCompleted 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {!isHabitDueToday(habit) ? (
                        <>
                          <Circle className="w-5 h-5" />
                          <span>Not Due Today</span>
                        </>
                      ) : isCompleted ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Done!</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-5 h-5" />
                          <span>Complete</span>
                        </>
                      )}
                    </button>
                    <div className="flex items-center border-l border-gray-200 ml-4 pl-4 space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-habit/${habit._id}`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(habit);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>              </div>
            );
            })}
          </div>
        )}        </div>
      </div>

      {/* Habit Details Modal */}
      {selectedHabit && (
        <HabitDetails 
          habit={selectedHabit} 
          onClose={() => setSelectedHabit(null)} 
        />
      )}

      {/* Delete Confirmation Dialog */}
      {habitToDelete && (
        <DeleteConfirmDialog
          habit={habitToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setHabitToDelete(null)}
        />
      )}
    </>
  );
}
