import { 
  format, 
  addDays, 
  parseISO, 
  isBefore, 
  isAfter, 
  subDays,
  addMinutes,
  isSameDay,
  setHours,
  setMinutes
} from 'date-fns';
// Generate a unique ID using timestamp and random number
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

class NotificationService {
  constructor() {
    // Only create one instance
    if (NotificationService.instance) {
      return NotificationService.instance;
    }
    NotificationService.instance = this;

    this.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    this.notificationSound = new Audio('/notification.mp3');
    this.sentNotifications = new Set(); // Track sent notifications
    this.scheduledTimers = new Map(); // Track scheduled notifications
    this.checkPermission();
    this.setupDailyCheck();
  }

  clearOldScheduledNotifications() {
    const now = new Date();
    this.scheduledTimers.forEach((timer, key) => {
      const [habitId, timestamp] = key.split('-');
      if (new Date(timestamp) < now) {
        clearTimeout(timer);
        this.scheduledTimers.delete(key);
      }
    });
  }

  async checkPermission() {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }

  setupDailyCheck() {
    // Clear any existing daily check
    if (this._dailyCheckTimer) {
      clearTimeout(this._dailyCheckTimer);
    }

    // Check for daily summary at 7 AM
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(7, 0, 0, 0);

    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilCheck = scheduledTime - now;
    this._dailyCheckTimer = setTimeout(() => {
      this.sendDailySummary();
      // Setup next day's check
      this.setupDailyCheck();
    }, timeUntilCheck);
  }

  saveNotification(notification) {
    // Generate a unique key for this notification
    const notificationKey = `${notification.type}-${notification.timestamp}`;
    
    // Check if we've already sent this notification
    if (this.sentNotifications.has(notificationKey)) {
      return;
    }

    // Add to sent notifications
    this.sentNotifications.add(notificationKey);

    // Clean up old sent notifications (keep last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.sentNotifications.forEach(key => {
      const timestamp = key.split('-')[1];
      if (new Date(timestamp) < yesterday) {
        this.sentNotifications.delete(key);
      }
    });

    this.notifications.push(notification);
    // Remove notifications older than 3 days
    this.notifications = this.notifications.filter(n => 
      isAfter(parseISO(n.timestamp), subDays(new Date(), 3))
    );
    localStorage.setItem('notifications', JSON.stringify(this.notifications));

    // Play sound (with debounce)
    if (!this._lastSoundPlay || Date.now() - this._lastSoundPlay > 1000) {
      this.notificationSound.play().catch(e => console.log('Error playing sound:', e));
      this._lastSoundPlay = Date.now();
    }

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notificationKey // Prevent duplicate browser notifications
      });
    }

    // Dispatch event for real-time UI updates
    window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
  }

  async sendDailySummary() {
    const habits = await this.getTodaysHabits();
    if (habits.length === 0) return;

    const notification = {
      id: generateId(),
      type: 'daily-summary',
      title: '🌅 Your Day Ahead',
      message: `You have ${habits.length} habits scheduled for today:\n${
        habits.map(h => `• ${h.name}${h.reminderTime ? ` at ${format(parseISO(h.reminderTime), 'h:mm a')}` : ''}`).join('\n')
      }`,
      timestamp: new Date().toISOString()
    };

    this.saveNotification(notification);
  }

  scheduleHabitReminders(habit) {
    if (!habit.reminderTime) return;

    // Clear any existing reminders for this habit
    this.clearExistingReminders(habit._id);

    const reminderTime = parseISO(habit.reminderTime);
    const now = new Date();

    // Schedule 30-minute reminder
    const thirtyMinBefore = addMinutes(reminderTime, -30);
    if (isAfter(thirtyMinBefore, now)) {
      this.scheduleNotification(
        thirtyMinBefore,
        {
          id: generateId(),
          type: 'reminder',
          habitId: habit._id,
          title: '⏰ Upcoming Habit',
          message: `"${habit.name}" is starting in 30 minutes!`,
          timestamp: thirtyMinBefore.toISOString()
        }
      );
    }

    // Schedule 5-minute reminder
    const fiveMinBefore = addMinutes(reminderTime, -5);
    if (isAfter(fiveMinBefore, now)) {
      this.scheduleNotification(
        fiveMinBefore,
        {
          id: generateId(),
          type: 'reminder',
          habitId: habit._id,
          title: '⚡ Almost Time!',
          message: `Get ready! "${habit.name}" starts in 5 minutes.`,
          timestamp: fiveMinBefore.toISOString()
        }
      );
    }

    // Schedule on-time reminder
    if (isAfter(reminderTime, now)) {
      this.scheduleNotification(
        reminderTime,
        {
          id: generateId(),
          type: 'reminder',
          habitId: habit._id,
          title: '🎯 Time to Start!',
          message: `It's time for "${habit.name}"! Let's do this!`,
          timestamp: reminderTime.toISOString()
        }
      );
    }

    // Schedule late reminder (15 minutes after)
    const lateReminder = addMinutes(reminderTime, 15);
    if (isAfter(lateReminder, now)) {
      this.scheduleNotification(
        lateReminder,
        {
          id: generateId(),
          type: 'missed',
          habitId: habit._id,
          title: '😅 Running Late?',
          message: this.getRandomLateMessage(habit.name),
          timestamp: lateReminder.toISOString()
        }
      );
    }
  }

  clearExistingReminders(habitId) {
    // Clear any existing scheduled notifications for this habit
    this.scheduledTimers.forEach((timer, key) => {
      if (key.startsWith(`${habitId}-`)) {
        clearTimeout(timer);
        this.scheduledTimers.delete(key);
      }
    });
  }

  scheduleNotification(time, notification) {
    const delay = time.getTime() - new Date().getTime();
    
    // Create a unique key for this scheduled notification
    const scheduledKey = `${notification.habitId}-${notification.timestamp}`;
    
    // Clear any existing timer for this specific notification
    if (this.scheduledTimers.has(scheduledKey)) {
      clearTimeout(this.scheduledTimers.get(scheduledKey));
    }

    // Schedule new notification
    const timer = setTimeout(() => {
      this.saveNotification(notification);
      this.scheduledTimers.delete(scheduledKey);
    }, delay);

    // Store the timer reference
    this.scheduledTimers.set(scheduledKey, timer);
  }

  getRandomLateMessage(habitName) {
    const messages = [
      `"${habitName}" is giving you the side-eye. Still planning to show up? 😏`,
      `Your habit "${habitName}" is wondering if you got lost in a YouTube rabbit hole... 🐰`,
      `Hey there! "${habitName}" sent a search party. Everything okay? 🔍`,
      `Plot twist: "${habitName}" misses you! Ready to make an appearance? 🌟`,
      `"${habitName}" is practicing patience... but it's not its strongest virtue! 😅`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  async getTodaysHabits() {
    try {
      const response = await fetch('http://localhost:5000/api/habits', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const habits = await response.json();
      return habits.filter(habit => this.isHabitDueToday(habit));
    } catch (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
  }

  isHabitDueToday(habit) {
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
  }
}

export const notificationService = new NotificationService();
