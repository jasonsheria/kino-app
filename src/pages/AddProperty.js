import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerLayout from '../components/owner/OwnerLayout';

const AddProperty = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Appartement');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const submit = (e) => {
    e && e.preventDefault();
    const next = JSON.parse(localStorage.getItem('owner_props')||'[]');
    const prop = { id: Date.now(), title, type, price: Number(price||0), image };
    next.unshift(prop);
    localStorage.setItem('owner_props', JSON.stringify(next));
    navigate('/owner/properties');
  };
  return (
    <OwnerLayout>
      <div className="container py-4">
        <h4>{'Ajouter un bien'}</h4>
        <form onSubmit={submit} style={{maxWidth:720}}>
          <div className="mb-3">
            <label className="form-label">Titre</label>
            <input className="form-control" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Type</label>
            <select className="form-select" value={type} onChange={e=>setType(e.target.value)}>
              <option>Appartement</option>
              <option>Maison</option>
              <option>Terrain</option>
              <option>Voiture</option>
              <option>Salle de fête</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Prix (USD)</label>
            <input type="number" className="form-control" value={price} onChange={e=>setPrice(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Image URL (optionnel)</label>
            <input className="form-control" value={image} onChange={e=>setImage(e.target.value)} />
          </div>
          <div className="d-flex gap-2">
            <button className="btn owner-btn-primary">Enregistrer</button>
            <button type="button" className="btn btn-outline-secondary" onClick={()=>navigate('/owner/properties')}>Annuler</button>
          </div>
        </form>
      </div>
    </OwnerLayout>
  );
};

export default AddProperty;
