import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ChatWidget from '../components/common/ChatWidget';
import { FaEnvelope, FaLock, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import '../components/common/fonts.css';
import '../pages/auth.css';

// PKCE Utils
function pkceChallengeFromVerifier(v) {
  return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))
    .then(h => {
      return btoa(String.fromCharCode(...new Uint8Array(h)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    });
}

function randomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  async function submit(e) {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(email)) {
      setError('Veuillez entrer un email valide');
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe');
      return;
    }

    try {
      setLoading(true);
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  }

  const startGoogleOAuth = async () => {
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;

    if (!GOOGLE_CLIENT_ID) {
      setError('Configuration Google manquante');
      return;
    }

    try {
      const state = randomString(16);
      const codeVerifier = randomString(64);
      const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);

      // Store PKCE verifier
      localStorage.setItem('ndaku_pkce_code_verifier', codeVerifier);

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'openid profile email',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline'
      });

      // Redirect to Google OAuth
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (error) {
      setError('Erreur lors de la connexion avec Google');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card shadow-sm">
        <div className="auth-illustration">
          <img src={require('../img/header.jpg')} alt="illustration" />
          <div className="illustration-caption">
            <h4>Trouver. Vendre. Louer.</h4>
            <p className="small">Découvrez des annonces locales et contactez les meilleurs agents.</p>
          </div>
        </div>

        <div className="auth-form">
          <h3 className="fw-bold mb-1 text-center">Bienvenue sur Ndaku</h3>
          <p className="auth-small mb-3 text-center">Connectez-vous pour accéder à votre tableau de bord et gérer vos annonces.</p>

          <form onSubmit={submit} className="fade-in">
            <div className="social-auth">
              <button type="button" className="social-btn google" onClick={startGoogleOAuth} disabled={loading}>
                <FaGoogle /> Continuer avec Google
              </button>
            </div>

            <div className="or-divider">
              <span>ou</span>
            </div>

            <div className="mb-4">
              <label htmlFor="login-email" className="form-label">Email</label>
              <div className="input-with-icon">
                <FaEnvelope className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className={"form-control " + (email && !validateEmail(email) ? 'is-invalid' : '')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
              {email && !validateEmail(email) ? <div className="error-text">Adresse email invalide</div> : null}
            </div>

            <div className="mb-4">
              <label htmlFor="login-password" className="form-label">Mot de passe</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  className="password-toggle" 
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error ? <div className="alert alert-danger py-2 mb-3 small">{error}</div> : null}

            <div className="mb-3 d-flex justify-content-between align-items-center">
              <div>
                <input type="checkbox" id="remember" /> <label htmlFor="remember" className="small ms-1 auth-small">Se souvenir</label>
              </div>
              <div>
                <Link to="/password_forgot" className="small auth-small">Mot de passe oublié ?</Link>
              </div>
            </div>

            <div className="d-grid">
              <button className="btn btn-primary btn-lg" disabled={loading || !email || !password} aria-disabled={loading || !email || !password}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> : null}
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </form>

          <div className="text-center mt-3 small text-muted">Pas encore de compte ? <Link to="/register">S'inscrire</Link></div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
};
export default Login;
