import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import MessageNotification from './MessageNotification';

const MessageNotificationList = () => {
    const { getNotificationsByType, getUnreadCountByType } = useNotifications();
    
    // Get all message notifications
    const messageNotifications = getNotificationsByType('message');
    const unreadCount = getUnreadCountByType('message');

    if (messageNotifications.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {unreadCount > 0 && (
                <div className="flex justify-between items-center px-4 py-2 bg-gray-100 rounded">
                    <span className="text-sm font-medium text-gray-700">
                        Messages
                    </span>
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        {unreadCount}
                    </span>
                </div>
            )}
            
            {messageNotifications.map(notification => (
                <MessageNotification 
                    key={notification.id} 
                    notification={notification}
                />
            ))}
        </div>
    );
};

export default MessageNotificationList;