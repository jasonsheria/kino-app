import { useEffect, useState, useRef } from 'react';
import CallModal from './CallModal';
import { agents } from '../../data/fakedata';

// Hook global pour gérer l'ouverture du CallModal sur tout le site
export function useGlobalCallModal() {
  const [call, setCall] = useState({ open: false, agent: null, status: 'connecting', muted: false, volume: 1 });
  const timerRef = useRef();

  useEffect(() => {
    // Handler global pour tous les boutons téléphone
    const handler = (e) => {
      const { meta } = e.detail || {};
  let agent = null;
  if (meta?.agentId) agent = agents.find(a => String(a.id) === String(meta.agentId));
      setCall({ open: true, agent, status: 'connecting', muted: false, volume: 1 });
      // Simule la connexion puis passage à "in-call"
      setTimeout(() => setCall(c => ({ ...c, status: 'in-call' })), 1200);
    };
    window.addEventListener('ndaku-call', handler);
    return () => window.removeEventListener('ndaku-call', handler);
  }, []);

  const handleHangup = () => setCall(c => ({ ...c, open: false, status: 'ended' }));
  const handleMute = () => setCall(c => ({ ...c, muted: !c.muted }));
  const handleVolume = (v) => setCall(c => ({ ...c, volume: Math.max(0, Math.min(1, v)) }));

  return {
    CallModal: () => (
      <CallModal
        open={call.open}
        onClose={handleHangup}
        agent={call.agent}
        status={call.status}
        muted={call.muted}
        onMute={handleMute}
        onHangup={handleHangup}
        onVolume={handleVolume}
        volume={call.volume}
      />
    )
  };
}
