import React from 'react';
import Navbar from '../components/common/Navbar';
import PropertyCard from '../components/property/PropertyCard';
import PropertyFilterBar from '../components/property/PropertyFilterBar';
import ScrollReveal from '../components/common/ScrollReveal';
import MapView from '../components/property/MapView';
import { properties } from '../data/fakedata';
import '../pages/HomeSection.css';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import FooterPro from '../components/common/Footer';

const Terrain = () => {
  const [commune, setCommune] = React.useState('Toutes');
  const terrains = properties.filter(p => p.type && p.type.toLowerCase().includes('terrain'));
  const communes = Array.from(new Set(properties.map(p => p.address.split(',').map(s=>s.trim()).slice(-2)[0]).filter(Boolean)));
  const [filtered, setFiltered] = React.useState(terrains);

  const applyFilters = (f) => {
    let out = terrains.slice();
    if(f.commune && f.commune !== 'Toutes') out = out.filter(p => (p.address||'').includes(f.commune));
    if(f.priceMin) out = out.filter(p => p.price >= Number(f.priceMin));
    if(f.priceMax) out = out.filter(p => p.price <= Number(f.priceMax));
    if(f.sort === 'price_asc') out.sort((a,b)=>a.price-b.price);
    if(f.sort === 'price_desc') out.sort((a,b)=>b.price-a.price);
    setFiltered(out);
  };
  return (
    <>
      <Navbar />
      <div className="container py-5" style={{marginTop:"5vh"}}>
        {useRevealOnScroll()}
        <div className="subpage-header d-flex justify-content-between align-items-center">
          <div>
            <div className="breadcrumb-lite"><span>IMMOBILIER</span><span>›</span><strong>Terrains</strong></div>
            <h1 className="mb-1">Terrains disponibles</h1>
            <p className="text-muted mb-0">Terrains à bâtir et parcelles pour projets résidentiels ou commerciaux.</p>
            <div className="page-underline" data-reveal-delay="120"></div>
          </div>
          <div>
            <span className="badge bg-danger">Promo: -30% sur certains terrains sélectionnés</span>
          </div>
        </div>
  <PropertyFilterBar items={terrains} onChange={applyFilters} />
        <div className="row g-3">
          {filtered.slice(0,6).map(p => (
            <ScrollReveal key={p.id} className="col-12 col-md-6 col-lg-4">
              <PropertyCard property={p} />
            </ScrollReveal>
          ))}
        </div>  

        {/* Promo article - enlarged */}
        <div className="card mt-4 shadow-lg" style={{borderRadius:12, overflow:'hidden'}}>
          <div className="row g-0 align-items-center">
            <div className="col-12 col-md-5">
              <img src={require('../img/property-5.jpg')} alt="Promo terrain" style={{width:'100%', height:220, objectFit:'cover'}} />
            </div>
            <div className="col-12 col-md-7 p-4">
              <h3 className="mb-2" style={{color:'#d7263d', fontWeight:800}}>Promo Terrains — Édition Limitée</h3>
              <p className="mb-2 text-muted">Réduction de <strong>-30%</strong> sur une sélection de terrains. Idéal pour projets résidentiels ou commerciaux.</p>
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">Disponible pour réservation immédiate</div>
                <a className="btn btn-lg btn-success" href="/terrain#promo">Voir les terrains</a>
              </div>
            </div>
          </div>
        </div>

        {/* Carte interactive */}
        <div className="mt-5">
          <h4 className="mb-3">Carte des terrains</h4>
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

export default Terrain;
