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
  AlertCircle
} from 'lucide-react';
import { habitIcons } from './NewHabitForm';
import { habitsApi } from '../services/api';

export function HabitList() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const data = await habitsApi.getAllHabits();
      setHabits(data);
    } catch (error) {
      toast.error('Failed to load habits');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (habitId) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;

    try {
      await habitsApi.deleteHabit(habitId);
      setHabits(habits.filter(habit => habit._id !== habitId));
      toast.success('Habit deleted successfully');
    } catch (error) {
      toast.error('Failed to delete habit');
      console.error('Error:', error);
    }
  };

  const toggleHabitCompletion = async (habit) => {
    const today = new Date().toISOString().split('T')[0];
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

  if (isLoading) {
    return (
      <div className="content-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="content-container">
      {/* Header Section with sticky behavior */}
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm py-4 z-10 -mx-6 px-6 mb-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Habits</h1>
            <p className="text-gray-600 mt-1">Track and manage your daily habits</p>
          </div>
          <button
            onClick={() => navigate('/new-habit')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow"
          >
            <Plus className="w-5 h-5" />
            New Habit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid-container cols-1">
        {habits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No habits yet</h3>
            <p className="text-gray-500 mb-4">Start creating habits to track your progress</p>
            <button
              onClick={() => navigate('/new-habit')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Habit
            </button>
          </div>
        ) : (
          habits.map(habit => {
            const HabitIcon = getHabitIcon(habit.selectedIcon);
            const todayProgress = habit.progress?.find(
              p => p.date.split('T')[0] === new Date().toISOString().split('T')[0]
            );
            const isCompleted = todayProgress?.completed;

            return (              <div
                key={habit._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200"
                style={{
                  '--habit-color': habit.color,
                  '--habit-color-10': `${habit.color}1A`,
                  '--habit-color-20': `${habit.color}33`,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-opacity-20' : 'bg-opacity-10'
                      }`}
                      style={{ 
                        backgroundColor: habit.color,
                        boxShadow: `0 4px 12px ${habit.color}33`
                      }}
                    >
                      <HabitIcon
                        className="w-7 h-7"
                        style={{ color: 'white' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{format(new Date(habit.startDate), 'MMM d, yyyy')}</span>
                        {habit.frequency !== 'daily' && (
                          <>
                            <ArrowRight className="w-4 h-4 flex-shrink-0" />
                            <span className="capitalize truncate">{habit.frequency}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleHabitCompletion(habit)}
                      className="w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-200"
                      style={{ 
                        borderColor: habit.color,
                        backgroundColor: isCompleted ? habit.color : 'transparent',
                        color: isCompleted ? 'white' : habit.color
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/edit-habit/${habit._id}`)}
                        className="p-2 rounded-lg transition-all duration-200 hover:bg-opacity-10"
                        style={{ 
                          color: habit.color,
                          backgroundColor: 'transparent',
                          '--hover-bg': habit.color
                        }}
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(habit._id)}
                        className="p-2 rounded-lg transition-all duration-200 hover:bg-opacity-10"
                        style={{ 
                          color: habit.color,
                          backgroundColor: 'transparent',
                          '--hover-bg': habit.color
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button 
                        className="p-2 rounded-lg transition-all duration-200 hover:bg-opacity-10"
                        style={{ 
                          color: habit.color,
                          backgroundColor: 'transparent',
                          '--hover-bg': habit.color
                        }}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
