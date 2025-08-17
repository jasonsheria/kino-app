import React from 'react';
import './Preloader.css';

const Preloader = () => (
  <div className="preloader-bg">
    <div className="preloader-card">
      <div className="preloader-logo">🏠</div>
      <div className="preloader-spinner-ring" aria-hidden="true"></div>
      <div className="preloader-text">Chargement Ndaku...</div>
    </div>
  </div>
);

export default Preloader;
