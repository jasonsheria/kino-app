import React from 'react';
import { FaWhatsapp, FaPhone, FaComments } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ContactOptionsModal = ({ agent, open, onClose, onCall, onWhatsApp, onMessage }) => {
  if (!open) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="contact-options-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="contact-options-modal"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="options-container">
          <motion.button
            onClick={onWhatsApp}
            className="option-btn whatsapp"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <FaWhatsapp size={24} />
            <span>Message WhatsApp</span>
          </motion.button>

          <motion.button
            onClick={onCall}
            className="option-btn call"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <FaPhone size={24} />
            <span>Appeler</span>
          </motion.button>

          <motion.button
            className="option-btn message"
            onClick={onMessage}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <FaComments size={24} />
            <span>Message instantané</span>
          </motion.button>
        </div>
      </motion.div>

      <style jsx>{`
        .contact-options-modal-backdrop {
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
          backdrop-filter: blur(5px);
        }

        .contact-options-modal {
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a202c;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          color: #718096;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #1a202c;
        }

        .options-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .option-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: none;
          border-radius: 8px;
          background: #f7fafc;
          color: #4a5568;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .option-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .option-btn.whatsapp {
          background: #25D366;
          color: white;
        }

        .option-btn.call {
          background: #4299e1;
          color: white;
        }

        .option-btn.message {
          background: var(--ndaku-primary);
          color: white;
        }

        .option-btn span {
          font-size: 1rem;
          font-weight: 500;
        }
      `}</style>
    </motion.div>
  );
};

export default ContactOptionsModal;
