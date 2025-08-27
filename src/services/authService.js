import { authAPI } from './api.service';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('ndaku_auth_token');
    this.user = JSON.parse(localStorage.getItem('ndaku_user') || 'null');
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('ndaku_auth_token', token);
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('ndaku_user', JSON.stringify(user));
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.token;
  }

  async exchangeCode({ code, code_verifier, redirect_uri }) {
    try {
      const response = await authAPI.googleExchange({ code, code_verifier, redirect_uri });
      if (response.data.access_token) {
        this.setAuthToken(response.data.access_token);
      }
      if (response.data.user) {
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to exchange code');
    }
  }

  async login({ email, password }) {
    try {
      const response = await authAPI.login({ email, password });
      if (response.data.accessToken) {
        this.setAuthToken(response.data.accessToken);
      }
      if (response.data.user) {
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to login');
    }
  }

  async prepareGoogleOAuth() {
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;

    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Configuration Google manquante');
    }

    // Generate PKCE verifier and challenge
    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = await this.pkceChallengeFromVerifier(codeVerifier);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile email',
      state: this.generateRandomString(16),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline'
    });

    return {
      codeVerifier,
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    };
  }

  async exchangeGoogleCode(code, codeVerifier) {
    try {
      const response = await authAPI.googleExchange({
        code,
        code_verifier: codeVerifier,
        redirect_uri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`
      });
      
      if (response.data.access_token) {
        this.setAuthToken(response.data.access_token);
      }
      if (response.data.user) {
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to exchange Google code');
    }
  }

  async loginWithGoogle(credential) {
    try {
      const response = await authAPI.googleLogin(credential);
      if (response.data.token) {
        this.setAuthToken(response.data.token);
      }
      if (response.data.user) {
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to login with Google');
    }
  }

  // PKCE Utils
  generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async pkceChallengeFromVerifier(v) {
    const encoder = new TextEncoder();
    const data = encoder.encode(v);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  logout() {
    localStorage.removeItem('ndaku_auth_token');
    localStorage.removeItem('ndaku_user');
    localStorage.removeItem('ndaku_ws_id');
    this.token = null;
    this.user = null;
  }
}

export default new AuthService();
