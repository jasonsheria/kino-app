// Simple scroll lock helper using a reference count and a body class
// Avoids writing inline style on <body> and prevents conflicts when multiple
// components request scroll locking simultaneously.
export function lockScroll() {
  if (typeof document === 'undefined') return;
  const count = parseInt(document.body.getAttribute('data-scroll-lock') || '0', 10);
  document.body.setAttribute('data-scroll-lock', String(count + 1));
  document.body.classList.add('ndaku-lock-scroll');
}

export function unlockScroll() {
  if (typeof document === 'undefined') return;
  const count = parseInt(document.body.getAttribute('data-scroll-lock') || '0', 10) - 1;
  if (count <= 0) {
    document.body.removeAttribute('data-scroll-lock');
    document.body.classList.remove('ndaku-lock-scroll');
  } else {
    document.body.setAttribute('data-scroll-lock', String(count));
  }
}
