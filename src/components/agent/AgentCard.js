import React, { useState } from 'react';
import { 
  FaCheckCircle, 
  FaStar, 
  FaRegStar, 
  FaUserShield, 
  FaMapMarkerAlt, 
  FaWhatsapp, 
  FaFacebook, 
  FaLinkedin,
  FaTwitter,
  FaPhoneAlt, 
  FaEnvelope,
  FaComments,
  FaFacebookMessenger 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Badge,
  Box,
  Chip,
  IconButton,
} from '@mui/material';

// Modal Component pour les options de contact WhatsApp
const ContactOptionsModal = ({ isOpen, onClose, agent, onWhatsApp, onCall, onMessage }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="modal-backdrop"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="modal-content"
      >
        <div className="modal-header">
          <h3>Contacter {agent.name}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>

        <div className="modal-options">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onWhatsApp}
            className="option-button whatsapp"
          >
            <FaWhatsapp />
            <span>Message WhatsApp</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCall}
            className="option-button call"
          >
            <FaPhoneAlt />
            <span>Appeler</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onMessage}
            className="option-button message"
          >
            <FaComments />
            <span>Message instantané</span>
          </motion.button>
        </div>
      </motion.div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(8px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h3 {
          cursor: pointer;
          padding: 0;
          color: #718096;
          transition: all 0.2s ease;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .close-button:hover {
          color: #1a202c;
          background: rgba(0, 0, 0, 0.05);
        }

        .modal-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .option-button {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 500;
          width: 100%;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .option-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-100%) rotate(45deg);
          transition: transform 0.5s ease;
        }

        .option-button:hover::before {
          transform: translateX(100%) rotate(45deg);
        }

        .option-button.whatsapp {
          background: linear-gradient(135deg, #25D366, #128C7E);
          color: white;
        }

        .option-button.call {
          background: linear-gradient(135deg, var(--ndaku-primary), var(--ndaku-primary-dark, #2c5282));
          color: white;
        }

        .option-button.message {
          background: linear-gradient(135deg, #0084ff, #0099ff);
          color: white;
        }

        .option-button svg {
          font-size: 1.5rem;
        }
      `}</style>
    </motion.div>
  );
};

const AgentCard = ({ agent }) => {
  // normalized helpers
  const phone = agent.telephone || agent.phone || agent.whatsapp || '';
  const email = agent.email || agent.mail || '';

  const fireCallEvent = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: 'support', meta: { agentId: agent.id, agentName: agent.name } } }));
  };

  const openWhatsApp = (e) => {
    e.stopPropagation();
    if (!phone) return window.alert('Numéro WhatsApp non disponible');
    const digits = String(phone).replace(/[^0-9+]/g, '');
    window.open(`https://wa.me/${digits}`, '_blank');
  };

  const openEmail = (e) => { e.stopPropagation(); if (!email) return window.alert('Email non disponible'); window.location.href = `mailto:${email}`; };

  const openMessenger = (e) => { e.stopPropagation(); if (agent.messenger) return window.open(agent.messenger, '_blank'); if (agent.facebook) return window.open(agent.facebook.startsWith('http') ? agent.facebook : `https://m.me/${agent.facebook}`, '_blank'); window.alert('Messenger/ Facebook non disponible'); };

  const openSocial = (url, fallback) => {
    return (e) => { e.stopPropagation(); if (!url && !fallback) return window.alert('Lien non disponible'); const final = url || (String(fallback).startsWith('http') ? fallback : `https://${fallback}`); window.open(final, '_blank'); };
  };

  const rating = Math.min(5, Math.max(0, Number(agent.rating || agent.stars || 4)));
  const shortBio = agent.bio || agent.description || agent.excerpt || '';

  return (
    <motion.div
      className="agent-card"
      initial={{ opacity: 0, scale: 0.98 }}
      whileHover={{ scale: 1.02, y: -4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
  <Card sx={{ width: '100%', maxWidth: 420, boxShadow: 4, borderRadius: 3, overflow: 'hidden', margin: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', padding: 2, background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.4))' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar src={agent.image || agent.photo} alt={agent.name} sx={{ width: 64, height: 64, boxShadow: 2 }} />
            {agent.isCertified && (
              <Box sx={{ position: 'absolute', right: -4, bottom: -4, background: 'linear-gradient(135deg,#667eea,#667eea)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', color: 'white' }} title="Agent certifié">
                <FaCheckCircle size={14} />
              </Box>
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>{agent.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>{agent.role || agent.title || 'Agent immobilier'}</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FaMapMarkerAlt style={{ color: '#6b7280' }} />
                <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.address || agent.commune || agent.ville || 'Kinshasa'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* stars */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: i < Math.round(rating) ? '#f59e0b' : '#e5e7eb', fontSize: 12 }}>{i < Math.round(rating) ? <FaStar /> : <FaRegStar />}</span>
                ))}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{rating.toFixed(1)}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ pt: 1, pb: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ minHeight: 42, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{shortBio || 'Agent disponible pour visites et conseils. Spécialiste local.'}</Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            <Chip label={`Expérience ${agent.experience ?? 0} ans`} size="small" color="success" />
            <Chip label={`Affaires ${agent.dealsCount ?? agent.deals ?? 0}`} size="small" />
            <Chip label={agent.status ?? 'Inconnu'} size="small" color={agent.status === 'Actif' ? 'success' : 'default'} />
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', padding: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={fireCallEvent} color="success" aria-label={`Appeler ${agent.name}`} sx={{ bgcolor: 'background.paper', boxShadow: 2 }}>
              <FaPhoneAlt />
            </IconButton>
            <IconButton onClick={openWhatsApp} color="primary" aria-label={`WhatsApp ${agent.name}`} sx={{ bgcolor: 'background.paper', boxShadow: 2 }}>
              <FaWhatsapp />
            </IconButton>
            <IconButton onClick={openMessenger} color="info" aria-label={`Messenger ${agent.name}`} sx={{ bgcolor: 'background.paper', boxShadow: 2 }}>
              <FaFacebookMessenger />
            </IconButton>
          </Box>

          <Box>
            <motion.div whileHover={{ scale: 1.03 }}>
              <button className="btn btn-sm btn-outline-primary" onClick={(e) => { e.stopPropagation(); window.location.href = `/agents/${agent.id}`; }} aria-label={`Voir le profil de ${agent.name}`}>
                Voir profil
              </button>
            </motion.div>
          </Box>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default AgentCard;
