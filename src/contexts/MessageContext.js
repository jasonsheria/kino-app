// src/contexts/MessageContext.js
import React, { createContext, useContext, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const MessageContext = createContext(undefined);

export const useMessageContext = () => {
    const context = useContext(MessageContext);
    if (context === undefined) {
        throw new Error('useMessageContext must be used within a MessageProvider');
    }
    return context;
};

// Composant Provider
export const MessageProvider = ({ children }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [notification, setNotification] = useState([]); // État pour les notifications    
    // Charger les suggestions du serveur si userId connu
    React.useEffect(() => {
        if (!user || !user._id) return;
        fetch(`${process.env.REACT_APP_BACKEND_APP_URL}/api/suggest?userId=${user._id}`)
            .then(res => res.json())
            .then(data => {
                if (data.suggestions && Array.isArray(data.suggestions)) {
                    const initialMessages = data.suggestions.map(s => ({
                        id: s._id,
                        sender: (s.firstName ? s.firstName : "") + (s.lastName ? (" " + s.lastName) : ""),
                        email: s.email,
                        subject: s.service,
                        body: s.message,
                        date: s.createdAt || s.date || new Date().toISOString(),
                        isRead: false // ou s.isRead si dispo
                    }));
                    setMessages(initialMessages);
                }
            })
            .catch(err => { console.error("Erreur lors du chargement des suggestions:", err); });
    }, [user]);
    // Simuler le chargement initial des messages (inchangé)
    useState(() => {
        setTimeout(() => {
            const initialMessages = [
                // ... (vos données initialMessages) ...
                // { id: '1', sender: '', email: '', subject: '', body: '...', date: '0000-00-00T00:00:00Z', isRead: false },
            ];
            const activities = [
                { id: 1, name: 'Nouvel article publié', description: 'Utilisateur A', date: '2024-10-18T14:00:00Z', details: 'Titre: "Mon premier post"', isRead: false },
                { id: 2, name: 'Commentaire sur un article', description: 'Utilisateur B', date: '2024-10-18T14:00:00Z', details: 'Article: "React vs Vue"', isRead: false },
                { id: 3, name: 'Nouvel abonné', description: 'Utilisateur C', date: '2024-10-18T14:00:00Z', details: 'Email: descriptionc@example.com', isRead: false },
                { id: 4, name: 'Mise à jour du profil', description: 'Utilisateur A', date: '2024-10-18T14:00:00Z', details: 'Nom mis à jour', isRead: false },
                { id: 5, name: 'Article supprimé', user: 'Utilisateur D', date: '2024-10-18T14:00:00Z', details: 'Titre: "Ancien brouillon"', isRead: false },
            ];
            setNotification(activities);
            setMessages(initialMessages);
        }, 500);
    }, []);
    // --- Fonctions pour suggestions (utilisent les routes backend /suggest) ---
    const markSuggestionAsRead = async (suggestionId) => {
        await axios.post(`${process.env.REACT_APP_BACKEND_APP_URL}/api/suggest/mark-as-read/${suggestionId}`);
        setMessages(prevMessages => prevMessages.map(msg =>
            (msg.id === suggestionId || msg._id === suggestionId) ? { ...msg, isRead: true } : msg
        ));
    };

    const markSuggestionAsUnread = async (suggestionId) => {
        await axios.post(`${process.env.REACT_APP_BACKEND_APP_URL}/api/suggest/mark-as-unread/${suggestionId}`);
        setMessages(prevMessages => prevMessages.map(msg =>
            (msg.id === suggestionId || msg._id === suggestionId) ? { ...msg, isRead: false } : msg
        ));
    };

    const deleteSuggestion = async (suggestionId) => {
        await axios.delete(`${process.env.REACT_APP_BACKEND_APP_URL}/api/suggest/${suggestionId}`);
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== suggestionId && msg._id !== suggestionId));
    };

    const replyToSuggestion = async (suggestionId, replyBody) => {
        await axios.post(`${process.env.REACT_APP_BACKEND_APP_URL}/api/suggest/reply/${suggestionId}`, { reply: replyBody });
    };
        // --- Calculer la liste des messages non lus (le TABLEAU) ---
        // Ce useMemo retournera le TABLEAU des messages non lus
        const unreadMessagesList = useMemo(() => {
            return (messages.filter(msg => !msg.isRead)).slice(0, 4); // Retourne bien le TABLEAU
        }, [messages]); // Recalculé seulement quand 'messages' change
        const unreadNotificationList = useMemo(() => {
            return (notification.filter(n => !n.isRead)).slice(0, 4); // Retourne bien le TABLEAU
        }, [notification]); // Recalculé seulement quand 'notification' change
        // --- Compteur de notifications non lues ---
        // Ce useMemo retournera le nombre de notifications non lues            
        const UnreadNotificationsCount = useMemo(() => {
            return notification.filter(n => !n.isRead).length;
        }, [notification]);

        const unreadCount = useMemo(() => {
            return messages.filter(msg => !msg.isRead).length;
        }, [messages]);

        // --- Fonctions pour modifier les messages (simulent appels asynchrones) ---

        const addMessage = async (newMessage) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    const messageWithId = { ...newMessage, id: `msg${messages.length + 1}`, date: new Date().toISOString(), isRead: false }; // Simuler ID et date
                    setMessages(prevMessages => [messageWithId, ...prevMessages]);
                    resolve(messageWithId); // Résoudre la promesse
                }, 500); // Délai simulé
            });
        };

        const markAsRead = async (messageId) => {
            await axios.patch(`${process.env.REACT_APP_BACKEND_APP_URL}/messages/${messageId}/read`);
            setMessages(prevMessages => prevMessages.map(msg =>
                (msg.id === messageId || msg._id === messageId) ? { ...msg, isRead: true } : msg
            ));
        };

        const markAsUnread = async (messageId) => {
            await axios.patch(`${process.env.REACT_APP_BACKEND_APP_URL}/messages/${messageId}/unread`);
            setMessages(prevMessages => prevMessages.map(msg =>
                (msg.id === messageId || msg._id === messageId) ? { ...msg, isRead: false } : msg
            ));
        };

        const deleteMessage = async (messageId) => {
            await axios.delete(`${process.env.REACT_APP_BACKEND_APP_URL}/messages/${messageId}`);
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId && msg._id !== messageId));
        };

        const sendReply = async (messageId, replyBody) => {
            await axios.post(`${process.env.REACT_APP_BACKEND_APP_URL}/messages/${messageId}/reply`, { reply: replyBody });
        };
        const addNotification = (notification) => {
            setNotification((prevNotifications) => [...prevNotifications, notification]);
        };
        const removeNotification = (notificationId) => {
            setNotification((prevNotifications) => prevNotifications.filter(n => n.id !== notificationId));
        };
        const clearNotifications = () => {
            setNotification([]);
        };
        const getNotifications = () => {
            return notification;
        };
        const getUnreadNotificationsCount = () => {
            return notification.filter(n => !n.isRead).length;
        };
        const markNotificationAsRead = (notificationId) => {
            setNotification((prevNotifications) =>
                prevNotifications.map((n) =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            );

        };
        const markNotificationAsUnread = (notificationId) => {
            setNotification((prevNotifications) =>
                prevNotifications.map((n) =>
                    n.id === notificationId ? { ...n, isRead: false } : n
                )
            );
        };
        const markAllNotificationsAsRead = () => {
            setNotification((prevNotifications) =>
                prevNotifications.map((n) => ({ ...n, isRead: true }))
            );
        };
        const markAllNotificationsAsUnread = () => {
            setNotification((prevNotifications) =>
                prevNotifications.map((n) => ({ ...n, isRead: false }))
            );
        };
        const getNotificationById = (notificationId) => {
            return notification.find((n) => n.id === notificationId);
        };
        const getNotificationBySender = (sender) => {
            return notification.filter((n) => n.sender === sender);
        };
        const getNotificationByDate = (date) => {
            return notification.filter((n) => new Date(n.date).toDateString() === new Date(date).toDateString());
        };

        const getNotificationByIsRead = (isRead) => {
            return notification.filter((n) => n.isRead === isRead);
        };

        const contextValue = useMemo(() => ({
            messages,
            unreadCount,
            unreadMessagesList,
            addMessage,
            markAsRead,
            markAsUnread,
            deleteMessage,
            notification,
            addNotification,
            removeNotification,
            clearNotifications,
            getNotifications,
            unreadNotificationList,
            UnreadNotificationsCount,
            markNotificationAsRead,
            markNotificationAsUnread,
            markAllNotificationsAsRead,
            markAllNotificationsAsUnread,
            getNotificationById,
            getNotificationBySender,
            getNotificationByDate,
            getNotificationByIsRead,
            sendReply,
            // Fonctions pour suggestions :
            markSuggestionAsRead,
            markSuggestionAsUnread,
            deleteSuggestion,
            replyToSuggestion,
        }), [messages, unreadCount, unreadMessagesList, notification]);
        // --- État et fonctions pour les notifications ---




        return (
            <MessageContext.Provider value={contextValue}>
                {children}
            </MessageContext.Provider>
        );

    }