import React from 'react';
import { Pagination, Stack } from '@mui/material';
import Navbar from '../components/common/Navbar';
import PropertyCard from '../components/property/PropertyCard';
import PropertyFilterBar from '../components/property/PropertyFilterBar';
import ScrollReveal from '../components/common/ScrollReveal';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import MapView from '../components/property/MapView';
import { properties } from '../data/fakedata';
import FooterPro from '../components/common/Footer';
import HomeLayout from '../components/homeComponent/HomeLayout';

const Appartement = () => {
  const [filter, setFilter] = React.useState({});
  const appart = properties.filter(p => (p.type && p.type.toLowerCase().includes('appart')) || (p.type && p.type.toLowerCase().includes('maison')) );
  const [filtered, setFiltered] = React.useState(appart);
  const [page, setPage] = React.useState(1);
  const perPage = 6; // items per page

  const applyFilters = (f) => {
    setFilter(f);
    let out = appart.slice();
    if (f.commune && f.commune !== 'Toutes') out = out.filter(p => (p.address||'').includes(f.commune));
    if (f.chambres && f.chambres !== 'Tous') {
      if (f.chambres === '3+') out = out.filter(p => (p.chambres||0) >= 3);
      else out = out.filter(p => String(p.chambres) === String(f.chambres));
    }
    if (f.sdb && f.sdb !== 'Tous') out = out.filter(p => String((p.douches||p.sdb||0)) === String(f.sdb));
    if (f.priceMin) out = out.filter(p => p.price >= Number(f.priceMin));
    if (f.priceMax) out = out.filter(p => p.price <= Number(f.priceMax));
    // Sorting
    if (f.sort === 'price_asc') out.sort((a,b)=>a.price-b.price);
    else if (f.sort === 'price_desc') out.sort((a,b)=>b.price-a.price);
    setFiltered(out);
    setPage(1);
  };
  return (
    <>
       <HomeLayout/>
      <div className="container" style={{marginTop:"7vh"}}>
  {useRevealOnScroll()}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="mb-1">Appartements & Maisons</h1>
            <p className="text-muted mb-0">Sélection d'appartements et maisons disponibles pour la vente ou la location.</p>
            <div className="breadcrumb-lite">
              <span>IMMOBILIER</span>
              <span>›</span>
              <strong>Appartements</strong>
            </div>
            <div className="page-underline" data-reveal-delay="120"></div>
          </div>
          <div>
            <span className="badge bg-success">Nouveautés cette semaine</span>
          </div>
        </div>
  <PropertyFilterBar items={appart} onChange={applyFilters} />
        <div className="row g-3">
          {filtered.slice((page-1)*perPage, page*perPage).map(p => (
            <ScrollReveal key={p.id} className="col-12 col-md-6 col-lg-4">
              <PropertyCard property={p} />
            </ScrollReveal>
          ))}
        </div>

        {/* Pagination controls */}
        {filtered.length > perPage && (
          <div className="d-flex justify-content-center mt-4">
            <Stack spacing={2}>
              <Pagination
                count={Math.ceil(filtered.length / perPage)}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
                siblingCount={1}
                boundaryCount={1}
                aria-label="Pagination des appartements"
              />
            </Stack>
          </div>
        )}

        {/* Promotion - enlarged */}
        <div className="card mt-4 shadow-lg" style={{borderRadius:12, overflow:'hidden'}}>
          <div className="row g-0 align-items-center">
            <div className="col-12 col-md-5">
              <img src={require('../img/property-1.jpg')} alt="Promo appart" style={{width:'100%', height:220, objectFit:'cover'}} />
            </div>
            <div className="col-12 col-md-7 p-4">
              <h3 className="mb-2" style={{color:'#d7263d', fontWeight:800}}>Promotion Appartements — -30%</h3>
              <p className="mb-2 text-muted">Quelques appartements sélectionnés bénéficient d'une remise exceptionnelle cette semaine. Réservez vite.</p>
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">Offre limitée</div>
                <a className="btn btn-lg btn-success" href="/appartement#promo">Voir l'offre</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h4 className="mb-3">Carte des appartements</h4>
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
      
                 
      
                  {/* Dev-only debug controls (visible on localhost or with ?ndaku_debug=1) */}
                 
      
                  <FooterPro />
    </>
  );
};

export default Appartement;
