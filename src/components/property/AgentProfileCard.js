import React from 'react';
import { FaPhone, FaWhatsapp, FaFacebook, FaEnvelope, FaCheckCircle, FaListAlt, FaUsers, FaClock, FaRegMoneyBillAlt, FaUserPlus } from 'react-icons/fa';
import './AgentProfileCard.css';

/**
 * AgentProfileCard - modern profile card adjusted to show stats and CTAs
 */
const AgentProfileCard = ({ setShowBooking, agent, onContactClick = () => { } }) => {
  if (!agent) return null;

  const name = agent?.prenom || agent?.name || 'Agent';
  const title = agent?.titre || agent?.title || 'Agent immobilier';
  const location = agent?.location || agent?.city || '';
  const photo = (agent?.photo || agent?.image || agent?.avatar)
    ? (agent?.photo || agent?.image || agent?.avatar)
    : require('../../img/property-1.jpg');

  const openMessengerForAgent = (agentId) => {
    try {
      window.dispatchEvent(new CustomEvent('ndaku-open-messenger', { detail: { agentId } }));
    } catch (e) {
      try { window.dispatchEvent(new CustomEvent('ndaku-request-open-messenger', { detail: { sourceId: 'agent-card', agentId } })); } catch (e) { }
    }
  };

  const handleMessageClick = () => {
    openMessengerForAgent(agent.id || agent._id || agent.agentId);
    onContactClick('message');
  };

  const normalizePhone = (raw) => {
    if (!raw) return null;
    const digits = String(raw).replace(/[^+0-9]/g, '');
    return digits.replace(/^\+/, '');
  };

  const handleWhatsApp = () => {
    const phone = agent.whatsapp || agent.phone || agent.telephone || agent.tel;
    const normalized = normalizePhone(phone);
    if (!normalized) { handleMessageClick(); return; }
    const text = `Bonjour ${name}, je suis intéressé par votre bien.`;
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onContactClick('whatsapp');
  };

  const handlePhone = () => {
    const phone = agent.phone || agent.whatsapp || agent.telephone || agent.tel;
    if (!phone) return;
    window.location.href = `tel:${phone}`;
    onContactClick('phone');
  };

  const handleEmail = () => {
    if (!agent.email) return;
    window.location.href = `mailto:${agent.email}`;
    onContactClick('email');
  };

  const formattedMemberSince = (() => {
    const when = agent.memberSince || agent.joinedAt || agent.createdAt || agent.created_at;
    if (!when) return null;
    try {
      const d = new Date(when);
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return null; }
  })();

  return (
    <div className="agent-card-modern agent-card-v2">
      <div className="agent-image" style={{ backgroundImage: `url(${photo})` }}>
        <div className="agent-overlay">
          <div className="agent-name-wrap">
            <h3 className="agent-name">{name}</h3>
            {agent?.verified && <FaCheckCircle className="agent-verified" title="Vérifié" />}
          </div>
          <div className="agent-sub">{title}{location ? ` • ${location}` : ''}</div>
        </div>
        <div className="agent-avatar" style={{ backgroundImage: `url(${photo})` }} aria-hidden="true" />
      </div>

      <div className="agent-info">
        <p className="agent-bio">{agent?.bio || agent?.description || 'Agent dédié pour vous accompagner dans votre recherche. Réponse rapide et conseils personnalisés.'}</p>

        <div className="agent-stats-grid">
          <div className="stat-item"><div className="stat-icon"><FaListAlt /></div><div className="stat-value">{agent.listings || agent.annonces || 0} annonces</div></div>
          <div className="stat-item"><div className="stat-icon"><FaUsers /></div><div className="stat-value">{agent.followers || agent.abonnes || 0} abonnés</div></div>
          <div className="stat-item"><div className="stat-icon"><FaClock /></div><div className="stat-value">Actif {agent.lastActive || agent.lastSeenText || 'il y a 1 j'}</div></div>
        </div>

        {formattedMemberSince && (
          <div className="member-badge"><FaUserPlus style={{ marginRight: 8 }} /> Membre depuis Le {formattedMemberSince}</div>
        )}

        <div className="">
          <div className="d-flex flex-column gap-2" >
            {/* <div className="d-flex flex-row gap-2 flex-wrap">
              <div className="" title="WhatsApp" onClick={handleWhatsApp}><FaWhatsapp color='white' /></div>
              <div className="" title="Message" onClick={handleMessageClick}><FaEnvelope color='white' /></div>
              <div className="" title="Facebook Messenger" onClick={() => { openMessengerForAgent(agent.id || agent._id || agent.agentId); }}><FaFacebook color='white' /></div>  
            </div> */}

            <div className="btn-agent" title="WhatsApp" onClick={handleWhatsApp} style={{background: 'azure', color :'cadetblue' }}><FaEnvelope color='cadetblue' />WhatsApp</div>
            <div className="btn-agent" title="Message" onClick={handleMessageClick} style={{background: 'azure', color :'cadetblue' }}><FaEnvelope color='cadetblue' />Message</div>

            <div className="btn-agent" title="Faire une offre" onClick={() => setShowBooking(true)}><FaRegMoneyBillAlt color='white' />Faire une offre</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProfileCard;
