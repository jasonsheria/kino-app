import React, { useState, useRef, useEffect } from 'react';
import './AgentContactModal.css';

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const AgentContactModal = ({ agent, open, onClose }) => {
  const [messages, setMessages] = useState([  
    { from: 'agent', text: 'Bonjour, comment puis-je vous aider ?', date: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [notif, setNotif] = useState(null);
  const [theme, setTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const fileInput = useRef();
  const bodyRef = useRef();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: 'user', text: input, date: new Date() }]);
    setInput('');
    setTimeout(() => {
      setMessages(msgs => [...msgs, { from: 'agent', text: "Merci pour votre message, je reviens vers vous rapidement.", date: new Date() }]);
      setNotif('Nouveau message de l’agent');
      setTimeout(() => setNotif(null), 2000);
    }, 1200);
  };

  const handleAttach = e => {
    const file = e.target.files[0];
    if (file) {
      setMessages([...messages, { from: 'user', text: `📎 Fichier envoyé : ${file.name}`, date: new Date() }]);
    }
  };

  if (!open) return null;

  return (
    <div className={`agent-contact-modal agent-${theme}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Contactez l'agent</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-body" ref={bodyRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`msg-bubble ${msg.from}`}> 
              {msg.from === 'agent' && <img src={agent.photo} alt={agent.name} className="msg-avatar" />}
              <div className="msg-content">
                <div className="msg-text">{msg.text}</div>
                <div className="msg-time">{formatTime(msg.date)}</div>
              </div>
              {msg.from === 'user' && <div className="msg-avatar user-avatar">👤</div>}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Votre message..."
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <input
            type="file"
            style={{ display: 'none' }}
            ref={fileInput}
            onChange={handleAttach}
          />
          <button className="attach-btn" title="Joindre un fichier" onClick={() => fileInput.current.click()}>📎</button>
          <button className="send-btn" onClick={handleSend}>Envoyer</button>
        </div>
        {notif && <div className="messenger-notif">{notif}</div>}
      </div>
    </div>
  );
};

export default AgentContactModal;
