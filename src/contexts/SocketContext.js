// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { config } from '../config/api.config';
const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]); // Exemple: stocker les messages reçus
  const [adminChatMessages, setAdminChatMessages] = useState([]); // Messages admin chatroom
  const [adminRoomJoined, setAdminRoomJoined] = useState(false);
  const [adminTypingUser, setAdminTypingUser] = useState(null); // Utilisateur admin qui tape
  const socketRef = useRef(null); // Pour stocker l'instance du socket

  const { user, isAuthenticated, userId, token } = useAuth(); // Récupérer l'état d'authentification

  useEffect(() => {
    // Connectez-vous uniquement si l'utilisateur est authentifié
    if (!isAuthenticated) {
      // Assurez-vous que le socket est déconnecté si l'utilisateur se déconnecte
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return; // Ne pas essayer de se connecter si non authentifié
    }

    // Empêche la double initialisation du socket
    if (socketRef.current) {
      console.warn('[SocketContext] Un socket existe déjà, on ne le recrée pas.');
      return;
    }

    // URL de votre backend NestJS WebSocket Gateway
    // Assurez-vous que cette URL est correcte et accessible
    const SOCKET_URL = config.API_ENDPOINTS.WS_URL // Exemple
    // const token = localStorage.getItem('authToken');
    // console.log('[DEBUG] Token sent to socket:', token); // DEBUG

    // Initialiser la connexion Socket.IO
    socketRef.current = io(SOCKET_URL, {
      // Options de connexion
      // Vous pouvez passer le token d'authentification ici si votre backend l'attend
      auth: {
        token: token // Récupérer le token stocké
      },
       transports: ['websocket'],
      autoConnect: true
    });

    // --- Écouteurs d'événements standard du socket ---
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      // Émettre l'identité de l'utilisateur dès la connexion
      if (userId) {
        socketRef.current.emit('identify', { userId });
        console.log('[SocketContext] Emission de identify avec userId:', userId);
        // capturer les message de la fonction  getForumMessages du backend dans le websocket 
        // qui a cette foncion dans l'en tete
        // socketRef.current.emit('getForumMessages', { userId });
      }
      // Ici, vous pourriez émettre un événement "joinApp" ou similaire
      // socketRef.current.emit('joinApp', { userId: user.id });
    });

    socketRef.current.on('disconnect', (reason) => {
      setIsConnected(false);
      // Gérer la reconnexion si nécessaire (Socket.IO le fait par défaut)
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket', error);
      // Afficher une notification d'erreur à l'utilisateur
    });

    // --- Écouteurs d'événements personnalisés de l'application (messagerie) ---

    // Exemple : Écouter les nouveaux messages
    socketRef.current.on('newMessage', (message, userId) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      // Mettre à jour l'état des messages
    });

    // Écouter les messages reçus d'autres utilisateurs ou du bot (événement personnalisé)
    socketRef.current.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      // Log pour debug après ajout dans le state
      setTimeout(() => {
        // console.log('[DEBUG][SocketContext] messages après ajout:', [...messages, message]);
      }, 0);
    });
    // Optionnel : supprimer l'écouteur botMessage si non utilisé côté serveur
    // socketRef.current.on('botMessage', (botMessage) => {
    //   console.log('Réponse du chatbot reçue:', botMessage);
    //   setMessages((prevMessages) => [...prevMessages, botMessage]);
    // });

    // Écouter l'historique des messages (souvent envoyé après avoir rejoint une conversation)
    socketRef.current.on('messageHistory', (history) => {
      setMessages(history); // Remplace l'état actuel par l'historique
    });


    // --- ADMIN CHATROOM ---
    // Écouter les messages adminChatRoomMessage
    const handleAdminChatRoomMessage = (message) => {
      if (Array.isArray(message)) {
        setAdminChatMessages((prev) => [...prev, ...message]);
      } else {
        setAdminChatMessages((prev) => [...prev, message]);
      }
    };
    socketRef.current.on('adminChatRoomMessage', handleAdminChatRoomMessage);

    // --- ADMIN CHATROOM ---
    socketRef.current.on('adminChatRoomJoined', () => {
      setAdminRoomJoined(true);
      // DEBUG: Afficher l'état du socket et de l'utilisateur
    });



    // --- ADMIN CHATROOM ---
    // Indicateur de saisie admin
    socketRef.current.on('adminTyping', (data) => {
      setAdminTypingUser(data && data.isTyping ? data.from : null);
    });

    // Écouter les fichiers envoyés dans la room admin-chatroom
    socketRef.current.on('adminChatRoomFile', (fileMessage) => {
      setAdminChatMessages((prev) => [...prev, fileMessage]);
    });

    // Ajoutez d'autres écouteurs selon vos besoins (typing, user online, etc.)
    socketRef.current.on('adminChatRoomMessages', (messages) => {
      setAdminChatMessages(messages); // Mettre à jour l'état des messages admin chatroom
    });
    // --- Nettoyage ---
    return () => {
      if (socketRef.current) {
        socketRef.current.off('adminChatRoomMessage', handleAdminChatRoomMessage);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setAdminChatMessages([]); // Reset admin chatroom messages on disconnect
      setAdminRoomJoined(false);
    };

  }, [isAuthenticated, setAdminChatMessages]); // Reconnecte si l'état d'authentification change

  // --- Fonctions pour envoyer des événements (émettre) ---

  // Exemple : Envoyer un nouveau message
  const sendMessage = (messageData) => {
    if (socketRef.current && isConnected) {
      // senderId = utilisateur connecté, userId = contrôleur (peut être différent)
      const senderId = user?._id || user?.id;
      socketRef.current.emit('newMessage', {
        userId: userId, // ID du contrôleur (destinataire logique)
        senderId: senderId, // ID de l'utilisateur connecté (expéditeur)
        text: messageData.text || messageData.content || '',
      });
    } else {
      console.warn('Socket non connecté. Impossible d\'envoyer le message.');
    }
  };

  // Exemple : Rejoindre une conversation (pour recevoir les messages de cette conversation)
  const joinRoom = (roomId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('joinRoom', { roomId }); // 'joinRoom' doit correspondre à un événement NestJS
    } else {
      console.warn('Socket non connecté. Impossible de rejoindre la conversation.');
    }
  };

  // --- ADMIN CHATROOM ---
  // Rejoindre la room admin-chatroom (doit être appelé côté admin)
  const joinAdminChatRoom = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('joinAdminChatRoom');
      // recuperer les messages de la room admin-chatroom et les envoyer au chat pour les afficher


    } else {
      console.warn('Socket non connecté. Impossible de rejoindre la room admin-chatroom.');
    }
  };

  // Envoyer un message dans la room admin-chatroom
  const sendAdminChatRoomMessage = (data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('adminChatRoomMessage', data);
    } else {
      console.warn('Socket non connecté. Impossible d\'envoyer le message admin-chatroom.');
    }
  };

  // --- ADMIN CHATROOM ---
  // Indicateur de saisie admin
  const sendAdminTyping = (isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('adminTyping', { isTyping });
    }
  };

  // --- ADMIN CHATROOM PAGINATION ---
  // Fonction pour demander les anciens messages admin (pagination)
  const fetchOlderAdminMessages = (before, limit = 15) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('getOlderAdminMessages', { before, limit });
    }
  };

  // Écoute la réponse du backend pour la pagination
  useEffect(() => {
    if (!socketRef.current) return;
    const handleOlderAdminMessages = (olderMessages) => {
      if (Array.isArray(olderMessages) && olderMessages.length > 0) {
        setAdminChatMessages((prev) => {
          // Ajoute les anciens messages en début de liste, sans doublons
          const existingIds = new Set(prev.map(m => m._id || m.id || m.date));
          const filtered = olderMessages.filter(m => !existingIds.has(m._id || m.id || m.date));
          return [...filtered, ...prev];
        });
      }
    };
    socketRef.current.on('olderAdminMessages', handleOlderAdminMessages);
    return () => {
      if (socketRef.current) {
        socketRef.current.off('olderAdminMessages', handleOlderAdminMessages);
      }
    };
  }, [isConnected, setAdminChatMessages]);

  return (
    <SocketContext.Provider value={{
      isConnected,
      messages,
      sendMessage,
      joinRoom,
      // --- ADMIN CHATROOM ---
      adminChatMessages,
      joinAdminChatRoom,
      sendAdminChatRoomMessage,
      setAdminChatMessages,
      adminRoomJoined,
      sendAdminTyping,
      adminTypingUser,
      socketRef, // <-- expose l'instance du socket
      fetchOlderAdminMessages,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte Socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};