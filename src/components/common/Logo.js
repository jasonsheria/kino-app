import React from 'react';

const Logo = ({ size = 38 }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="19" cy="19" r="19" fill="#13c296"/>
      <path d="M12 21l7-7 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span style={{ color: '#13c296', fontWeight: 800, fontSize: size * 0.7, fontFamily: 'inherit' }}>Ndaku</span>
  </span>
);

export default Logo;
