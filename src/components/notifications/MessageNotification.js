import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessageContext } from '../../contexts/MessageContext';
import { useNotifications } from '../../contexts/NotificationContext';

const MessageNotification = ({ notification, onClose }) => {
    const navigate = useNavigate();
    const { markRead } = useNotifications();
    const { getChatHistory } = useMessageContext();

    const handleClick = () => {
        // Mark notification as read
        markRead(notification.id);

        // Load chat history
        if (notification.data?.senderId) {
            getChatHistory(notification.data.senderId);
        }

        // Navigate to chat with this user
        navigate(`/messages/${notification.data?.senderId}`);

        // Close notification if provided
        if (onClose) {
            onClose();
        }
    };

    return (
        <div 
            className="flex items-center p-4 bg-white border-l-4 border-blue-500 rounded shadow-md cursor-pointer hover:bg-gray-50"
            onClick={handleClick}
        >
            <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                <p className="text-gray-600 text-sm">{notification.message}</p>
                <span className="text-xs text-gray-400">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
            </div>
            {notification.unread && (
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
            )}
        </div>
    );
};

export default MessageNotification;