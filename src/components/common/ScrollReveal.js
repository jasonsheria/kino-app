import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';

export default function ScrollReveal({ children, className = '', ...props }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={
        className +
        ' scroll-reveal' +
        (visible ? ' scroll-reveal-visible' : '')
      }
      {...props}
    >
      {children}
    </div>
  );
}
