import React from 'react';
import { FaHome, FaUserFriends, FaEnvelope, FaPhoneAlt, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import './FooterPro.css';

const FooterPro = () => (
  <footer className="footer-pro bg-dark text-white pt-5 pb-3 animate__animated animate__fadeInUp">
    <div className="container">
      <div className="row mb-4">
        <div className="col-12 col-md-4 mb-4 mb-md-0 d-flex flex-column align-items-start">
          <div className="d-flex align-items-center mb-2">
            <FaHome className="me-2 text-success" size={28}/>
            <span className="fw-bold fs-4">Ndaku</span>
          </div>
          <p className="mb-2 small">Votre partenaire de confiance pour l’immobilier à Kinshasa. Trouvez, vendez ou louez en toute sérénité avec nos agents certifiés.</p>
          <div className="d-flex gap-2 mt-2">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm rounded-circle"><FaFacebook /></a>
            <a href="https://wa.me/243900000000" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm rounded-circle"><FaWhatsapp /></a>
          </div>
        </div>
        <div className="col-12 col-md-4 mb-4 mb-md-0">
          <h6 className="fw-bold text-success mb-3"><FaUserFriends className="me-2"/>Contact & Support</h6>
          <ul className="list-unstyled small mb-0">
            <li className="mb-2 d-flex align-items-center gap-2"><FaEnvelope className="text-success"/> contact@ndaku.cd</li>
            <li className="mb-2 d-flex align-items-center gap-2"><FaPhoneAlt className="text-success"/> +243 900 000 000</li>
          </ul>
        </div>
        <div className="col-12 col-md-4">
          <h6 className="fw-bold text-success mb-3">Navigation</h6>
          <ul className="list-unstyled small mb-0">
            <li><a href="#biens" className="text-white text-decoration-none">Biens immobiliers</a></li>
            <li><a href="#agents" className="text-white text-decoration-none">Nos agents</a></li>
            <li><a href="#agence" className="text-white text-decoration-none">L'agence</a></li>
            <li><a href="#" className="text-white text-decoration-none">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center small text-secondary pt-3 border-top border-secondary">
        © {new Date().getFullYear()} Ndaku. Tous droits réservés.
      </div>
    </div>
  </footer>
);

export default FooterPro;
