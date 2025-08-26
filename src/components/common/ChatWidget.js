
import { useEffect, useRef, useState } from 'react';
import '../common/ChatWidget.css';
import { FaCommentDots } from 'react-icons/fa';

// Design inspiré MongoDB, pro, flottant, responsive, prêt à être utilisé partout
export default function ChatWidget({ user = null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // load persisted messages per user
    try {
      const runtimeUser = user || JSON.parse(localStorage.getItem('ndaku_user') || '{}');
      const key = runtimeUser && runtimeUser.id ? `ndaku_chat_messages_${runtimeUser.id}` : 'ndaku_chat_messages_public';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      setMessages(existing);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, open]);

  useEffect(() => { if (open && inputRef.current) { inputRef.current.focus(); } }, [open]);

  const sendMessage = () => {
    if (!text.trim()) return;
    setSending(true);
    const item = { from: 'me', text, ts: Date.now() };
    setMessages(m => {
      const next = [...m, item];
      try {
        const runtimeUser = user || JSON.parse(localStorage.getItem('ndaku_user') || '{}');
        const key = runtimeUser && runtimeUser.id ? `ndaku_chat_messages_${runtimeUser.id}` : 'ndaku_chat_messages_public';
        localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setText('');
    // small simulated send delay
    setTimeout(() => {
      setSending(false);
      if (window.showToast) window.showToast('Message envoyé', 'success');
    }, 300);
  };

  // Pour toutes les pages : floating button + widget
  return (
    <>
      <div className={`mongo-chat-widget${open ? ' open' : ''}`} aria-live="polite">
        <div className="mongo-chat-header">
          <div className="mongo-chat-title"><FaCommentDots style={{marginRight:8}}/>Support Ndaku</div>
          <button className="mongo-chat-close" onClick={() => setOpen(false)} title="Fermer">×</button>
        </div>
        <div className="mongo-chat-body" ref={listRef}>
          {messages.length === 0 && <div className="mongo-chat-empty">Commencez la discussion avec notre équipe !</div>}
          {messages.map((m, i) => (
            <div key={i} className={`mongo-chat-msg ${m.from === 'me' ? 'me' : 'peer'}`}>
              <div className="mongo-chat-bubble">{m.text}</div>
              <div className="mongo-chat-ts">{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
        </div>
        <div className="mongo-chat-input">
          <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} placeholder="Posez votre question, demande de visite, plainte..." aria-label="Message" />
          <button className="mongo-chat-send" onClick={sendMessage} disabled={sending || !text.trim()}>{sending ? 'Envoi...' : 'Envoyer'}</button>
        </div>
      </div>
      <button className="mongo-chat-fab" title="Chat Ndaku" onClick={() => { setOpen(true); setUnread(0); }}>
        <FaCommentDots size={22} />
        {unread > 0 && <span className="mongo-chat-badge">{unread}</span>}
      </button>
    </>
  );
}
