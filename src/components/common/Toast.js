import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3500, onClose }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className={`ndaku-toast ndaku-toast-${type}`} role="status">
      {message}
    </div>
  );
};

export default Toast;
