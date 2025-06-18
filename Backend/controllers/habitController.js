const Habit = require('../models/Habit');
const asyncHandler = require('express-async-handler');

// @desc    Create new habit
// @route   POST /api/habits
// @access  Private
const createHabit = asyncHandler(async (req, res) => {
  console.log('\n=== CREATE HABIT REQUEST ===');
  console.log('Raw request body:', req.body);
  
  const habitData = {
    ...req.body,
    user: req.user._id
  };
  
  console.log('\n=== PROCESSED HABIT DATA ===');
  console.log('Data to be saved:', {
    name: habitData.name,
    isQuantityBased: habitData.isQuantityBased,
    quantity: habitData.quantity,
    metric: habitData.metric,
    user: habitData.user
  });
  
  // Ensure metric is set when habit is quantity-based
  if (habitData.isQuantityBased && !habitData.metric) {
    habitData.metric = 'times';
    console.log('Setting default metric to "times"');
  }

  const habit = await Habit.create(habitData);
  
  console.log('\n=== SAVED HABIT DATA ===');
  console.log('Database record:', {
    id: habit._id,
    name: habit.name,
    isQuantityBased: habit.isQuantityBased,
    quantity: habit.quantity,
    metric: habit.metric,
    createdAt: habit.createdAt
  });
  console.log('================================\n');
  
  res.status(201).json(habit);
});

// @desc    Get all habits for a user
// @route   GET /api/habits
// @access  Private
const getHabits = asyncHandler(async (req, res) => {
  const habits = await Habit.find({ user: req.user._id })
    .sort({ createdAt: -1 });
  res.json(habits);
});

// @desc    Get single habit
// @route   GET /api/habits/:id
// @access  Private
const getHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!habit) {
    res.status(404);
    throw new Error('Habit not found');
  }

  res.json(habit);
});

// @desc    Update habit
// @route   PUT /api/habits/:id
// @access  Private
const updateHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!habit) {
    res.status(404);
    throw new Error('Habit not found');
  }

  res.json(habit);
});

// @desc    Delete habit
// @route   DELETE /api/habits/:id
// @access  Private
const deleteHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!habit) {
    res.status(404);
    throw new Error('Habit not found');
  }

  res.json({ message: 'Habit deleted successfully' });
});

// @desc    Update habit progress
// @route   POST /api/habits/:id/progress
// @access  Private
const updateProgress = asyncHandler(async (req, res) => {
  const { date, completed, quantityDone } = req.body;

  const habit = await Habit.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!habit) {
    res.status(404);
    throw new Error('Habit not found');
  }

  // Find if progress for this date already exists
  const progressIndex = habit.progress.findIndex(
    p => p.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
  );

  if (progressIndex > -1) {
    // Update existing progress
    habit.progress[progressIndex] = { date, completed, quantityDone };
  } else {
    // Add new progress
    habit.progress.push({ date, completed, quantityDone });
  }

  await habit.save();
  res.json(habit);
});

// @desc    Get habit statistics
// @route   GET /api/habits/stats
// @access  Private
const getHabitStats = asyncHandler(async (req, res) => {
  // Get total active habits
  const totalHabits = await Habit.countDocuments({ user: req.user._id });

  // Get completion stats for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const habits = await Habit.find({ user: req.user._id });
  
  let totalChecks = 0;
  let completedChecks = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Calculate completion rate and streaks
  habits.forEach(habit => {
    const recentProgress = habit.progress
      .filter(p => p.date >= sevenDaysAgo)
      .sort((a, b) => b.date - a.date);

    totalChecks += recentProgress.length;
    completedChecks += recentProgress.filter(p => p.completed).length;

    // Calculate streaks
    const allProgress = habit.progress.sort((a, b) => b.date - a.date);
    
    for (let i = 0; i < allProgress.length; i++) {
      if (allProgress[i].completed) {
        tempStreak++;
        if (i === 0) currentStreak = Math.max(currentStreak, tempStreak);
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        if (i === 0) currentStreak = Math.max(currentStreak, tempStreak);
        tempStreak = 0;
      }
    }
  });

  const completionRate = totalChecks > 0 
    ? Math.round((completedChecks / totalChecks) * 100) 
    : 0;

  // Get week-over-week change
  const previousWeekStart = new Date(sevenDaysAgo);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  
  const previousStats = await Habit.aggregate([
    {
      $match: {
        user: req.user._id,
        'progress.date': { $gte: previousWeekStart, $lt: sevenDaysAgo }
      }
    },
    {
      $unwind: '$progress'
    },
    {
      $match: {
        'progress.date': { $gte: previousWeekStart, $lt: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalChecks: { $sum: 1 },
        completedChecks: {
          $sum: { $cond: [{ $eq: ['$progress.completed', true] }, 1, 0] }
        }
      }
    }
  ]);

  const previousCompletionRate = previousStats.length > 0 && previousStats[0].totalChecks > 0
    ? Math.round((previousStats[0].completedChecks / previousStats[0].totalChecks) * 100)
    : 0;

  const weekOverWeekChange = completionRate - previousCompletionRate;

  // Count achievements (completion milestones)
  const achievements = Math.floor(completedChecks / 10); // One achievement per 10 completed habits

  res.json({
    activeHabits: totalHabits,
    completionRate,
    weekOverWeekChange,
    currentStreak,
    bestStreak,
    achievements,
    newAchievements: achievements > 0 ? Math.min(achievements, 2) : 0 // Show up to 2 new achievements
  });
});

module.exports = {
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  deleteHabit,
  updateProgress,
  getHabitStats
};
