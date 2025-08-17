import React, { useRef } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import '../styles/owner.css';

function Section({ id, title, children }){
  return (
    <section id={id} style={{marginBottom:18}}>
      <h5 style={{marginBottom:8}}>{title}</h5>
      <div className="small text-muted">{children}</div>
    </section>
  );
}

export default function OwnerPrivacy(){
  const containerRef = useRef();

  const onPrint = ()=> window.print();

  const downloadPDF = ()=>{
    // simple export: print-friendly (client-side). For real PDF generation, use server-side or client libs.
    onPrint();
  };

  return (
    <OwnerLayout>
      <div ref={containerRef}>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h4>Politique de confidentialité</h4>
            <div className="small text-muted">Comment nous recueillons, utilisons et protégeons les données des utilisateurs.</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-outline-secondary" onClick={onPrint}>Imprimer</button>
            <button className="btn btn-outline-secondary" onClick={downloadPDF}>Télécharger</button>
          </div>
        </div>

        <div className="card p-3">
          <div style={{display:'flex',gap:18}}>
            <nav style={{minWidth:220}}>
              <div className="small text-muted">Sommaire</div>
              <ul style={{paddingLeft:16, marginTop:8}}>
                <li><a href="#collecte">Collecte des données</a></li>
                <li><a href="#usage">Usage des données</a></li>
                <li><a href="#partage">Partage & tiers</a></li>
                <li><a href="#cookies">Cookies & trackers</a></li>
                <li><a href="#conservation">Conservation</a></li>
                <li><a href="#droits">Vos droits</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>

            <div style={{flex:1}}>
              <Section id="collecte" title="Collecte des données">
                Nous recueillons des informations que vous fournissez directement (profil, biens, messages), des informations de navigation (cookies, logs), et des informations provenant de tiers lorsque vous connectez des services externes.
              </Section>

              <Section id="usage" title="Usage des données">
                Les données sont utilisées pour fournir et améliorer nos services, traiter les demandes de visite, communiquer avec les clients, prévenir la fraude et se conformer aux obligations légales.
              </Section>

              <Section id="partage" title="Partage & tiers">
                Nous pouvons partager des données avec des prestataires (hébergement, analytics), des partenaires (agences, agents) et lorsque la loi l'exige. Nous n'avons pas pour habitude de vendre vos données.
              </Section>

              <Section id="cookies" title="Cookies & trackers">
                Nous utilisons des cookies techniques et analytiques pour améliorer l'expérience. Vous pouvez gérer vos préférences via le navigateur et nos paramètres de compte.
              </Section>

              <Section id="conservation" title="Conservation des données">
                Les données sont conservées le temps nécessaire pour la finalité pour laquelle elles ont été recueillies, sauf obligation légale contraire. Vous pouvez demander la suppression de votre compte.
              </Section>

              <Section id="droits" title="Vos droits">
                Vous pouvez demander l'accès, la rectification, l'effacement, la limitation du traitement et la portabilité de vos données. Pour exercer vos droits, contactez-nous via l'onglet Contact ci-dessous.
              </Section>

              <Section id="contact" title="Contact">
                Pour toute question liée à la vie privée: <br />
                Email: privacy@ndaku.example <br />
                Adresse: 1 rue Exemple, 75000 Paris 
              </Section>

              <div style={{marginTop:14}} className="small text-muted">Dernière mise à jour: 17 août 2025</div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
