import React from 'react';
import './Preloader.css';

const Preloader = () => (
  <div className="preloader-bg">
    <div className="preloader-card">
      <div className="preloader-spinner-ring" aria-hidden="true"></div>
    </div>
  </div>
);

export default Preloader;
