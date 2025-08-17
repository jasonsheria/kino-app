// Minimal Express server to handle Google code exchange (example)
// WARNING: For production, secure this endpoint and do not log secrets.
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

app.post('/api/auth/google/exchange', async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri } = req.body;
    if (!code) return res.status(400).json({ error: 'missing code' });
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET; // If doing server-side
    if (!clientId) return res.status(500).json({ error: 'server not configured (GOOGLE_CLIENT_ID)' });

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', clientId);
    if (clientSecret) params.append('client_secret', clientSecret);
    params.append('redirect_uri', redirect_uri);
    params.append('grant_type', 'authorization_code');
    if (code_verifier) params.append('code_verifier', code_verifier);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) return res.status(500).json({ error: tokenData.error_description || tokenData.error });

    // Optionally get userinfo
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const user = await userInfoRes.json();

    return res.json({ ...tokenData, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log('HTTP auth server listening on', port));
