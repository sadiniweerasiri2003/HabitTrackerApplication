import React, { useState, useEffect } from 'react';
import { format, parseISO, isBefore, isAfter, subDays } from 'date-fns';
import { 
  Bell, 
  Clock, 
  AlertCircle, 
  Calendar,
  CheckCircle, 
  XCircle,
  Trash2
} from 'lucide-react';

export function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Load notifications from localStorage on mount
    const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    // Filter out notifications older than 3 days
    const recentNotifications = storedNotifications.filter(notification => 
      isAfter(parseISO(notification.timestamp), subDays(new Date(), 3))
    );
    setNotifications(recentNotifications);
  }, []);

  const clearNotification = (id) => {
    const updatedNotifications = notifications.filter(n => n.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('notifications', '[]');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reminder':
        return Clock;
      case 'daily-summary':
        return Calendar;
      case 'missed':
        return AlertCircle;
      case 'completed':
        return CheckCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'reminder':
        return 'bg-blue-500';
      case 'daily-summary':
        return 'bg-purple-500';
      case 'missed':
        return 'bg-red-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="content-container">
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm py-4 z-10 -mx-6 px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-700 mt-1">Stay on track with your habits</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        ) : (
          notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(notification => {
              const NotificationIcon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);

              return (
                <div
                  key={notification.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-start gap-4 group relative overflow-hidden"
                >
                  <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <NotificationIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      <time className="text-sm text-gray-500">
                        {format(parseISO(notification.timestamp), 'MMM d, h:mm a')}
                      </time>
                    </div>
                    <p className="text-gray-600">{notification.message}</p>
                  </div>
                  <button
                    onClick={() => clearNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
