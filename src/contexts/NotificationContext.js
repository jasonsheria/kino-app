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
      if (message.userId === user.id || message.userId === user._id) {
        setNotifications(prev => [...prev, message]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, on]);

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const value = {
    notifications,
    removeNotification
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
