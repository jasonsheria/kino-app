import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatWidget from '../components/common/ChatWidget';
import { FaUser, FaEnvelope, FaLock, FaGoogle, FaGithub, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../pages/auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Veuillez entrer votre nom');
    if (!validateEmail(email)) return setError('Veuillez entrer un email valide');
    if (password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // fake success -> redirect to login
      navigate('/login');
    }, 900);
  };

  return (
    <div className="auth-page">
      <div className="auth-card shadow-sm">
        <div className="auth-illustration">
          <img src={require('../img/header.jpg')} alt="illustration" />
          <div className="illustration-caption">
            <h4>Rejoignez Ndaku</h4>
            <p className="small">Publiez vos annonces et discutez avec des acheteurs ou locataires.</p>
          </div>
        </div>
        <div className="auth-form">
          <div className="auth-logo mb-2">
            {/* optional logo */}
          </div>
          <h3 className="fw-bold mb-1 text-center">Créer un compte</h3>
          <p className="auth-small mb-3 text-center">Inscrivez-vous pour publier des annonces et contacter des agents.</p>

          <div className="social-row">
            <button type="button" className="social-btn google" aria-label="Continuer avec Google">
              <FaGoogle /> Continuer avec Google
            </button>
            <button type="button" className="social-btn github" aria-label="Continuer avec GitHub">
              <FaGithub /> Continuer avec GitHub
            </button>
          </div>

          <div className="or-divider">
            <span>ou</span>
          </div>

          <form onSubmit={submit} className="fade-in">
            <div className="mb-4">
              <label htmlFor="register-name" className="form-label">Nom complet</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input 
                  id="register-name" 
                  className={`form-control ${name && name.trim() === '' ? 'is-invalid' : ''}`} 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="register-email" className="form-label">Email</label>
              <div className="input-with-icon">
                <FaEnvelope className="input-icon" />
                <input 
                  id="register-email" 
                  type="email" 
                  className={`form-control ${email && !validateEmail(email) ? 'is-invalid' : ''}`} 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="votre@email.com"
                />
              </div>
              {email && !validateEmail(email) && <div className="error-text">Adresse email invalide</div>}
            </div>

            <div className="mb-4">
              <label htmlFor="register-password" className="form-label">Mot de passe</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input 
                  id="register-password" 
                  type={showPassword ? 'text' : 'password'} 
                  className="form-control" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Mot de passe"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(s => !s)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="form-text">Minimum 6 caractères</div>
            </div>

            {error && <div className="alert alert-danger py-2 mb-3 small">{error}</div>}

            <div className="d-grid">
              <button className="btn btn-success btn-lg" disabled={loading}>{loading? (<><span className="spinner-border spinner-border-sm me-2"/>Inscription...</>) : "S'inscrire"}</button>
            </div>
          </form>

          <div className="text-center mt-3 small text-muted">Déjà un compte ? <Link to="/login">Se connecter</Link></div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
};

export default Register;
