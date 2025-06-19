import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { handleSignOut } from '../utils/auth';
import {
  User,
  Settings,
  Mail,
  Lock,
  Calendar,
  Clock,
  ChevronRight,
  Edit2,
  LogOut,
  AlertCircle,
  CheckCircle,
  Circle,
  BarChart2,
  Plus,
  Volume2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { habitsApi, userApi } from '../services/api';

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [stats, setStats] = useState({
    totalHabits: 0,
    completedToday: 0,
    streakCount: 0,
    joinDate: new Date(),
  });

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, []);
  const fetchUserProfile = async () => {
    try {
      const userData = await userApi.getProfile();
      if (!userData) {
        throw new Error('No user data received');
      }
      
      setUser(userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Update local storage with new user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        ...userData,
      }));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load user profile');
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const fetchedHabits = await habitsApi.getAllHabits();
      setHabits(fetchedHabits);

      const today = new Date().toISOString().split('T')[0];
      
      // Count habits due today and completed today
      let completedToday = 0;
      let dueToday = 0;
      let maxStreak = 0;

      fetchedHabits.forEach(habit => {
        // Check if due today
        if (isHabitDueToday(habit)) {
          dueToday++;
          // Check if completed today
          const todayProgress = habit.progress?.find(p => 
            p.date.split('T')[0] === today
          );
          if (todayProgress?.completed) {
            completedToday++;
          }
        }

        // Calculate streak for each habit
        const habitStreak = calculateHabitStreak(habit);
        maxStreak = Math.max(maxStreak, habitStreak);
      });

      setStats({
        totalHabits: fetchedHabits.length,
        completedToday,
        dueToday,
        streakCount: maxStreak,
        joinDate: user.createdAt || new Date(),
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculateHabitStreak = (habit) => {
    if (!habit.progress || habit.progress.length === 0) return 0;

    const sortedProgress = [...habit.progress].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    let currentStreak = 0;
    let maxStreak = 0;
    let lastDate = null;

    for (const progress of sortedProgress) {
      const currentDate = new Date(progress.date);
      
      if (progress.completed) {
        if (!lastDate) {
          currentStreak = 1;
        } else {
          const dayDiff = Math.abs(Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24)));
          if (dayDiff === 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        }
        maxStreak = Math.max(maxStreak, currentStreak);
        lastDate = currentDate;
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  };

  const isHabitDueToday = (habit) => {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

    if (!habit.startDate || new Date(habit.startDate) > today) {
      return false;
    }

    switch (habit.frequency) {
      case 'daily':
        return true;
      case 'weekdays':
        return !['sat', 'sun'].includes(dayOfWeek);
      case 'weekly':
      case 'custom':
        return habit.days?.includes(dayOfWeek.slice(0, 3)) || false;
      default:
        return false;
    }
  };

  // Load user settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings
        }));
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  // Handle settings changes
  const handleSettingChange = (key, value) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: value
      };
      
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
        // Handle notifications if changed
      if (key === 'notifications' && value) {
        // Request notification permission if enabled
        if ('Notification' in window) {
          Notification.requestPermission();
        }
      }
      
      // Show success message
      toast.success(`${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} updated`);
      
      return newSettings;
    });
  };

  // Reset form data when entering edit mode
  const handleEditClick = () => {
    setFormData({
      username: user.username || '',
      email: user.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setEditMode(true);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleEditProfile = async (e) => {
    e.preventDefault();
      // Validate required fields
    if (!formData.username.trim() || !formData.email.trim()) {
      toast.error('Username and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password if being changed
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast.error('Current password is required to change password');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters long');
        return;
      }
    }

    try {      const updateData = {
        username: formData.username,
        email: formData.email,
        ...(formData.newPassword ? {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        } : {})
      };

      const updatedUser = await userApi.updateProfile(updateData);
      
      // Update local state and storage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };
  const onSignOut = () => {
    handleSignOut(navigate);
  };

  if (loading) {
    return (
      <div className="content-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="content-container">
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm py-4 z-10 -mx-6 px-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-700 mt-1">Manage your account and preferences</p>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {formData.username?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editMode ? formData.username : (user.username || 'User')}</h2>
                  <p className="text-gray-600">{editMode ? formData.email : (user.email || 'No email set')}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Joined {format(new Date(stats.joinDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <button
                onClick={editMode ? undefined : handleEditClick}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleEditProfile} className="space-y-4">
                <div>                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Total Habits</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalHabits}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Today's Progress</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.dueToday > 0 
                      ? `${Math.round((stats.completedToday / stats.dueToday) * 100)}%`
                      : '0%'
                    }
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {stats.completedToday} of {stats.dueToday} completed
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 mb-1">Longest Streak</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.streakCount} days</div>
                </div>
              </div>
            )}
          </div>          {/* Settings Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Settings</h2>
              <div className="text-sm text-gray-500">
                Changes are saved automatically
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/new-habit')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">Create New Habit</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              
              <button
                onClick={() => navigate('/statistics')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <BarChart2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">View Statistics</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/calendar')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">Open Calendar</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Security</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Password protected</span>
              </div>
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Email verified</span>
              </div>
              <button
                onClick={() => setEditMode(true)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
