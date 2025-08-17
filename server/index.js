// Simple WebSocket server for chat and call signaling with basic persistence
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 8081;
const wss = new WebSocket.Server({ port });

// Simple in-memory message store, persisted to disk (server/messages.json)
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
let messages = [];
try {
  if (fs.existsSync(MESSAGES_FILE)) {
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
    messages = JSON.parse(raw || '[]');
    console.log('Loaded', messages.length, 'messages from disk');
  }
} catch (e) { console.warn('Could not load messages file', e); }

function persistMessages() {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages.slice(-500)), 'utf8');
  } catch (e) { console.warn('Could not persist messages', e); }
}

// Keep a set of clients and send history on connect
wss.on('connection', function connection(ws) {
  ws.id = Math.random().toString(36).slice(2, 9);
  console.log('Client connected', ws.id);
  // send welcome + recent history
  ws.send(JSON.stringify({ type: 'welcome', id: ws.id }));
  try {
    const history = messages.slice(-100); // send last 100 messages
    if (history.length) ws.send(JSON.stringify({ type: 'history', items: history }));
  } catch (e) { /* ignore */ }

  ws.on('message', function incoming(message) {
    // Broadcast to all other clients and store chat messages
    try {
      const msg = JSON.parse(message);
      // attach sender id when not provided
      if (!msg.from) msg.from = ws.id;
      const raw = JSON.stringify(msg);

      // store only chat/call types for history
      if (msg.type === 'chat' || msg.type === 'call') {
        messages.push({ ...msg, from: msg.from, ts: Date.now() });
        // persist periodically or keep last N
        if (messages.length % 10 === 0) persistMessages();
      }

      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          // send to everyone including sender for simplicity
          client.send(raw);
        }
      });
    } catch (e) {
      console.warn('Invalid message', e);
    }
  });

  ws.on('close', () => console.log('Client disconnected', ws.id));
});

// persist on shutdown
process.on('SIGINT', () => { console.log('Saving messages before exit'); persistMessages(); process.exit(); });
process.on('SIGTERM', () => { console.log('Saving messages before exit'); persistMessages(); process.exit(); });

console.log(`WebSocket server listening on ws://localhost:${port}`);
