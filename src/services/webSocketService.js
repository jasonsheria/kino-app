import { config } from '../config/api.config';
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.handlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.wsUrl = config.API_ENDPOINTS.WS_URL;
  }

  connect(authToken) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(this.wsUrl, {
      auth: { token: authToken },
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;

      // Send identity information
      const user = JSON.parse(localStorage.getItem('ndaku_user') || 'null');
      if (user) {
        this.socket.emit('identify', { 
          userId: user.id || user._id 
        });
      }
    });

    this.socket.on('message', (message) => {
      try {
        console.log('WebSocket message received:', message);
        
        // Handle welcome message
        if (message.type === 'welcome') {
          localStorage.setItem('ndaku_ws_id', message.id);
        }

        // Call registered handlers
        const handlers = this.handlers.get(message.type) || [];
        handlers.forEach(handler => handler(message));

      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket connection closed:', reason);
      // Attempt to reconnect if not explicitly disconnected
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(authToken);
        }, 1000 * Math.min(this.reconnectAttempts + 1, 5));
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Add admin chat room handlers
    this.socket.on('adminChatRoomMessage', (message) => {
      const handlers = this.handlers.get('adminChatRoomMessage') || [];
      handlers.forEach(handler => handler(message));
    });

    this.socket.on('adminChatRoomJoined', () => {
      const handlers = this.handlers.get('adminChatRoomJoined') || [];
      handlers.forEach(handler => handler());
    });

    this.socket.on('adminTyping', (data) => {
      const handlers = this.handlers.get('adminTyping') || [];
      handlers.forEach(handler => handler(data));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    localStorage.removeItem('ndaku_ws_id');
  }

  on(messageType, handler) {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, []);
    }
    this.handlers.get(messageType).push(handler);
  }

  off(messageType, handler) {
    if (this.handlers.has(messageType)) {
      const handlers = this.handlers.get(messageType);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  send(message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(message.type || 'message', message);
    } else {
      console.error('WebSocket is not connected');
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Admin chat room methods
  joinAdminChatRoom() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinAdminChatRoom');
    } else {
      console.error('WebSocket is not connected');
    }
  }

  sendAdminChatMessage(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('adminChatRoomMessage', data);
    } else {
      console.error('WebSocket is not connected');
    }
  }

  sendAdminTyping(isTyping) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('adminTyping', { isTyping });
    } else {
      console.error('WebSocket is not connected');
    }
  }

  fetchOlderAdminMessages(before, limit = 15) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('getOlderAdminMessages', { before, limit });
    } else {
      console.error('WebSocket is not connected');
    }
  }
}

// Export a singleton instance
export default new WebSocketService();
