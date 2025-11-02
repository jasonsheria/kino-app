import React from 'react';
import Navbar from '../components/common/Navbar';
import ChatWidget from '../components/common/ChatWidget';
import AgentList from '../components/agent/AgentList';
import FooterPro from '../components/common/Footer';
import { agents } from '../data/fakedata';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import HomeLayout from '../components/homeComponent/HomeLayout';

const Agents = () => {
  return (
    <>
       <HomeLayout/>
      <div className="container">
        {useRevealOnScroll()}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="mb-1">Agents</h1>
            <p className="text-muted mb-0">Trouvez un agent pour vous accompagner dans l'achat, la vente ou la location.</p>
            <div className="page-underline" data-reveal-delay="120"></div>
          </div>
          <div>
            <span className="badge bg-info text-dark">Professionnels vérifiés</span>
          </div>
        </div>

        <AgentList agents={agents} />
      </div>
  <FooterPro />
  <ChatWidget />
    </>
  );
};

export default Agents;
