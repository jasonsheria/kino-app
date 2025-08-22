import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import ChatWidget from '../components/common/ChatWidget';
import FooterPro from '../components/common/Footer';
import { agents } from '../data/fakedata';
import { FaWhatsapp, FaPhone, FaEnvelope } from 'react-icons/fa';

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const agent = agents.find(a => String(a.id) === String(id)) || agents[0] || null;

  if (!agent) return (
    <div>
      <Navbar />
      <div className="container py-5"><div className="alert alert-warning">Agent introuvable</div></div>
  <FooterPro />
  <ChatWidget />
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 className="mb-1">{agent.name}</h2>
            <div className="small text-muted">{agent.company || 'Agent indépendant'}</div>
          </div>
          <div className="text-end">
            <button className="btn btn-outline-success me-2" onClick={() => window.open(`https://wa.me/${(agent.whatsapp||'').replace('+','')}`)}> <FaWhatsapp /> WhatsApp</button>
            <button className="btn btn-outline-primary" onClick={() => window.dispatchEvent(new CustomEvent('ndaku-call', { detail: { to: agent.phone } }))}> <FaPhone /> Appeler</button>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <div className="card mb-3">
              <img src={agent.photo || require('../img/header.jpg')} className="card-img-top" alt={agent.name} style={{objectFit:'cover', height:240}} />
              <div className="card-body">
                <div className="fw-bold">{agent.name}</div>
                <div className="small text-muted">{agent.email}</div>
                <div className="small text-muted">{agent.phone}</div>
                <div className="mt-2 d-flex gap-2">
                  <a className="btn btn-sm btn-success" href={`mailto:${agent.email}`}><FaEnvelope /> Mail</a>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-8">
            <div className="card mb-3 p-3">
              <h5>À propos</h5>
              <p className="text-muted small">{agent.bio || 'Agent expérimenté disponible pour vous aider à trouver le bien idéal.'}</p>
              <h6 className="mt-3">Annonces récentes</h6>
              <div className="list-group">
                {(agent.properties||[]).slice(0,5).map((p, idx) => (
                  <a key={idx} className="list-group-item list-group-item-action" href={`/properties/${p.id}`}>{p.name || p.title || `Annonce ${p.id}`}</a>
                ))}
                {(!agent.properties || agent.properties.length===0) && <div className="small text-muted">Aucune annonce publique pour le moment.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterPro />
    </>
  );
};

export default AgentDetails;
