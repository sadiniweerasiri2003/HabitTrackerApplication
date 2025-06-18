import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-hot-toast';
import { habitsApi } from '../services/api';
import {
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  StarIcon,
  FlagIcon,
  Sparkles,
  Target,
  Rocket,
  Award,
  Crown,
  Medal,
  ThumbsUp,
  HeartPulse,
  Zap,
  Smile,
  Heart,
  Brain,
  Dumbbell,
  BookOpen,
  Coffee,
  Bike,
  Flame,
  Moon,
  Music,
  Palette,
  Pencil,
  Phone,
  Leaf,
  ScrollText,
  ShoppingBag,
  Laptop,
  Gamepad2,
  Utensils,
  DollarSign,
  Sun
} from 'lucide-react';

export const habitIcons = [
  { icon: HeartPulse, label: 'Health', category: 'Wellness' },
  { icon: Brain, label: 'Focus', category: 'Wellness' },
  { icon: Dumbbell, label: 'Exercise', category: 'Fitness' },
  { icon: BookOpen, label: 'Read', category: 'Education' },
  { icon: Coffee, label: 'Coffee', category: 'Lifestyle' },
  { icon: Bike, label: 'Cycling', category: 'Fitness' },
  { icon: Flame, label: 'Fitness', category: 'Health' },
  { icon: Moon, label: 'Sleep', category: 'Wellness' },
  { icon: Music, label: 'Music', category: 'Hobby' },
  { icon: Palette, label: 'Art', category: 'Hobby' },
  { icon: Pencil, label: 'Write', category: 'Education' },
  { icon: Leaf, label: 'Nature', category: 'Wellness' },
  { icon: ScrollText, label: 'Journal', category: 'Wellness' },
  { icon: ShoppingBag, label: 'Shopping', category: 'Lifestyle' },
  { icon: Laptop, label: 'Digital', category: 'Technology' },
  { icon: Heart, label: 'Self-Care', category: 'Wellness' },
  { icon: Utensils, label: 'Cooking', category: 'Lifestyle' },
  { icon: Gamepad2, label: 'Gaming', category: 'Hobby' },
  { icon: DollarSign, label: 'Finance', category: 'Lifestyle' },
  { icon: Sun, label: 'Meditation', category: 'Wellness' },
  { icon: Target, label: 'Goals', category: 'Productivity' },
  { icon: Zap, label: 'Energy', category: 'Wellness' }
];

const daysOfWeek = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

const colors = [
  '#FF5757',
  '#FFB347',
  '#FFDE59',
  '#70FF57',
  '#5CE1E6',
  '#C957FF',
  '#FF57B9',
];

export function NewHabitForm({ initialData, isEditing = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date(),
    frequency: 'daily',
    days: [],
    reminderTime: null,
    isQuantityBased: false,
    quantity: 1,
    color: '#5CE1E6',
    priority: 'medium',
    selectedIcon: 0,
    ...initialData
  });
  
  const [iconFilter, setIconFilter] = useState('');

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Habit name is required';
    }
    if (formData.isQuantityBased && formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if ((formData.frequency === 'weekly' || formData.frequency === 'custom') && formData.days.length === 0) {
      newErrors.days = 'Please select at least one day';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        console.log('Submitting habit data:', { isEditing, formData }); // Debug log
        
        if (isEditing) {
          console.log('Updating habit:', initialData._id); // Debug log
          await habitsApi.updateHabit(initialData._id, formData);
        } else {
          console.log('Creating new habit'); // Debug log
          await habitsApi.createHabit(formData);
        }

        toast.success(
          isEditing 
            ? 'Habit updated successfully!' 
            : 'New habit created successfully!'
        );
        navigate('/habits');
      } catch (error) {
        toast.error(
          isEditing 
            ? 'Failed to update habit' 
            : 'Failed to create habit'
        );
        console.error('Error:', error);
      }
    }
  };

  return (    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-50 -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-50 rounded-tr-full opacity-50 -ml-16 -mb-16"></div>
      
      {/* Header section with icon */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
        <div className="bg-white px-4 relative">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-500" />
            <h2 className="text-3xl font-bold text-gray-900">Create New Habit</h2>
            <Sparkles className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>
      
      {/* Motivational message */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Rocket className="w-5 h-5 text-blue-500" />
          <p className="text-lg text-gray-600 font-medium">Start your journey to greatness!</p>
        </div>
        <p className="text-sm text-gray-500">Small steps, big changes. Let's make it happen together.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Habit Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border text-gray-900 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white`}
            placeholder="What habit do you want to build?"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 font-medium">{errors.name}</p>
          )}
        </div>        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="Why do you want to build this habit?"
          />
        </div>

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Choose an Icon for Your Habit
            </span>
          </label>
          
          {/* Search and Category Filter */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search icons..."
              value={iconFilter}
              onChange={(e) => setIconFilter(e.target.value.toLowerCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
          </div>

          {/* Icons Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[280px] overflow-y-auto p-2 rounded-lg border border-gray-100">
            {habitIcons
              .filter(icon => 
                icon.label.toLowerCase().includes(iconFilter) ||
                icon.category.toLowerCase().includes(iconFilter)
              )
              .map((icon, index) => {
                const IconComponent = icon.icon;
                return (                  <button
                    key={icon.label}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, selectedIcon: index }))}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                      formData.selectedIcon === index
                        ? 'shadow-md scale-105'
                        : 'border-2 border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                    style={formData.selectedIcon === index ? {
                      backgroundColor: `${formData.color}15`,
                      borderColor: formData.color,
                      borderWidth: '2px'
                    } : {}}
                  >
                    <IconComponent 
                      className="w-8 h-8 mb-1"
                      style={{ color: formData.selectedIcon === index ? formData.color : '#4B5563' }}
                    />
                    <span className="text-xs font-medium text-center text-gray-600">
                      {icon.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {icon.category}
                    </span>
                  </button>
                );
              })}
          </div>
            {/* Selected Icon Preview */}
          {habitIcons[formData.selectedIcon] && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <div style={{ 
                padding: '0.5rem',
                borderRadius: '0.5rem',
                backgroundColor: `${formData.color}15`
              }}>
                {React.createElement(habitIcons[formData.selectedIcon].icon, {
                  className: "w-6 h-6",
                  style: { color: formData.color }
                })}
              </div>
              <span>Selected: <span className="font-medium">{habitIcons[formData.selectedIcon].label}</span></span>
            </div>
          )}
        </div>

        {/* Start Date & Reminder Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              <span className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Start Date
              </span>
            </label>
            <DatePicker
              selected={formData.startDate}
              onChange={date => setFormData(prev => ({ ...prev, startDate: date }))}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              dateFormat="MMMM d, yyyy"
              minDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              <span className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Reminder Time
              </span>
            </label>
            <DatePicker
              selected={formData.reminderTime}
              onChange={time => setFormData(prev => ({ ...prev, reminderTime: time }))}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="h:mm aa"
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholderText="Select reminder time"
            />
          </div>
        </div>        {/* Frequency */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              How often do you want to do this?
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'daily', label: 'Every Day', icon: Crown, description: 'Build a strong routine' },
              { value: 'weekly', label: 'Weekly', icon: Award, description: 'Flexible schedule' },
              { value: 'weekdays', label: 'Weekdays', icon: Medal, description: 'Work days only' },
              { value: 'custom', label: 'Custom', icon: ThumbsUp, description: 'You choose the days' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange({ target: { name: 'frequency', value: option.value } })}                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.frequency === option.value
                    ? 'shadow-md scale-105'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                }`}
                style={formData.frequency === option.value ? {
                  backgroundColor: `${formData.color}15`,
                  borderColor: formData.color
                } : {}}
              >
                <option.icon                className="w-6 h-6 mb-2"
                style={{ color: formData.frequency === option.value ? formData.color : '#9CA3AF' }}/>
                <span className="font-medium text-gray-900">{option.label}</span>
                <span className="text-xs text-gray-500 text-center mt-1">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Days of Week */}
        {(formData.frequency === 'weekly' || formData.frequency === 'custom') && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Days
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => handleDayToggle(day.id)}                  className={`min-w-[4rem] px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    !formData.days.includes(day.id)
                      ? 'border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      : 'border-2 text-white shadow-sm transform hover:scale-105'
                  }`}
                  style={formData.days.includes(day.id) ? {
                    backgroundColor: formData.color,
                    borderColor: formData.color,
                    boxShadow: `0 2px 4px ${formData.color}40`
                  } : {}}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {errors.days && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.days}</p>
            )}
          </div>
        )}

        {/* Goal Type & Quantity */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isQuantityBased"
                checked={formData.isQuantityBased}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">
                This is a quantity-based habit
              </span>
            </label>
          </div>

          {formData.isQuantityBased && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Daily Target
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                className="w-32 px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.quantity}</p>
              )}
            </div>
          )}
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Pick a Color
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color }))}              className={`w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  formData.color === color ? 'ring-2 ring-offset-2' : ''
                }`}
              style={{ 
                backgroundColor: color,
                '--tw-ring-color': formData.color === color ? color : undefined
              }}
                style={{ backgroundColor: color }}
              >
                {formData.color === color && (
                  <CheckIcon className="w-4 h-4 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              How important is this habit to you?
            </span>
          </label>          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { 
                value: 'low', 
                label: 'Nice to Have', 
                icon: Smile,
                description: 'Good to achieve, but flexible',
                gradient: 'from-emerald-500 to-teal-500'
              },
              { 
                value: 'medium', 
                label: 'Important', 
                icon: ThumbsUp,
                description: 'Meaningful goal to pursue',
                gradient: 'from-blue-500 to-indigo-500'
              },
              { 
                value: 'high', 
                label: 'Must Do', 
                icon: StarIcon,
                description: 'Essential for your growth',
                gradient: 'from-purple-500 to-pink-500'
              }
            ].map(priority => (
              <button
                key={priority.value}
                type="button"
                onClick={() => handleInputChange({ target: { name: 'priority', value: priority.value } })}
                className={`group relative overflow-hidden p-6 rounded-xl transition-all duration-300 ${
                  formData.priority === priority.value
                    ? 'shadow-lg scale-105'
                    : 'hover:shadow-md hover:scale-[1.02]'
                }`}
                style={{
                  backgroundColor: formData.priority === priority.value 
                    ? `${formData.color}10`
                    : '#ffffff',
                  border: formData.priority === priority.value 
                    ? `2px solid ${formData.color}`
                    : '2px solid #e5e7eb'
                }}
              >
                {/* Background decorative elements */}
                <div 
                  className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${priority.gradient}`}
                ></div>
                
                {/* Icon with dynamic background */}
                <div 
                  className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center relative"
                  style={{
                    backgroundColor: formData.priority === priority.value 
                      ? `${formData.color}15`
                      : '#f3f4f6'
                  }}
                >
                  <priority.icon 
                    className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300"
                    style={{ 
                      color: formData.priority === priority.value 
                        ? formData.color 
                        : '#9CA3AF'
                    }}
                  />
                </div>

                {/* Text content */}
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900 text-lg">
                    {priority.label}
                  </div>
                  <div className="text-sm text-gray-500">
                    {priority.description}
                  </div>
                </div>

                {/* Selected indicator */}
                {formData.priority === priority.value && (
                  <div 
                    className="absolute top-3 right-3 w-2 h-2 rounded-full"
                    style={{ backgroundColor: formData.color }}
                  ></div>
                )}
              </button>
            ))}
          </div>
        </div>        {/* Submit Button */}
        <div className="pt-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur"></div>
            <button
              type="submit"
              className="relative w-full flex justify-center items-center px-6 py-4 text-white font-bold text-lg rounded-lg shadow-lg hover:scale-[1.02] transform transition-all duration-200"
              style={{ backgroundColor: formData.color }}
            >
              <div className="absolute inset-0 bg-white opacity-20 rounded-lg"></div>
              <div className="flex items-center gap-2">
                <StarIcon className="w-6 h-6" />
                <span>Start Your New Habit Journey</span>
                <Rocket className="w-6 h-6" />
              </div>
            </button>
          </div>
          <p className="text-center mt-4 text-sm text-gray-500">
            <Sparkles className="inline-block w-4 h-4 mr-1" />
            You're one click away from building a better you!
          </p>
        </div>
      </form>
    </div>
  );
}
