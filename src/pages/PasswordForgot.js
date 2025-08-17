import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../pages/auth.css';

const PasswordForgot = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!validateEmail(email)) return setError('Veuillez saisir une adresse email valide');
    setLoading(true);
    setTimeout(()=>{
      setLoading(false);
      setMessage('Si cet email existe, un lien de réinitialisation a été envoyé (simulation).');
    }, 900);
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center">
      <div className="auth-card p-4 shadow-sm rounded-4">
        <h3 className="fw-bold mb-1">Mot de passe oublié</h3>
        <p className="text-muted small mb-3">Entrez votre email pour recevoir un lien de réinitialisation.</p>

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label small">Email</label>
            <input className={`form-control ${email && !validateEmail(email) ? 'is-invalid' : ''}`} value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.com" />
            {error && <div className="error-text">{error}</div>}
          </div>

          {message && <div className="alert alert-success py-2 mb-3 small">{message}</div>}

          <div className="d-grid">
            <button className="btn btn-primary" disabled={loading}>{loading? (<><span className="spinner-border spinner-border-sm me-2"/>Envoi...</>) : 'Envoyer le lien'}</button>
          </div>
        </form>

        <div className="text-center mt-3 small text-muted"><Link to="/login">Retour à la connexion</Link></div>
      </div>
    </div>
  );
};

export default PasswordForgot;
