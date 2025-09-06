import React, { useState } from 'react';
import { 
  FaCheckCircle, 
  FaStar, 
  FaRegStar, 
  FaUserShield, 
  FaMapMarkerAlt, 
  FaWhatsapp, 
  FaFacebook, 
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
  const handleCall = (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    window.dispatchEvent(
      new CustomEvent('ndaku-call', {
        detail: {
          to: 'support',
          meta: {
            agentId: agent.id,
            agentName: agent.name,
          },
        },
      })
    );
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    window.open(`https://wa.me/${agent.phone}`, '_blank');
  };

  const handleEmail = (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    window.location.href = `mailto:${agent.email}`;
  };

  const handleMessenger = (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    window.open(agent.messenger || `https://m.me/${agent.facebook}`, '_blank');
  };

  return (
    <motion.div
      className="agent-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ maxWidth: 400, boxShadow: 3, borderRadius: 2, overflow: 'hidden', margin: 'auto' }}>
        <CardHeader
          avatar={
            <Badge
              color="primary"
              badgeContent={agent.isCertified ? 'Certifié' : null}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Avatar src={agent.photo} alt={agent.name} sx={{ width: 56, height: 56 }} />
            </Badge>
          }
          title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>{agent.name}</Typography>}
          subheader={<Typography variant="body2" color="textSecondary">{agent.role}</Typography>}
        />
        <CardContent>
          <Box display="flex" flexDirection="column" gap={1}>
            <Chip label={`Expérience : ${agent.experience} ans`} color="success" variant="outlined" />
            <Chip label={`Affaires réalisées : ${agent.dealsCount}`} color="primary" variant="outlined" />
            <Chip label={`Statut : ${agent.status}`} color={agent.status === 'Actif' ? 'success' : 'default'} variant="outlined" />
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-around', padding: 2 }}>
          <IconButton
            color="success"
            onClick={handleCall}
            sx={{ boxShadow: 2, '&:hover': { boxShadow: 4 } }}
          >
            <FaPhoneAlt />
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleWhatsApp}
            sx={{ boxShadow: 2, '&:hover': { boxShadow: 4 } }}
          >
            <FaWhatsapp />
          </IconButton>
          <IconButton
            color="info"
            onClick={handleMessenger}
            sx={{ boxShadow: 2, '&:hover': { boxShadow: 4 } }}
          >
            <FaFacebookMessenger />
          </IconButton>
          <IconButton
            color="warning"
            onClick={handleEmail}
            sx={{ boxShadow: 2, '&:hover': { boxShadow: 4 } }}
          >
            <FaEnvelope />
          </IconButton>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default AgentCard;
