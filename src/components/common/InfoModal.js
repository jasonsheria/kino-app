import React from 'react';
import Modal from './Modal';

export default function InfoModal({open, title, message, onClose}){
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{maxWidth:520}}>
        <h5>{title || 'Info'}</h5>
        <p style={{color:'#374151'}}>{message}</p>
        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:16}}>
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </Modal>
  );
}
