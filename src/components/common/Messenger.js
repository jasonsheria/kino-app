
import React, { useState, useRef, useEffect } from 'react';
import { agents, messages as allMessages } from '../../data/fakedata';
import './Messenger.css';

function formatTime(date) {
  if (!date) return '';
  if (typeof date === 'number') date = new Date(date);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Message status: sent, delivered, read, pending
function getStatusIcon(status) {
  if (status === 'pending') return <span title="En attente" style={{color:'#aaa'}}>⏳</span>;
  if (status === 'sent') return <span title="Envoyé" style={{color:'var(--ndaku-primary)'}}>✓</span>;
  if (status === 'delivered') return <span title="Reçu" style={{color:'var(--ndaku-primary)'}}>✓✓</span>;
  if (status === 'read') return <span title="Lu" style={{color:'var(--ndaku-primary)',fontWeight:700}}>✓✓</span>;
  return null;
}

const MessengerWidget = ({ open, onClose, userId = 1 }) => {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id);
  const [input, setInput] = useState('');
  const [notif, setNotif] = useState(null);
  const [theme, setTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const fileInput = useRef();
  const bodyRef = useRef();
  // Simuler messages par agent
  const agentMessages = allMessages.filter(m => m.fromId === selectedAgentId || m.toId === selectedAgentId);

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
  }, [selectedAgentId, agentMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    // Ici, on simule l'envoi (ajout local, status pending)
    allMessages.push({
      id: Date.now(),
      fromId: userId,
      from: 'Vous',
      toId: selectedAgentId,
      to: agents.find(a => a.id === selectedAgentId)?.name,
      text: input,
      time: Date.now(),
      read: false,
      channel: 'web',
      status: 'pending',
    });
    setInput('');
    setNotif('Message envoyé');
    setTimeout(() => setNotif(null), 1200);
  };

  const handleAttach = e => {
    const file = e.target.files[0];
    if (file) {
      allMessages.push({
        id: Date.now(),
        fromId: userId,
        from: 'Vous',
        toId: selectedAgentId,
        to: agents.find(a => a.id === selectedAgentId)?.name,
        text: `📎 Fichier envoyé : ${file.name}`,
        time: Date.now(),
        read: false,
        channel: 'web',
        status: 'pending',
      });
      setNotif('Fichier envoyé');
      setTimeout(() => setNotif(null), 1200);
    }
  };

  if (!open) return null;

  return (
    <div className={`messenger-modal messenger-${theme}`}> 
      <div style={{display:'flex',height:'540px',minWidth: '680px',maxWidth:'98vw'}}>
        {/* Sidebar contacts */}
        <div className="messenger-sidebar" style={{width:260,background:'#f7f7f7',borderRight:'1.5px solid #e9f7f3',display:'flex',flexDirection:'column'}}>
          <div className="sidebar-header" style={{padding:'18px 16px',fontWeight:800,fontSize:'1.15rem',color:'var(--ndaku-primary)'}}>Contacts</div>
          <div className="sidebar-list" style={{flex:1,overflowY:'auto'}}>
            {agents.map(agent => {
              // Dernier message
              const lastMsg = allMessages.filter(m => m.fromId === agent.id || m.toId === agent.id).sort((a,b)=>b.time-a.time)[0];
              const unread = allMessages.filter(m => m.fromId === agent.id && !m.read).length;
              return (
                <div key={agent.id} className={`sidebar-contact${selectedAgentId===agent.id?' active':''}`} onClick={()=>setSelectedAgentId(agent.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',background:selectedAgentId===agent.id?'#e9f7f3':'',borderBottom:'1px solid #f1f1f1'}}>
                  <img src={agent.photo} alt={agent.name} className="agent-avatar" style={{width:44,height:44}} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:'1.05em',color:'#0a223a'}}>{agent.name}</div>
                    <div style={{fontSize:'0.92em',color:'#888',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:120}}>{lastMsg?.text||'Aucun message'}</div>
                  </div>
                  {unread>0 && <span className="badge" style={{background:'#d7263d',color:'#fff',borderRadius:8,padding:'2px 7px',fontSize:'0.85em'}}>{unread}</span>}
                </div>
              );
            })}
          </div>
        </div>
        {/* Zone de chat */}
        <div className="messenger-chat" style={{flex:1,display:'flex',flexDirection:'column',position:'relative',background:'#fff'}}>
          {/* Header chat */}
            <div className="messenger-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:'1.5px solid #e9f7f3'}}>
            <div className="agent-info" style={{display:'flex',alignItems:'center',gap:12}}>
              <img src={agents.find(a=>a.id===selectedAgentId)?.photo} alt="avatar" className="agent-avatar" style={{width:44,height:44}} />
              <div>
                <div className="agent-name" style={{fontWeight:700,fontSize:'1.1em'}}>{agents.find(a=>a.id===selectedAgentId)?.name}</div>
                <div className="agent-role" style={{fontSize:'0.92em',color:'var(--ndaku-primary)'}}>Agent immobilier</div>
              </div>
            </div>
            <button onClick={onClose} className="close-btn">&times;</button>
          </div>
          {/* Body chat */}
          <div className="messenger-body" ref={bodyRef} style={{flex:1,overflowY:'auto',padding:'18px 18px 10px 18px',background:'#f7f7f7'}}>
            {agentMessages.length===0 && <div style={{color:'#888',textAlign:'center',marginTop:40}}>Aucun message avec cet agent.</div>}
            {agentMessages.map((msg, i) => (
              <div key={msg.id||i} className={`msg-bubble ${msg.fromId===userId?'user':'agent'}`}> 
                {msg.fromId!==userId && <img src={agents.find(a=>a.id===msg.fromId)?.photo} alt="avatar" className="msg-avatar" />}
                <div className="msg-content">
                  <div className="msg-text">{msg.text}</div>
                  <div className="msg-time">{formatTime(msg.time)} {msg.fromId===userId && getStatusIcon(msg.status||'sent')}</div>
                </div>
                {msg.fromId===userId && <div className="msg-avatar user-avatar">👤</div>}
              </div>
            ))}
          </div>
          {/* Footer chat */}
          <div className="messenger-footer" style={{display:'flex',alignItems:'center',padding:'12px 18px',borderTop:'1.5px solid #e9f7f3',background:'#fff'}}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Votre message..."
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{flex:1,marginRight:8,padding:'8px 12px',borderRadius:8,border:'1.5px solid var(--ndaku-primary)',fontSize:'1em'}}
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
    </div>
  );
};

export default MessengerWidget;
