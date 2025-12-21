import React from 'react';
import './ProgressTopBar.css';

const ProgressTopBar = () => {
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const agentsReady = React.useRef(false);
  const propsReady = React.useRef(false);
  const finished = React.useRef(false);
  const intervalRef = React.useRef(null);
  const fallbackRef = React.useRef(null);

  React.useEffect(() => {
    // add loading class to body to apply blur
    document.body.classList.add('app-loading');

    // advance the progress slowly up to 90%
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p;
        const inc = Math.random() * 6 + 1; // 1 - 7
        return Math.min(90, Math.round((p + inc) * 10) / 10);
      });
    }, 300);

    const tryFinish = () => {
      if (finished.current) return;
      if (agentsReady.current && propsReady.current) {
        finished.current = true;
        finishProgress();
      }
    };

    const onAgents = () => { agentsReady.current = true; tryFinish(); };
    const onProps = () => { propsReady.current = true; tryFinish(); };
    const onLoad = () => { agentsReady.current = true; propsReady.current = true; tryFinish(); };

    window.addEventListener('ndaku:agents-updated', onAgents);
    window.addEventListener('ndaku:properties-updated', onProps);
    window.addEventListener('load', onLoad);

    // Fallback: finish after max 8s
    fallbackRef.current = setTimeout(() => {
      if (!finished.current) {
        finished.current = true;
        finishProgress();
      }
    }, 8000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(fallbackRef.current);
      window.removeEventListener('ndaku:agents-updated', onAgents);
      window.removeEventListener('ndaku:properties-updated', onProps);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  function finishProgress() {
    clearInterval(intervalRef.current);
    setProgress(100);
    // wait a bit then hide and remove blur
    setTimeout(() => {
      setVisible(false);
      document.body.classList.remove('app-loading');
    }, 450);
  }

  if (!visible) return null;

  return (
    <div className="progress-topbar" aria-hidden>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="progress-percent" aria-hidden>{Math.round(progress)}%</div>
    </div>
  );
};

export default ProgressTopBar;
