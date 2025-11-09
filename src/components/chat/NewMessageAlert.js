import React, { useEffect, useState } from 'react';
import { useMessageContext } from '../../contexts/MessageContext';

const NewContactNotification = ({ contact, onAccept, onClose }) => (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <div className="flex items-center space-x-4">
            {contact.avatar && (
                <img src={contact.avatar} alt="" className="w-12 h-12 rounded-full" />
            )}
            <div className="flex-1">
                <h3 className="font-semibold">{contact.name}</h3>
                <p className="text-sm text-gray-600">{contact.lastMessage}</p>
            </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
            <button
                onClick={onClose}
                className="px-3 py-1 text-gray-600 hover:text-gray-800"
            >
                Not Now
            </button>
            <button
                onClick={onAccept}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Start Chat
            </button>
        </div>
    </div>
);

const NewMessageAlert = () => {
    const { 
        newContacts, 
        hasOfflineMessages, 
        markContactViewed,
        getChatHistory
    } = useMessageContext();
    const [currentContact, setCurrentContact] = useState(null);

    useEffect(() => {
        // Show first new contact if available
        const firstNewContact = newContacts[0];
        if (firstNewContact && !currentContact) {
            setCurrentContact(firstNewContact);
        }
    }, [newContacts, currentContact]);

    const handleAcceptChat = () => {
        if (currentContact) {
            // Load chat history
            getChatHistory(currentContact.userId);
            // Mark contact as viewed
            markContactViewed(currentContact.userId);
            // Navigate to chat (implement your navigation logic here)
            // For example:
            // navigate(`/messages/${currentContact.userId}`);
            setCurrentContact(null);
        }
    };

    const handleClose = () => {
        if (currentContact) {
            markContactViewed(currentContact.userId);
            setCurrentContact(null);
        }
    };

    if (!currentContact && !hasOfflineMessages) {
        return null;
    }

    if (hasOfflineMessages) {
        return (
            <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg p-4 border border-blue-200">
                <p className="text-center text-blue-600">
                    You have unread messages. Open your messages to view them.
                </p>
            </div>
        );
    }

    return currentContact ? (
        <NewContactNotification
            contact={currentContact}
            onAccept={handleAcceptChat}
            onClose={handleClose}
        />
    ) : null;
};

export default NewMessageAlert;