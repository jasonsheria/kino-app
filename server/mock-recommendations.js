// Simple Express server stub for /api/recommendations and /api/events
// Usage: node server/mock-recommendations.js

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

// fake recommendations: return items in same order or shuffled
app.post('/api/recommendations', (req, res) => {
  const { itemIds } = req.body || {};
  if (!itemIds || !Array.isArray(itemIds)) return res.status(400).json({ error: 'missing itemIds' });
  // echo back with simple score: index-based
  const out = itemIds.map((id, i) => ({ id, score: itemIds.length - i }));
  return res.json(out);
});

app.post('/api/events', (req, res) => {
  // accept and ack
  console.log('Received event', req.body && req.body.type, 'payload', req.body && req.body.payload);
  return res.json({ ok: true });
});

const port = process.env.PORT || 3333;
app.listen(port, () => console.log('Mock recommendations server listening on', port));
