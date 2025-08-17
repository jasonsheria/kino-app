This folder contains simple servers used by the app during development.

- `index.js` - WebSocket server (already present). Run: `node index.js` or `npm start` in this folder.
- `http-server.js` - Minimal Express endpoint used to exchange Google OAuth code for tokens.

Persistence:
- The WebSocket server (`index.js`) now persists recent messages to `server/messages.json` and sends the latest history to clients on connect.

Running both servers for development:
1. In `server/` install deps: `npm install`
2. Start WebSocket server (history/persistence): `node index.js`
3. In another terminal start the HTTP helper (token exchange): `npm run start:http`

Setup for `http-server.js`:
1. Install dependencies in `server/`:
   npm install
2. Set environment variables (example):
   export GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   export GOOGLE_CLIENT_SECRET=your-client-secret
3. Run the server:
   npm run start:http

Security note: This simple example is for development only. In production, secure the endpoint, validate state, and store secrets safely.
