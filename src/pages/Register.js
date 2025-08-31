import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatWidget from '../components/common/ChatWidget';
import { FaUser, FaEnvelope, FaLock, FaGoogle, FaGithub, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../pages/auth.css';
import { useAuth } from '../contexts/AuthContext';

const countries = [
  { code: '+243', name: 'DR Congo' },
  { code: '+221', name: 'Senegal' },
  { code: '+33', name: 'France' },
  { code: '+1', name: 'USA' }
];

export default function Register() {
  const navigate = useNavigate();
  const { register, socket, user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState(countries[0].code);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(null);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setProfileImage(file);
      setProfileImageUrl(URL.createObjectURL(file));
    } else {
      setProfileImage(null);
      setProfileImageUrl(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setProfileImage(e.dataTransfer.files[0]);
      setProfileImageUrl(URL.createObjectURL(e.dataTransfer.files[0]));
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage(null);

    if (!name.trim()) return setError('Le nom est requis');
    if (!validateEmail(email)) return setError('Email invalide');
    if (password.length < 6) return setError('Mot de passe: minimum 6 caractères');
    if (password !== confirmPassword) return setError('Les mots de passe ne correspondent pas');
    if (!phoneNumber || phoneNumber.length < 6) return setError('Numéro de téléphone invalide');
    if (profileImage && profileImage.size > 2 * 1024 * 1024) return setError('Image trop volumineuse (max 2Mo)');

    setLoading(true);
    try {
      let fullPhone = selectedCountryCode + phoneNumber;
      if (fullPhone.startsWith('+')) fullPhone = fullPhone.slice(1);
      const numericPhone = Number(fullPhone);

      await register(name, email, password, numericPhone, profileImage);
      setInfoMessage('Inscription réussie');
      if (socket && user && user._id) socket.emit('identify', { userId: user._id });
      navigate('/login');
    } catch (err) {
      setError(err?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-illustration">
          <img src="/img/register-illustration.svg" alt="Illustration" />
          <div className="illustration-caption fade-in">
            <h4>Bienvenue sur Ndaku</h4>
            <p className="auth-small">Votre plateforme immobilière de confiance</p>
          </div>
        </div>
        
        <div className="auth-form">
          <div className="auth-logo mb-3">
            <img src="/img/logo.png" alt="Logo" />
          </div>
          
          <h3 className="fw-bold mb-2">Créer un compte</h3>
          <p className="auth-small mb-3">Inscrivez-vous pour publier des annonces et contacter des agents.</p>

          <div className="social-row">
            <button type="button" className="social-btn google">
              <FaGoogle /> Google
            </button>
            <button type="button" className="social-btn github">
              <FaGithub /> GitHub
            </button>
          </div>

          <div className="or-divider"><span>ou</span></div>

          <form onSubmit={handleSubmit} className="fade-in">
            <div className="mb-3">
              <label htmlFor="register-name" className="form-label">Nom complet</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input 
                  id="register-name" 
                  className={`form-control ${!name && error ? 'is-invalid' : ''}`}
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Votre nom complet"
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="register-email" className="form-label">Adresse email</label>
              <div className="input-with-icon">
                <FaEnvelope className="input-icon" />
                <input 
                  id="register-email" 
                  type="email" 
                  className={`form-control ${email && !validateEmail(email) ? 'is-invalid' : ''}`}
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">Mot de passe</label>
                  <div className="input-with-icon input-with-toggle">
                    <FaLock className="input-icon" />
                    <input 
                      id="register-password" 
                      type={showPassword ? 'text' : 'password'} 
                      className={`form-control ${password && password.length < 6 ? 'is-invalid' : ''}`}
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="Minimum 6 caractères"
                    />
                    <button 
                      type="button" 
                      className="password-toggle" 
                      onClick={() => setShowPassword(s => !s)}
                      title={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <FaEyeSlash/> : <FaEye/>}
                    </button>
                  </div>
                </div>
                <div className="col-md-6 mt-md-0 mt-3">
                  <label className="form-label">Confirmation</label>
                  <div className="input-with-icon">
                    <FaLock className="input-icon" />
                    <input 
                      id="register-confirm-password" 
                      type={showPassword ? 'text' : 'password'} 
                      className={`form-control ${confirmPassword && password !== confirmPassword ? 'is-invalid' : ''}`}
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="Confirmez le mot de passe"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Numéro de téléphone</label>
              <div className="input-group">
                <select 
                  className="form-select" 
                  value={selectedCountryCode} 
                  onChange={e => setSelectedCountryCode(e.target.value)}
                  style={{maxWidth: '120px'}}
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <input 
                  id="register-phone" 
                  type="tel" 
                  className={`form-control ${phoneNumber && phoneNumber.length < 6 ? 'is-invalid' : ''}`}
                  value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value)} 
                  placeholder="Votre numéro"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label mb-0">Photo de profil</label>
                <button 
                  type="button" 
                  className="compact-toggle-btn"
                  onClick={() => setShowUpload(s => !s)}
                >
                  {showUpload ? 'Masquer' : 'Ajouter une photo'}
                </button>
              </div>
              {showUpload && (
                <div 
                  className="profile-upload-area" 
                  onDrop={handleDrop} 
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('profile-image-input')?.click()}
                >
                  {profileImageUrl ? (
                    <div className="image-preview">
                      <img src={profileImageUrl} alt="Aperçu" />
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="mb-1">Déposez une image ici ou cliquez pour sélectionner</p>
                      <small className="text-muted">JPG ou PNG - Max 2 Mo</small>
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="profile-image-input" 
                    accept="image/jpeg,image/png" 
                    style={{display:'none'}} 
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-danger fade-in">
                <small>{error}</small>
              </div>
            )}
            
            {infoMessage && (
              <div className="alert alert-success fade-in">
                <small>{infoMessage}</small>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary w-100" 
              disabled={loading}
            >
              {loading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Création du compte...
                </span>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>

          <p className="text-center mt-4 mb-0">
            Déjà membre ? <Link to="/login" className="text-primary">Connectez-vous</Link>
          </p>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
