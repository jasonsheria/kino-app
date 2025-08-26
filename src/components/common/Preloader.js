import React from 'react';
import './Preloader.css';

const Preloader = ({ message = 'Chargement…' }) => {
  return (
    <div className="preloader-overlay" role="status" aria-live="polite" aria-label="Chargement en cours">
      <div className="preloader-center">
  <svg className="preloader-spinner" viewBox="0 0 50 50" aria-hidden="true" role="img" aria-label="Chargement">
          <circle className="spinner-track" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          <circle className="spinner-head" cx="25" cy="25" r="20" fill="none" strokeWidth="4" strokeLinecap="round" />
        </svg>

  <div className="preloader-message">{message}</div>
      </div>
    </div>
  );
};

export default Preloader;
