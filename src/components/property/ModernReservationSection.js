import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaPhone, FaWhatsapp, FaCheckCircle } from 'react-icons/fa';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

/**
 * ModernReservationSection - Composant de réservation moderne avec design doux
 */
export default function ModernReservationSection({ 
  property, 
  isReserved, 
  onReservationClick, 
  onContactClick 
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null); // 'confirm', 'reserved'

  const handleReservation = () => {
    setDialogType('confirm');
    setOpenDialog(true);
  };

  const handleConfirmReservation = () => {
    onReservationClick?.();
    setDialogType('reserved');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType(null);
  };

  return (
    <>
      <motion.div
        className="reservation-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="reservation-header">
          <div>
            <h3>Réservation & Contact</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.95rem' }}>
              {isReserved ? '✓ Ce bien est déjà réservé' : 'Intéressé par ce bien ?'}
            </p>
          </div>
          {isReserved && (
            <motion.div
              className="reservation-status reserved"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <FaCheckCircle /> Réservé
            </motion.div>
          )}
        </div>

        <div className="reservation-buttons">
          <motion.button
            className={`btn-modern ${isReserved ? 'btn-disabled-modern' : 'btn-primary-modern'}`}
            onClick={handleReservation}
            disabled={isReserved}
            whileHover={!isReserved ? { scale: 1.02 } : {}}
            whileTap={!isReserved ? { scale: 0.98 } : {}}
          >
            <FaCalendarAlt /> {isReserved ? 'Réservé' : 'Réserver Maintenant'}
          </motion.button>

          <motion.button
            className="btn-modern btn-secondary-modern"
            onClick={() => onContactClick?.()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaPhone /> Contacter l'agent
          </motion.button>

          <motion.button
            className="btn-modern btn-secondary-modern"
            onClick={() => onContactClick?.('whatsapp')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ gridColumn: '2 / 3' }}
          >
            <FaWhatsapp /> WhatsApp
          </motion.button>
        </div>
      </motion.div>

      {/* Dialog de confirmation */}
      <Dialog
        open={openDialog && dialogType === 'confirm'}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogTitle
          style={{
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, rgba(0, 205, 242, 0.05) 0%, transparent 100%)',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#1f2937',
          }}
        >
          Confirmer la Réservation
        </DialogTitle>
        <DialogContent style={{ padding: '2rem' }}>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Êtes-vous sûr de vouloir réserver ce bien ?
            </p>
            <div
              style={{
                background: '#f3f4f6',
                padding: '1.2rem',
                borderRadius: '12px',
                borderLeft: '4px solid #00cdf2',
              }}
            >
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#1f2937' }}>
                {property?.name || property?.title || 'Propriété'}
              </p>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>
                {property?.address || 'Adresse non spécifiée'}
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogActions style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <Button
            onClick={handleCloseDialog}
            style={{
              color: '#6b7280',
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmReservation}
            variant="contained"
            style={{
              background: 'linear-gradient(135deg, #00cdf2 0%, #0095d4 100%)',
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0, 205, 242, 0.3)',
            }}
          >
            Confirmer la Réservation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de succès */}
      <Dialog
        open={openDialog && dialogType === 'reserved'}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogTitle
          style={{
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <FaCheckCircle style={{ color: '#10b981' }} /> Réservation Confirmée
        </DialogTitle>
        <DialogContent style={{ padding: '2rem' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <p style={{ color: '#6b7280', lineHeight: '1.6', textAlign: 'center' }}>
              Votre réservation a été confirmée avec succès ! Un agent vous contactera bientôt pour plus de détails.
            </p>
          </motion.div>
        </DialogContent>
        <DialogActions style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            style={{
              background: '#10b981',
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              width: '100%',
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
