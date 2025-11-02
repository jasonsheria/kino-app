import React from 'react';
import { Pagination, Stack } from '@mui/material';
import Navbar from '../components/common/Navbar';
import VehicleList from '../components/vehicle/VehicleList';
import PropertyFilterBar from '../components/property/PropertyFilterBar';
import MapView from '../components/property/MapView';
import { vehicles } from '../data/fakedataVehicles';
import '../pages/HomeSection.css';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import FooterPro from '../components/common/Footer';
import HomeLayout from '../components/homeComponent/HomeLayout';

const Voitures = () => {
  const [filter, setFilter] = React.useState({});
  const [page, setPage] = React.useState(1);
  const [filtered, setFiltered] = React.useState(vehicles);
  const perPage = 6;
  const total = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page-1)*perPage, page*perPage);

  return (
    <>
       <HomeLayout/>
      <div className="container" >
  {useRevealOnScroll()}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="subpage-header scroll-reveal">
            <h1 className="mb-1">Voitures</h1>
            <p className="text-muted mb-0">Véhicules à louer ou à vendre à Kinshasa. Trouvez le véhicule adapté à votre budget.</p>
            <div className="breadcrumb-lite">
              <span>VEHICULES</span>
              <span>›</span>
              <strong>Voitures</strong>
            </div>
            <div className="page-underline" data-reveal-delay="120"></div>
          </div>
          <div className="text-end">
            <span className="badge bg-warning text-dark">Offre spéciale: 10% de réduction sur la 1ère réservation</span>
          </div>
        </div>

        <PropertyFilterBar items={vehicles} onChange={(f)=>{
          setFilter(f); setPage(1);
          let out = vehicles.slice();
          if(f.commune && f.commune !== 'Toutes') out = out.filter(v => (v.address||'').includes(f.commune));
          if(f.priceMin) out = out.filter(v => v.price >= Number(f.priceMin));
          if(f.priceMax) out = out.filter(v => v.price <= Number(f.priceMax));
          if(f.sort === 'price_asc') out.sort((a,b)=>a.price-b.price);
          if(f.sort === 'price_desc') out.sort((a,b)=>b.price-a.price);
          setFiltered(out);
        }} />

        {/* Promotion article - enlarged */}
        <div className="card mb-4 shadow-lg" style={{overflow:'hidden', borderRadius:12}}>
          <div className="row g-0 align-items-center">
            <div className="col-12 col-md-5">
              <img src={require('../img/Toyota RAV4.jpg')} alt="Promo voiture" style={{width:'100%', height:220, objectFit:'cover'}} />
            </div>
            <div className="col-12 col-md-7 p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h3 className="mb-2" style={{color:'#d7263d', fontWeight:800}}>Offre spéciale — Toyota RAV4</h3>
                  <p className="mb-2 text-muted">Profitez d'une remise exceptionnelle cette semaine sur notre Toyota RAV4 : location et vente disponibles.</p>
                  <div className="d-flex align-items-baseline gap-3">
                    <div style={{textDecoration:'line-through', color:'#888', fontSize:18}}>15 000 $</div>
                    <div style={{fontSize:28, color:'var(--ndaku-primary)', fontWeight:900}}>12 000 $</div>
                    <span className="badge bg-danger ms-2" style={{fontSize:16, fontWeight:700}}> -20% </span>
                  </div>
                </div>
                <div className="text-end">
                  <a className="btn btn-lg btn-success" href="/voitures#promo">Réserver</a>
                </div>
              </div>
              <p className="mt-3 text-muted">Offre limitée — contactez-nous pour réserver la date de votre événement ou essai routier.</p>
            </div>
          </div>
        </div>

  <VehicleList vehicles={paged} />

        {/* Pagination controls */}
        {filtered.length > perPage && (
          <div className="d-flex justify-content-center mt-4">
            <Stack spacing={2}>
              <Pagination
                count={total}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
                siblingCount={1}
                boundaryCount={1}
                aria-label="Pagination des voitures"
              />
            </Stack>
          </div>
        )}

        {/* Carte interactive */}
        <div className="mt-5">
          <h4 className="mb-3">Carte des véhicules</h4>
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

export default Voitures;
