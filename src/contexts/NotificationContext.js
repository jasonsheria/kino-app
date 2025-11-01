import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const { on, send } = useWebSocket();

  useEffect(() => {
    if (!user) return; // no user, no notifications
  // Subscribe to notifications
    const unsubscribe = on('notification', (message) => {
      try {
        // Only keep notifications in memory (no localStorage persistence)
        const myId = user?.id || user?._id;
        const msgUserId = message?.userId || message?.user || message?.userId;
        if (myId && String(msgUserId) === String(myId)) {
          const id = message.id || message._id || (message._id && message._id.toString && message._id.toString()) || Date.now();
          const n = { ...message, id, unread: true };
          setNotifications(prev => {
            // dedupe by id
            if (prev.some(p => String(p.id) === String(n.id))) return prev;
            return [n, ...prev];
          });
        }
      } catch (e) {
        console.warn('Notification handling error', e);
      }
    });

    // Subscribe to initial history of unread notifications sent by the server on connect
    const unsubscribeHistory = on('notificationHistory', (messages) => {
      try {
        if (!Array.isArray(messages)) return;
        const myId = user?.id || user?._id;
        // Normalize and filter only current user's notifications
        const normalized = messages.map(m => {
          const id = m.id || m._id || (m._id && m._id.toString && m._id.toString()) || Date.now();
          const userId = m.userId || m.user || (m.user && m.user._id) || null;
          return {
            id,
            unread: m.unread !== false,
            title: m.title || m.title,
            message: m.message || m.content || '',
            senderId: m.senderId || m.sender || null,
            userId: userId,
            timestamp: m.timestamp || m.createdAt || m.date || new Date(),
          };
        }).filter(n => myId && String(n.userId) === String(myId));

        // Replace the notification list for this user with the server-provided unread list
        // This avoids re-introducing deleted or out-of-scope notifications.
        setNotifications(() => normalized);
      } catch (e) {
        console.warn('Error processing notificationHistory', e);
      }
    });

    // Subscribe to server-side deletions so multiple tabs stay in sync
    const unsubscribeRemoved = on('notificationRemoved', ({ id }) => {
      try {
        if (!id) return;
        setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));
      } catch (e) {
        console.warn('Error handling notificationRemoved', e);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeHistory();
      unsubscribeRemoved();
    };
  }, [user, on]);

  const removeNotification = (notificationId) => {
    // Optimistic UI: remove immediately, attempt to delete on server. If server fails, restore.
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // Send socket event to let server remove the notification and broadcast the removal back to all sockets
    try {
      send({ type: 'markNotificationRead', id: notificationId });
    } catch (e) {
      console.warn('Failed to send markNotificationRead via websocket', e);
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    // Send socket event to let server mark all as read
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    // Send socket event to let server mark as red a remove it
    console.log('markRead called for', id);
    removeNotification(id);
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
