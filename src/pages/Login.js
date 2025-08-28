import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ChatWidget from '../components/common/ChatWidget';
import { FaEnvelope, FaLock, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import '../components/common/fonts.css';
import '../pages/auth.css';
import authService from '../services/authService';
import { useSocket } from '../contexts/SocketContext'
import { useSnackbar } from 'notistack';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
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
  const from = location.state?.from?.pathname || '/dashboard';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isConnected } = useSocket();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const {loginWithGoogle, user, login} =useAuth();
  useEffect(() => {
     if (user && isConnected) {
       // Émettre identify après login classique si userId existe
       if (window && window.localStorage) {
         const socket = require('socket.io-client').io(process.env.REACT_APP_SOCKET_URL, {
           auth: { token: authService.getToken() },
           transports: ['websocket']
         });
         if (user._id) {
           socket.emit('identify', { userId: user._id });
           console.log('[Login] Emission de identify après login classique:', user._id);
           socket.disconnect();
         }
       }
       const redirectPath = '/';
       navigate(redirectPath, { replace: true });
 
       setIsSubmitting(false); // Stop le preloader si user est défini
       // Optionnel: délai pour l'effet de préchargement
       // Rediriger vers la page appropriée
     }
   }, [user, isConnected, navigate]);
 const handleSubmit = async (e) => {
     e.preventDefault();
     setError(null);
     setIsSubmitting(true);
     try {
       await login(email, password);
       // La redirection se fait dans useEffect quand user est défini
     } catch (err) {
       setError("Login failed. Please check your email and password.");
       // eslint-disable-next-line no-console
       console.error("Login error:", err);
       setIsSubmitting(false);
     }
   };



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

          <form onSubmit={handleSubmit} className="fade-in">
            <div className="social-auth">
              <button type="button" className="social-btn google" disabled={loading}>
                {/* <FaGoogle /> Continuer avec Google */}
                {/* Intégration directe du bouton GoogleLogin */}
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    // Envoie le token Google à ton backend pour login/register
                    if (credentialResponse.credential) {
                      try {
                        await loginWithGoogle(credentialResponse.credential);
                        enqueueSnackbar('Connexion Google réussie !', { variant: 'success' });
                        closeSnackbar('google-auth-prompt'); // Ferme la notification persistante
                      } catch (error) {
                        enqueueSnackbar(error.message || 'Échec de la connexion Google côté serveur.', { variant: 'error' });
                      }
                    } else {
                      enqueueSnackbar('Identifiant Google non reçu.', { variant: 'error' });
                    }
                  }}
                  onError={() => setError("Erreur lors de la connexion Google.")}
                  width="100%"
                  useOneTap
                />
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
