import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, 
  startOfWeek, endOfWeek, isToday, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { habitsApi } from '../services/api';
import { HabitDetails } from './HabitDetails';

export function HabitCalendar() {  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const data = await habitsApi.getAllHabits();
      setHabits(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const start = startOfWeek(startOfMonth(date));
    const end = endOfWeek(endOfMonth(date));
    return eachDayOfInterval({ start, end });
  };
  const getHabitsForDate = (date) => {
    const dayOfWeek = format(date, 'EEE').toLowerCase();
    const dateToCheck = new Date(date).setHours(0, 0, 0, 0);
    
    return habits.filter(habit => {
      // First check if the date is after or equal to habit's start date
      const habitStartDate = new Date(habit.startDate).setHours(0, 0, 0, 0);
      if (dateToCheck < habitStartDate) return false;

      // Then check frequency
      switch (habit.frequency) {
        case 'daily':
          return true;
        case 'weekdays':
          return !['sat', 'sun'].includes(dayOfWeek);
        case 'weekly':
        case 'custom':
          return habit.days.includes(dayOfWeek);
        default:
          return false;
      }
    });
  };
  const getCompletedHabits = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateToCheck = new Date(date).setHours(0, 0, 0, 0);
    
    return habits.filter(habit => {
      // Check if the date is after or equal to habit's start date
      const habitStartDate = new Date(habit.startDate).setHours(0, 0, 0, 0);
      if (dateToCheck < habitStartDate) return false;

      // Check completion status
      return habit.progress?.some(p => 
        p.date.split('T')[0] === dateStr && p.completed
      );
    }).length;
  };

  const toggleHabitCompletion = async (habit) => {
    const today = new Date().toISOString().split('T')[0];
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Only allow completing habits on the selected date if it's today or in the past
    if (selectedDateStr > today) {
      toast.error("Can't complete habits for future dates!");
      return;
    }

    const existingProgress = habit.progress?.find(
      p => p.date.split('T')[0] === selectedDateStr
    );
    const completed = !existingProgress?.completed;

    try {
      const updatedHabit = await habitsApi.updateProgress(habit._id, {
        date: selectedDateStr,
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

  const days = getDaysInMonth(currentDate);
  const selectedDayHabits = getHabitsForDate(selectedDate);

  return (    <div className="p-4 max-w-3xl mx-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Habit Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[7rem] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const totalHabits = getHabitsForDate(day).length;
            const completedHabits = getCompletedHabits(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  h-[70px] p-2 border-b border-r cursor-pointer relative
                  ${!isCurrentMonth && 'bg-gray-50'}
                  ${isSelected && 'bg-blue-50'}
                  ${isToday && 'ring-1 ring-blue-500 ring-inset'}
                  hover:bg-gray-50 transition-colors
                `}
              >
                <div className="flex justify-between items-start">
                  <span className={`
                    text-xs font-medium
                    ${!isCurrentMonth && 'text-gray-400'}
                    ${isToday ? 'text-blue-600' : 'text-gray-900'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {totalHabits > 0 && (
                    <div className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100">
                      {completedHabits}/{totalHabits}
                    </div>
                  )}
                </div>

                {/* Simple completion indicator */}
                {totalHabits > 0 && completedHabits > 0 && (
                  <div className="absolute bottom-1 right-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>      {/* Selected Day's Habits */}
      {selectedDayHabits.length > 0 && (
        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <div className="space-y-2">
            {selectedDayHabits.map(habit => {
              const isCompleted = habit.progress?.some(p => 
                isSameDay(new Date(p.date), selectedDate) && p.completed
              );

              return (
                <div
                  key={habit._id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg hover:bg-gray-50
                    transition-colors duration-200 cursor-pointer
                    ${isCompleted ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50'}
                  `}
                  onClick={() => setSelectedHabit(habit)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`font-medium ${isCompleted ? 'text-green-700' : 'text-gray-700'}`}>
                      {habit.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHabitCompletion(habit);
                      }}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm 
                        transition-colors duration-200
                        ${isCompleted 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Done!</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          <span className="font-medium">Complete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Habit Details Modal */}
      {selectedHabit && (
        <HabitDetails 
          habit={selectedHabit} 
          onClose={() => setSelectedHabit(null)} 
        />
      )}
    </div>
  );
}
