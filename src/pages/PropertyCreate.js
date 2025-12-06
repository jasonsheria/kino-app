import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaImage, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import '../styles/property.css';

const propertyTypes = [
  { id: 'house', label: 'Maison' },
  { id: 'apartment', label: 'Appartement' },
  { id: 'land', label: 'Terrain' },
  { id: 'commercial', label: 'Local commercial' },
  { id: 'party', label: 'Salle de fête' }
];

export default function PropertyCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Helper to format various error shapes into strings for rendering
  const formatError = (errOrMessage) => {
    if (!errOrMessage) return null;
    if (typeof errOrMessage === 'string') return errOrMessage;
    if (Array.isArray(errOrMessage)) return errOrMessage.join(', ');
    if (typeof errOrMessage === 'object') {
      if (errOrMessage.message) {
        if (typeof errOrMessage.message === 'string') return errOrMessage.message;
        if (Array.isArray(errOrMessage.message)) return errOrMessage.message.join(', ');
        try { return JSON.stringify(errOrMessage.message); } catch (e) {}
      }
      try { return JSON.stringify(errOrMessage); } catch (e) { return String(errOrMessage); }
    }
    return String(errOrMessage);
  };

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [features, setFeatures] = useState({
    bedrooms: '',
    bathrooms: '',
    area: '',
    parking: false,
    furnished: false
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validation
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Certains fichiers ne sont pas des images valides');
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024); // 5MB limit
    if (oversizedFiles.length > 0) {
      setError('Certaines images dépassent 5 Mo');
      return;
    }

    // Preview
    const newImages = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setImages(prev => [...prev, ...newImages]);
    setImageFiles(prev => [...prev, ...files]);
    setError('');
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validation
    if (!title || !description || !propertyType || !price || !address || !city) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }

    if (imageFiles.length === 0) {
      setError('Veuillez ajouter au moins une image');
      setLoading(false);
      return;
    }

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', propertyType);
      formData.append('price', price);
      formData.append('address', address);
      formData.append('city', city);
      formData.append('features', JSON.stringify(features));
      
      // Append images
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      // Send to backend
      const response = await axios.post('/api/properties', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 2000);

    } catch (err) {
      setError(formatError(err.response?.data?.message) || formatError(err.response?.data) || formatError(err.message) || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Ajouter une propriété</h2>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/owner/dashboard')}
                >
                  Retour
                </button>
              </div>

              <form onSubmit={handleSubmit} className="property-form">
                {/* Basic Info */}
                <div className="mb-4">
                  <h5 className="mb-3">Informations de base</h5>
                  
                  <div className="mb-3">
                    <label className="form-label">Titre de l'annonce*</label>
                    <input
                      type="text"
                      className="form-control"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Belle maison moderne à Gombe"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Type de bien*</label>
                    <select 
                      className="form-select"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                    >
                      <option value="">Sélectionnez un type</option>
                      {propertyTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description*</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez votre article en détail..."
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Prix (USD)*</label>
                        <input
                          type="number"
                          className="form-control"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Ex: 1000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-4">
                  <h5 className="mb-3">Localisation</h5>
                  
                  <div className="mb-3">
                    <label className="form-label">Adresse complète*</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaMapMarkerAlt />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Numéro, rue"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Ville*</label>
                    <input
                      type="text"
                      className="form-control"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Kinshasa"
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <h5 className="mb-3">Caractéristiques</h5>
                  
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Chambres</label>
                        <input
                          type="number"
                          className="form-control"
                          value={features.bedrooms}
                          onChange={(e) => setFeatures({...features, bedrooms: e.target.value})}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Salles de bain</label>
                        <input
                          type="number"
                          className="form-control"
                          value={features.bathrooms}
                          onChange={(e) => setFeatures({...features, bathrooms: e.target.value})}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Surface (m²)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={features.area}
                          onChange={(e) => setFeatures({...features, area: e.target.value})}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row mt-2">
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="hasParking"
                          checked={features.parking}
                          onChange={(e) => setFeatures({...features, parking: e.target.checked})}
                        />
                        <label className="form-check-label" htmlFor="hasParking">
                          Parking disponible
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isFurnished"
                          checked={features.furnished}
                          onChange={(e) => setFeatures({...features, furnished: e.target.checked})}
                        />
                        <label className="form-check-label" htmlFor="isFurnished">
                          Meublé
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="mb-4">
                  <h5 className="mb-3">Photos</h5>
                  
                  <div className="image-upload-container">
                    <div 
                      className="image-upload-area"
                      onClick={() => document.getElementById('image-input').click()}
                    >
                      <input
                        type="file"
                        id="image-input"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <FaUpload size={24} className="mb-2" />
                      <p className="mb-1">Cliquez ou déposez vos images ici</p>
                      <small className="text-muted">PNG, JPG - Max 5 Mo par image</small>
                    </div>

                    {images.length > 0 && (
                      <div className="image-preview-container mt-3">
                        {images.map((image, index) => (
                          <div key={index} className="image-preview-item">
                            <img src={image.url} alt={`Preview ${index + 1}`} />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removeImage(index)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger mb-3" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success mb-3" role="alert">
                    Propriété ajoutée avec succès ! Redirection...
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/owner/dashboard')}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Création en cours...
                      </>
                    ) : (
                      'Créer la propriété'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
