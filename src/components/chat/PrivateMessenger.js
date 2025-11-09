import React, { useState, useRef, useEffect } from 'react';
import { useMessageContext } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';

const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageStatus = ({ status }) => {
    switch (status) {
        case 'pending':
            return <span className="text-gray-400">●</span>;
        case 'sent':
            return <span className="text-blue-400">✓</span>;
        case 'error':
            return <span className="text-red-500">!</span>;
        default:
            return null;
    }
};

const PrivateMessenger = ({ recipientId, className = '' }) => {
    const { user } = useAuth();
    const { 
        messages, 
        sendMessage, 
        markAsRead, 
        getChatHistory,
        deleteMessage,
        sendTypingIndicator,
        isUserTyping,
        resetUnreadCount
    } = useMessageContext();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Filter messages for this conversation
    const conversationMessages = messages.filter(
        msg => (msg.senderId === recipientId && msg.recipientId === user.id) ||
               (msg.senderId === user.id && msg.recipientId === recipientId)
    );

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversationMessages]);

    // Load chat history when component mounts
    useEffect(() => {
        if (recipientId && user) {
            getChatHistory(recipientId);
        }
    }, [recipientId, user]);

    // Mark received messages as read
    useEffect(() => {
        conversationMessages.forEach(msg => {
            if (msg.recipientId === user.id && !msg.isRead) {
                markAsRead(msg.id);
            }
        });
    }, [conversationMessages]);

    // Handle typing indicator
    const handleTyping = (e) => {
        setInput(e.target.value);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Send typing indicator
        sendTypingIndicator(recipientId);
        
        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        sendMessage(recipientId, input.trim());
        setInput('');
        
        // Clear typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.map((message, index) => (
                    <div
                        key={message.id || message.tempId}
                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] p-3 rounded-lg group relative ${
                                message.senderId === user.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-900'
                            }`}
                        >
                            {/* Delete button - only show for sender's messages */}
                            {message.senderId === user.id && (
                                <button
                                    onClick={() => deleteMessage(message.id)}
                                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 text-xs"
                                    title="Delete message"
                                >
                                    ✕
                                </button>
                            )}
                            
                            <p className="break-word">{message.content}</p>
                            <div className="flex items-center justify-end space-x-1 mt-1 text-xs">
                                <span className={message.senderId === user.id ? 'text-blue-100' : 'text-gray-500'}>
                                    {formatTime(message.createdAt)}
                                </span>
                                {message.senderId === user.id && (
                                    <MessageStatus status={message.status} />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Typing indicator */}
                {isUserTyping(recipientId) && (
                    <div className="flex items-center space-x-2 text-gray-500">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm">typing...</span>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="border-t p-4">
                <div className="flex space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PrivateMessenger;