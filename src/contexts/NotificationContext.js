import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const { on } = useWebSocket();

  useEffect(() => {
    if (!user) return;

    // Subscribe to notifications
    const unsubscribe = on('notification', (message) => {
      // If this notification is targeted to an owner (contains ownerId), store it in localStorage for owner pages
      try {
        if (message.ownerId) {
          const key = `owner_notifications_${message.ownerId}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          const n = { ...message, id: message.id || message._id || Date.now(), unread: true };
          const updated = [...existing, n];
          localStorage.setItem(key, JSON.stringify(updated));
          // notify owner pages
          try { window.dispatchEvent(new Event('owner_notifications_updated')); } catch(e){}
        }

        // If this notification is targeted to a normal user, keep it in NotificationContext
        if (message.userId === user.id || message.userId === user._id) {
          // normalize notification shape and mark as unread
          const n = { ...message, id: message.id || message._id || Date.now(), unread: true };
          setNotifications(prev => [...prev, n]);
        }
      } catch (e) {
        console.warn('Notification handling error', e);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, on]);

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const value = {
    notifications,
    removeNotification,
    markAllRead,
    markRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

const NotificationContext = React.createContext(null);

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
