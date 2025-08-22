import React from 'react';
import Navbar from '../components/common/Navbar';
import PropertyCard from '../components/property/PropertyCard';
import PropertyFilterBar from '../components/property/PropertyFilterBar';
import ScrollReveal from '../components/common/ScrollReveal';
import MapView from '../components/property/MapView';
import { properties } from '../data/fakedata';
import FooterPro from '../components/common/Footer';

const SalleFete = () => {
  const salles = properties.filter(p => p.type && p.type.toLowerCase().includes('salle'));
  const [filtered, setFiltered] = React.useState(salles);

  // Haversine distance (km)
  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = v => v * Math.PI / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const applyFilters = (f) => {
    let out = salles.slice();
    if(f.commune && f.commune !== 'Toutes') out = out.filter(p => (p.address||'').includes(f.commune));
    if(f.priceMin) out = out.filter(p => p.price >= Number(f.priceMin));
    if(f.priceMax) out = out.filter(p => p.price <= Number(f.priceMax));
    if(f.scoreMin) out = out.filter(p => (p.score||0) >= Number(f.scoreMin));

    // Proximity: use user's location if available, else use Kinshasa center or first item's geoloc
    if(f.proximityKm) {
      let ref = null;
      try{
        const user = JSON.parse(localStorage.getItem('ndaku_user_location'));
        if(user && user.lat && user.lng) ref = user;
      }catch(e){}
      if(!ref) {
        const first = salles.find(s => s.geoloc);
        ref = first ? first.geoloc : { lat: -4.325, lng: 15.322 };
      }
      const maxKm = Number(f.proximityKm);
      out = out.filter(p => {
        if(!p.geoloc) return false;
        const d = haversineKm(ref.lat, ref.lng, p.geoloc.lat, p.geoloc.lng);
        return d <= maxKm;
      });
    }

    if(f.sort === 'price_asc') out.sort((a,b)=>a.price-b.price);
    if(f.sort === 'price_desc') out.sort((a,b)=>b.price-a.price);
    setFiltered(out);
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{marginTop : '13vh'}}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="mb-1">Salles de fête & Événements</h1>
            <p className="text-muted mb-0">Salles adaptées pour mariages, conférences, célébrations et plus.</p>
          </div>
          <div>
            <span className="badge bg-danger">Remise exceptionnelle : -30%</span>
          </div>
        </div>

        <PropertyFilterBar items={salles} onChange={applyFilters} />
        <div className="row g-3">
          {filtered.slice(0,6).map(p => (
            <ScrollReveal key={p.id} className="col-12 col-md-6 col-lg-4">
              <PropertyCard property={p} />
            </ScrollReveal>
          ))}
        </div>

        {/* Article promotionnel mis en avant - enlarged */}
        <div className="card mt-4 shadow-lg" style={{borderRadius:12, overflow:'hidden'}}>
          <div className="row g-0 align-items-center">
            <div className="col-12 col-md-6">
              <img src={require('../img/salles/salle_gombe.jpg')} alt="Promo salle" style={{width:'100%', height:260, objectFit:'cover'}} />
            </div>
            <div className="col-12 col-md-6 p-4">
              <h2 className="mb-2" style={{color:'#d7263d', fontWeight:900}}>Promotion Salle de fête — -30%</h2>
              <p className="mb-3 text-muted">Réduction exceptionnelle sur les réservations de salle pour mariages et événements. Offre limitée — réservez dès maintenant.</p>
              <div className="d-flex gap-3">
                <a className="btn btn-lg btn-success" href="/contact">Réserver maintenant</a>
                <a className="btn btn-outline-secondary" href="/salle#details">Voir les détails</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h4 className="mb-3">Carte des salles</h4>
          <MapView />
        </div>
      </div>
       {/* Call to action */}
                  <div className="bg-success text-white text-center py-5">
                      <div className="container">
                          <h5 className="fw-bold mb-3 fs-3">Vous êtes agent ou propriétaire ?</h5>
                          <p className="mb-4 fs-5">Inscrivez-vous gratuitement, publiez vos biens et bénéficiez d’une visibilité maximale sur Ndaku.</p>
                          <a href="#" className="btn btn-outline-light btn-lg px-4 py-2 fw-bold rounded-pill" style={{ fontSize: '1.2rem', minWidth: 180 }}>Devenir agent</a>
                      </div>
                  </div>
      
                  {/* Footer pro et interactif */}
                 
      
                  {/* Dev-only debug controls (visible on localhost or with ?ndaku_debug=1) */}
                 
      
                  <FooterPro />
    </>
  );
};

export default SalleFete;
