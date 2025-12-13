import React from 'react';
import { FaPhone, FaWhatsapp, FaFacebook, FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import './AgentProfileCard.css';

/**
 * AgentProfileCard - completely new, modern design
 * - Large full-bleed avatar
 * - Name overlay on image
 * - Short bio and two primary actions (Message, Call)
 */
const AgentProfileCard = ({ agent, onContactClick = () => {} }) => {
  if (!agent) return null;

  const name = agent?.prenom || agent?.name || 'Agent';
  const title = agent?.titre || agent?.title || 'Agent immobilier';
  const location = agent?.location || agent?.city || '';
  const photo = (agent?.photo || agent?.image || agent?.avatar)
    ? (agent?.photo || agent?.image || agent?.avatar)
    : require('../../img/property-1.jpg');

  const openMessengerForAgent = (agentId) => {
    try {
      // legacy event that primary messenger listens to
      window.dispatchEvent(new CustomEvent('ndaku-open-messenger', { detail: { agentId } }));
    } catch (e) {
      // fallback: if the messenger expects request event, send a generic one too
      try { window.dispatchEvent(new CustomEvent('ndaku-request-open-messenger', { detail: { sourceId: 'agent-card', agentId } })); } catch(e){}
    }
  };

  const handleMessageClick = () => {
    openMessengerForAgent(agent.id || agent._id || agent.agentId);
    onContactClick('message');
  };

  const normalizePhone = (raw) => {
    if (!raw) return null;
    // remove non-digits and plus
    const digits = String(raw).replace(/[^+0-9]/g, '');
    return digits.replace(/^\+/, '');
  };

  const handleWhatsApp = () => {
    const phone = agent.whatsapp || agent.phone || agent.telephone || agent.tel;
    const normalized = normalizePhone(phone);
    if (!normalized) {
      // fallback: open messenger
      handleMessageClick();
      return;
    }
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

  return (
    <div className="agent-card-modern">
      <div className="agent-image" style={{ backgroundImage: `url(${photo})` }}>
        <div className="agent-overlay">
          <div className="agent-name-wrap">
            <h3 className="agent-name">{name}</h3>
            {agent?.verified && <FaCheckCircle className="agent-verified" title="Vérifié" />}
          </div>
          <div className="agent-sub">{title}{location ? ` • ${location}` : ''}</div>
        </div>
      </div>

      <div className="agent-info">
        <p className="agent-bio">{agent?.bio || agent?.description || 'Agent dédié pour vous accompagner dans votre recherche. Réponse rapide et conseils personnalisés.'}</p>

        <div className="agent-actions">
          <button className="icon-btn btn-primary" onClick={handleMessageClick} aria-label="Messagerie">
            <FaEnvelope />
          </button>
          <div className="action-icons">
            { (agent?.whatsapp || agent?.phone) && (
              <button className="icon-btn btn-whatsapp" onClick={handleWhatsApp} aria-label="WhatsApp">
                <FaWhatsapp />
              </button>
            ) }
            { (agent?.phone) && (
              <button className="icon-btn btn-phone" onClick={handlePhone} aria-label="Appeler">
                <FaPhone />
              </button>
            ) }
            { agent?.email && (
              <button className="icon-btn btn-email" onClick={handleEmail} aria-label="Email">
                <FaEnvelope />
              </button>
            ) }
            { agent?.facebook && (
              <a className="icon-btn btn-facebook" href={agent.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                <FaFacebook />
              </a>
            ) }
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProfileCard;
