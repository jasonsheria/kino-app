import React from 'react';
import AgencyLayout from '../components/agency/AgencyLayout';
import { currentAgencySession, fetchAgency, updateAgency } from '../api/agencies';
import ChatWidget from '../components/common/ChatWidget';

export default function AgencyMessages() {
  const session = currentAgencySession();
  const [conversations, setConversations] = React.useState([]);
  const [activeConv, setActiveConv] = React.useState(null);

  React.useEffect(() => {
    const s = async () => {
      if (!session) return;
      const a = await fetchAgency(session.id);
      const conv = a.messages || [];
      setConversations(conv);
      if (conv.length > 0) setActiveConv(conv[0]);
    };
    s();
  }, [session && session.id]);

  // allow chat widget to append a message to the agency store
  const handleLocalMessage = async (text) => {
    if (!session) return;
    const a = await fetchAgency(session.id);
    const msgs = a.messages || [];
    const id = 'm-' + Math.random().toString(36).slice(2, 9);
    const item = { id, from: 'agency', text, ts: Date.now() };
    msgs.push(item);
    await updateAgency(session.id, { messages: msgs });
    setConversations(msgs);
    setActiveConv(item);
  };

  return (
    <AgencyLayout>
      <div>
        <h4>Messages</h4>
        <div className="small text-muted mb-3">Conversations récentes avec vos clients. Utilisez le chat en bas à droite pour répondre en temps réel.</div>
        <div className="d-md-flex gap-3">
          <div style={{ flex: '0 0 320px' }}>
            <div className="list-group">
              {conversations.length === 0 && <div className="list-group-item text-muted">Aucune conversation pour le moment.</div>}
              {conversations.map(m => (
                <button key={m.id} className={`list-group-item list-group-item-action ${activeConv && activeConv.id === m.id ? 'active' : ''}`} onClick={() => setActiveConv(m)}>
                  <div className="fw-semibold">{m.from || 'Client'}</div>
                  <div className="text-muted small text-truncate">{m.text}</div>
                  <div className="small text-muted">{new Date(m.ts).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div className="card">
              <div className="card-body" style={{ height: 420, overflow: 'auto' }}>
                {activeConv ? (
                  <div>
                    <div className="fw-bold mb-2">Conversation: {activeConv.from || 'Client'}</div>
                    <div className="small text-muted mb-3">Dernier message: {new Date(activeConv.ts).toLocaleString()}</div>
                    <div className="border rounded p-2">
                      <div className="small text-wrap">{activeConv.text}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted">Sélectionnez une conversation ou utilisez le chat pour démarrer une nouvelle discussion.</div>
                )}
              </div>
            </div>
          </div>
        </div>


      </div>
    </AgencyLayout>
  );
}
