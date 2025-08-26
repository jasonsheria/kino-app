import React, { useState } from 'react';
import Toast from './Toast';

let addFn = null;

export const mountToastManager = (fn) => { addFn = fn; };
export const showToast = (msg, type = 'info', duration = 3500) => { if (addFn) addFn({ id: Date.now(), msg, type, duration }); };

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);
  const add = (t) => setToasts(prev => [...prev, t]);
  const remove = (id) => setToasts(prev => prev.filter(x => x.id !== id));

  // expose add
  React.useEffect(() => {
    mountToastManager((t) => add(t));
  }, []);

  return (
    <div>
      {toasts.map(t => (
        <Toast key={t.id} message={t.msg} type={t.type} duration={t.duration} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
};

export default ToastManager;
