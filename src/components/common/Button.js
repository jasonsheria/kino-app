import React from 'react';
import './Button.css';

// Lightweight Bootstrap-based Button for consistent look across the app.
// Props:
// - variant: 'contained' | 'outlined' (maps to bootstrap btn-{color} / btn-outline-{color})
// - color: bootstrap color name (primary, success, danger, secondary, etc.)
// - size: 'sm' | 'md' | 'lg'
// - block: boolean -> full width
// - animated: boolean -> subtle sweep animation on hover
const Button = ({ children, variant = 'contained', color = 'primary', size = 'md', block = false, animated = false, startIcon, endIcon, className = '', ...props }) => {
  const safeColor = color === 'inherit' ? 'light' : color;
  const bsVariant = variant === 'outlined' ? `btn-outline-${safeColor}` : `btn-${safeColor}`;
  const sizeClass = size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : '';
  const blockClass = block ? 'w-100' : '';
  const animClass = animated ? 'ndaku-btn-animated' : '';

  const content = (
    <>
      {startIcon && <span className="me-2 d-inline-flex align-items-center">{startIcon}</span>}
      <span className="ndaku-btn-label">{children}</span>
      {endIcon && <span className="ms-2 d-inline-flex align-items-center">{endIcon}</span>}
    </>
  );

  // render as anchor if href provided to keep a11y and semantics
  if (props.href) {
    const { href, ...rest } = props;
    return (
      <a href={href} className={`btn ${bsVariant} ${sizeClass} rounded-pill ndaku-btn ${blockClass} ${animClass} ${className}`} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button className={`btn ${bsVariant} ${sizeClass} rounded-pill ndaku-btn ${blockClass} ${animClass} ${className}`} {...props}>
      {content}
    </button>
  );
};

export default Button;
