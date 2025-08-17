import React from 'react';
import Modal from './Modal';

export default function ConfirmModal({open, title, message, onConfirm, onCancel}){
  return (
    <Modal open={open} onClose={onCancel}>
      <div style={{maxWidth:520}}>
        <h5>{title || 'Confirmer'}</h5>
        <p style={{color:'#374151'}}>{message}</p>
        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:16}}>
          <button className="btn btn-outline-secondary" onClick={onCancel}>Annuler</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </Modal>
  );
}
