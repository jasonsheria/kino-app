import { io } from 'socket.io-client';

// Simple singleton socket manager used across the frontend.
// - init(token) creates or updates the socket connection
// - getSocket() returns the socket instance (or null)
// - on/emit helpers

let socket = null;
let url = (process.env.REACT_APP_WS_URL || process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/$/, '');

export function initSocket(token) {
  try {
    if (socket && socket.connected) {
      // if token changed, reconnect
      const existingToken = socket && socket.auth && socket.auth.token ? socket.auth.token : null;
      if (existingToken === token) return socket;
      try { socket.disconnect(); } catch (e) {}
    }

    const opts = { path: '/socket.io', transports: ['websocket','polling'], autoConnect: true, auth: {} };
    if (token) opts.auth = { token };
    socket = io(url || undefined, opts);

    socket.on('connect', () => {
      try {
        const userRaw = localStorage.getItem('ndaku_user');
        const user = userRaw ? JSON.parse(userRaw) : null;
        const uid = user && (user.id || user._id) ? String(user.id || user._id) : null;
        if (uid) {
          socket.emit('identify', { userId: uid });
          // small log to help debugging
          console.log('[SocketService] connected and emitted identify for', uid);
        }
      } catch (e) {}
    });

    socket.on('connect_error', (err) => console.warn('[SocketService] connect_error', err && err.message ? err.message : err));
    socket.on('error', (err) => console.error('[SocketService] error', err));

    // Lightweight re-identify on token/user changes
    let lastUid = null;
    const interval = setInterval(() => {
      try {
        if (!socket) return;
        const userRaw = localStorage.getItem('ndaku_user');
        const user = userRaw ? JSON.parse(userRaw) : null;
        const uid = user && (user.id || user._id) ? String(user.id || user._id) : null;
        if (uid && socket.connected && uid !== lastUid) {
          socket.emit('identify', { userId: uid });
          lastUid = uid;
        }
      } catch (e) {}
    }, 2500);

    // attach interval so callers can clear on disconnect
    socket.__ndaku_ident_interval = interval;

    return socket;
  } catch (e) {
    console.warn('[SocketService] init failed', e);
    return null;
  }
}

export function getSocket() {
  return socket;
}

export function on(event, cb) {
  if (!socket) return () => {};
  socket.on(event, cb);
  return () => socket.off(event, cb);
}

export function emit(event, payload) {
  if (!socket || !socket.connected) {
    console.warn('[SocketService] emit called but socket not connected', event, payload);
    return false;
  }
  socket.emit(event, payload);
  return true;
}

export function disconnectSocket() {
  try {
    if (socket) {
      if (socket.__ndaku_ident_interval) clearInterval(socket.__ndaku_ident_interval);
      socket.disconnect();
      socket = null;
    }
  } catch (e) { console.warn('[SocketService] disconnect failed', e); }
}
