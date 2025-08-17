import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../components/common/fonts.css';
import '../pages/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError('');
    // simple validation
    if (!validateEmail(email)) return setError('Veuillez entrer un email valide');
    if (!password) return setError('Veuillez saisir votre mot de passe');
    // fake auth - simulate loading
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // example: accept any password >=4 chars
      if (password.length < 4) {
        setError('Mot de passe incorrect');
        return;
      }
      navigate('/user');
    }, 900);
  };

  const validateEmail = (v) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
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
          <div className="auth-logo mb-2">
            {/* <img src={require('../img/logo192.png')} alt="Ndaku" /> */}
          </div>
          <h3 className="fw-bold mb-1 text-center">Bienvenue sur Ndaku</h3>
          <p className="auth-small mb-3 text-center">Connectez-vous pour accéder à votre tableau de bord et gérer vos annonces.</p>

          <div className="d-flex gap-2 mb-3 social-row">
            <button type="button" className="btn social-btn google flex-grow-1" aria-label="Continuer avec Google">Continuer avec Google</button>
            <button type="button" className="btn social-btn github" aria-label="Continuer avec GitHub">Git</button>
          </div>

          <div className="or-divider mb-3" aria-hidden="true"><span>ou</span></div>

          <form onSubmit={submit} className="fade-in">
            <div className="mb-3">
              <label htmlFor="login-email" className="form-label">Email</label>
              <input
                id="login-email"
                type="email"
                className={`form-control ${email && !validateEmail(email) ? 'is-invalid' : ''}`}
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="votre@email.com"
                aria-invalid={email && !validateEmail(email)}
                aria-describedby="emailHelp"
                inputMode="email"
                autoComplete="email"
              />
              {email && !validateEmail(email) && <div className="error-text">Adresse email invalide</div>}
            </div>

            <div className="mb-3 position-relative">
              <label htmlFor="login-password" className="form-label">Mot de passe</label>
              <div className="input-with-toggle">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control`}
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  autoComplete="current-password"
                />
                <button type="button" className="btn btn-sm btn-outline-secondary password-toggle" onClick={()=>setShowPassword(s=>!s)} aria-label={showPassword? 'Masquer le mot de passe':'Afficher le mot de passe'}>
                  {showPassword? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-danger py-2 mb-3 small">{error}</div>}

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <input type="checkbox" id="remember" /> <label htmlFor="remember" className="small ms-1 auth-small">Se souvenir</label>
              </div>
              <div>
                <Link to="/password_forgot" className="small auth-small">Mot de passe oublié ?</Link>
              </div>
            </div>

            <div className="d-grid">
              <button className="btn btn-primary btn-lg" disabled={loading || !email || !password} aria-disabled={loading || !email || !password}>
                {loading ? (<><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Connexion...</>) : 'Se connecter'}
              </button>
            </div>
          </form>

          <div className="text-center mt-3 small text-muted">Pas encore de compte ? <Link to="/register">S'inscrire</Link></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
