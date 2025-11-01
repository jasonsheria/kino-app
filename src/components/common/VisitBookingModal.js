import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './VisitBookingModal.css';
import { showToast } from './ToastManager';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

const VisitBookingModal = ({ open, onClose, onSubmit, onSuccess, property, agent }) => {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '09:00',
    paymentMethod: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const VISIT_FEE = 15;
  
  // Swipe handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientY);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isDownSwipe = distance < -50;
    if (isDownSwipe) {
      onClose();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // lock body scroll while modal is open (class-based, shared helper)
  useEffect(() => {
    if (open) {
      lockScroll();
      return () => { unlockScroll(); };
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  const handleDateTimeSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePaymentMethodSelect = (method) => {
    setBookingData(prev => ({ ...prev, paymentMethod: method }));
    setStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Mock payment processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  // notify parent with the raw booking data (legacy prop)
  onSubmit?.(bookingData);
  // new standardized success callback to update reservation state
      console.log('VisitBookingModal: payment success, calling onSuccess with', bookingData);
      onSuccess?.(bookingData);
      // dispatch a global event so other components (other cards) can react
      try {
        const propId = property?.id ?? bookingData.propertyId ?? null;
        if (propId != null) {
          // persist to localStorage (stringified ids)
          try {
            const list = JSON.parse(localStorage.getItem('reserved_properties') || '[]').map(String);
            if (!list.includes(String(propId))) {
              list.push(String(propId));
              localStorage.setItem('reserved_properties', JSON.stringify(list));
            }
          } catch (err) { console.warn('Could not persist reservation in localStorage', err); }
          // dispatch event
          window.dispatchEvent(new CustomEvent('property-reserved', { detail: { propertyId: String(propId) } }));
          console.log('VisitBookingModal: dispatched property-reserved for', propId);
        }
      } catch (e) {
        console.warn('VisitBookingModal: failed to dispatch property-reserved event', e);
      }
      // send reservation to server endpoint (best-effort)
      try {
        // Prefer explicit backend URL from environment, fallback to relative path
        const base = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/$/, '');
        const url = base ? `${base}/api/reservations` : '/api/reservations';
        // Include Authorization header if a token is available in localStorage
        const token = localStorage.getItem('ndaku_auth_token') || localStorage.getItem('token') || null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ propertyId: property?.id, date: bookingData.date, time: bookingData.time, phone: bookingData.phoneNumber, amount: VISIT_FEE })
        });
        if (resp.ok) {
          const created = await resp.json();
          showToast('Réservation enregistrée', 'success');
          // Fetch latest reservations for this user to update local UI/state
          try {
            const listUrl = base ? `${base}/api/reservations` : '/api/reservations';
            const listResp = await fetch(listUrl, { headers });
            if (listResp.ok) {
              const reservations = await listResp.json();
              // Notify parent with server-created reservation and refreshed list
              onSuccess?.({ bookingData, createdReservation: created, reservations });
            } else {
              // Could not fetch list; still notify parent with created reservation
              onSuccess?.({ bookingData, createdReservation: created, reservations: null });
            }
          } catch (e) {
            console.warn('Failed to fetch reservations after create', e);
            onSuccess?.({ bookingData, createdReservation: created, reservations: null });
          }
        } else if (resp.status === 401 || resp.status === 403) {
          // Not authenticated — fall back to local persistence but inform the user
          showToast('Réservation enregistrée localement (connexion requise pour sauvegarde serveur)', 'warn');
          onSuccess?.({ bookingData, createdReservation: null, reservations: null });
        } else {
          showToast('Réservation enregistrée localement (serveur non disponible)', 'warn');
          onSuccess?.({ bookingData, createdReservation: null, reservations: null });
        }
      } catch (e) {
        console.warn('Reservation server post failed', e);
        showToast('Réservation enregistrée localement (erreur réseau)', 'warn');
      }
      // close modal after notifying parent
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${hour}:00`);
      if (hour !== 17) slots.push(`${hour}:30`);
    }
    return slots;
  };

  const modalContent = (
    <div className="visit-booking-modal-bg" 
      onMouseDown={(e) => { if (e.target.classList.contains('visit-booking-modal-bg')) onClose(); }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="visit-booking-modal fullpage" aria-modal="true" role="dialog">
        <button className="modal-close-btn" onClick={onClose} aria-label="Fermer">&times;</button>

        <div className="modal-header">
          <h2>Réserver une visite</h2>
          <div className="steps-indicator" data-step={step}>
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Date & Heure</div>
            </div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Mode de paiement</div>
            </div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Confirmation</div>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <form onSubmit={handleDateTimeSubmit} className="datetime-form">
              <div className="input-group">
                <label htmlFor="date">Date de visite</label>
                <input
                  type="date"
                  id="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingData.date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <label htmlFor="time">Heure de visite</label>
                <select
                  id="time"
                  required
                  value={bookingData.time}
                  onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                >
                  {generateTimeSlots().map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                className="submit-btn"
              >
                Continuer
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="payment-method-selection">
              <div className="price-display">
                <div className="amount">${VISIT_FEE}</div>
                <div className="description">Frais de visite</div>
              </div>

              <div className="payment-methods">
                <button 
                  className={`payment-method-btn ${bookingData.paymentMethod==='airtel' ? 'selected' : ''}`}
                  onClick={() => handlePaymentMethodSelect('airtel')}
                  type="button"
                >
                  <img src="/img/payment/airtel-money.svg" alt="Airtel Money" />
                  <span>Airtel Money</span>
                </button>

                <button 
                  className={`payment-method-btn ${bookingData.paymentMethod==='orange' ? 'selected' : ''}`}
                  onClick={() => handlePaymentMethodSelect('orange')}
                  type="button"
                >
                  <img src="/img/payment/orange-money.svg" alt="Orange Money" />
                  <span>Orange Money</span>
                </button>

                <button 
                  className={`payment-method-btn ${bookingData.paymentMethod==='vodacom' ? 'selected' : ''}`}
                  onClick={() => handlePaymentMethodSelect('vodacom')}
                  type="button"
                >
                  <img src="/img/payment/mpesa.svg" alt="M-Pesa Vodacom" />
                  <span>M-Pesa</span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="confirmation-form">
              <div className="booking-summary">
                <div className="summary-item">
                  <span>Date:</span>
                  <strong>{new Date(bookingData.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</strong>
                </div>
                <div className="summary-item">
                  <span>Heure:</span>
                  <strong>{bookingData.time}</strong>
                </div>
                <div className="summary-item">
                  <span>Montant:</span>
                  <strong>${VISIT_FEE}</strong>
                </div>
                <div className="summary-item">
                  <span>Paiement via:</span>
                  <strong>{bookingData.paymentMethod === 'airtel' ? 'Airtel Money' : 
                          bookingData.paymentMethod === 'orange' ? 'Orange Money' : 'M-Pesa'}</strong>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="phone">Votre numéro {bookingData.paymentMethod}</label>
                <input
                  type="tel"
                  id="phone"
                  required
                  pattern="[0-9]*"
                  minLength="9"
                  maxLength="12"
                  placeholder="Entrez votre numéro"
                  value={bookingData.phoneNumber}
                  onChange={(e) => setBookingData(prev => ({ 
                    ...prev, 
                    phoneNumber: e.target.value.replace(/[^\d]/g, '')
                  }))}
                />
              </div>

              <button 
                type="submit" 
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading || !bookingData.phoneNumber}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Traitement...
                  </>
                ) : (
                  'Confirmer et payer'
                )}
              </button>
            </form>
          )}
        </div>

        <div className="secure-notice">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.5 1.1 2.5 2.5V13c.6 0 1 .4 1 1v4c0 .6-.4 1-1 1h-5c-.6 0-1-.4-1-1v-4c0-.6.4-1 1-1V9.5C9.5 8.1 10.6 7 12 7zm0 2c-.3 0-.5.2-.5.5V13h1V9.5c0-.3-.2-.5-.5-.5z"/>
          </svg>
          Paiement sécurisé via Frespay
        </div>
      </div>
    </div>
  );

  // render into portal at document.body so it's page-level
  return ReactDOM.createPortal(modalContent, document.body);
};

export default VisitBookingModal;
