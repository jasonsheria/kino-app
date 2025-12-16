import React from 'react';

// AutoReveal: attach scroll reveal classes to multiple elements on the page
// Selectors chosen to cover sections, groups, cards and common blocks.
export default function AutoReveal({ selector = 'section, .container > .row > .col, .animate-card, .agency-clean, .agent-card, .property-card, .service-card, .feature-card, .promo-pro-card' }) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document;
    const els = Array.from(root.querySelectorAll(selector)).filter(el => !el.classList.contains('skip-reveal'));
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          // determine direction: if element top is in upper half -> animate from top, else from bottom
          try {
            const top = entry.boundingClientRect.top;
            const dir = top < (window.innerHeight / 2) ? 'scroll-reveal-from-top' : 'scroll-reveal-from-bottom';
            el.classList.add('scroll-reveal-visible');
            el.classList.add(dir);
          } catch (e) {
            el.classList.add('scroll-reveal-visible');
          }
          // optionally unobserve to avoid repeated triggers
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12 });

    els.forEach((el, idx) => {
      if (!el.classList.contains('scroll-reveal')) el.classList.add('scroll-reveal');
      // set index variable for possible stagger CSS
      try { el.style.setProperty('--i', String(idx)); } catch (e) {}
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [selector]);

  return null;
}
