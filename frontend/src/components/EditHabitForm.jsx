import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NewHabitForm } from './NewHabitForm';
import { toast } from 'react-hot-toast';
import { habitsApi } from '../services/api';

export function EditHabitForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHabit();
  }, [id]);
  const fetchHabit = async () => {
    try {
      const data = await habitsApi.getHabit(id);
      console.log('Fetched habit for editing:', data); // Debug log
      setHabit(data);
    } catch (error) {
      toast.error('Failed to load habit');
      console.error('Error:', error);
      navigate('/habits'); // Redirect back to habits list on error
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Habit not found</h2>
        <p className="text-gray-500 mb-4">The habit you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/habits')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Habits
        </button>
      </div>
    );
  }

  return <NewHabitForm initialData={habit} isEditing={true} />;
}
