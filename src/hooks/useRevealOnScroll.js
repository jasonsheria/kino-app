import { useEffect } from 'react';

export default function useRevealOnScroll(selector = '.scroll-reveal', options = {}) {
  useEffect(() => {
    // respect user preference
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll(selector).forEach(el => el.classList.add('scroll-reveal-visible'));
      return;
    }

    const els = Array.from(document.querySelectorAll(selector));
    if (!els.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.revealDelay ? Number(el.dataset.revealDelay) : 0;
          setTimeout(() => el.classList.add('scroll-reveal-visible'), delay);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px', ...options });

    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [selector, JSON.stringify(options)]);
}
