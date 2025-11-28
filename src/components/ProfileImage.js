import React from 'react';

// Simple ProfileImage component
// Props:
// - src: string (image URL)
// - alt: string
// - size: number (px)
// - fallback: optional fallback image path
export default function ProfileImage({ src, alt = 'profile', size = 120, fallback = '/assets/avatar-fallback.png' }) {
  const url = src || fallback;
  const style = {
    width: size,
    height: size,
    objectFit: 'cover',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
  };

  return <img src={url} alt={alt} style={style} />;
}
