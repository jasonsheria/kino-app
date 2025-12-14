import React from 'react';
import { useTheme } from '@mui/material/styles';
import { FaBuilding, FaUsers, FaHandshake, FaChartLine, FaShieldAlt, FaAward, FaClock, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import Navbar from '../components/common/Navbar';
import FooterPro from '../components/common/Footer';
import ScrollReveal from '../components/common/ScrollReveal';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import HomeLayout from '../components/homeComponent/HomeLayout';
import MessengerWidget from '../components/common/Messenger';

const About = () => {
    const theme = useTheme();

    const stats = [
        { icon: <FaBuilding />, number: "1000+", label: "Biens immobiliers" },
        { icon: <FaUsers />, number: "5000+", label: "Clients satisfaits" },
        { icon: <FaHandshake />, number: "200+", label: "Agents certifiés" },
        { icon: <FaChartLine />, number: "98%", label: "Taux de satisfaction" }
    ];

    const values = [
        {
            icon: <FaShieldAlt className="text-success" size={32} />,
            title: "Confiance",
            description: "Notre priorité absolue est de créer des relations de confiance durables avec nos clients."
        },
        {
            icon: <FaAward className="text-success" size={32} />,
            title: "Excellence",
            description: "Nous visons l'excellence dans chaque transaction et service que nous proposons."
        },
        {
            icon: <FaClock className="text-success" size={32} />,
            title: "Réactivité",
            description: "Une équipe disponible et réactive pour répondre à vos besoins immobiliers."
        }
    ];

    return (
        <>
            <HomeLayout/>
            
            {/* Hero Section - Minimalist Design */}
            <section className="position-relative" style={{ background: '#ffffff', paddingTop: '4rem', paddingBottom: '4rem' }}>
                <div className="container">
                    <div className="row align-items-center gap-4">
                        <div className="col-lg-6">
                            <h1 style={{ 
                                fontSize: '3rem', 
                                fontWeight: '300',
                                letterSpacing: '-1px',
                                marginBottom: '1.5rem',
                                color: '#1a1a1a'
                            }}>
                                À propos de Ndaku
                            </h1>
                            <p style={{ 
                                fontSize: '1rem',
                                lineHeight: '1.7',
                                color: '#555',
                                marginBottom: '1.5rem',
                                fontWeight: '300'
                            }}>
                                Ndaku est la première plateforme immobilière moderne de Kinshasa, 
                                conçue pour simplifier vos recherches et transactions immobilières. 
                                Notre mission est de révolutionner le marché immobilier congolais 
                                en offrant une expérience transparente, sécurisée et professionnelle.
                            </p>
                            <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
                                <Button 
                                    variant="contained" 
                                    component={Link}
                                    to="/contact"
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: '8px',
                                        py: 1.3,
                                        px: 3,
                                        fontSize: '0.95rem',
                                        background: '#1a1a1a',
                                        color: 'white',
                                        fontWeight: '500',
                                        '&:hover': { background: '#333' }
                                    }}
                                >
                                    Nous contacter
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    component={Link}
                                    to="/agents"
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: '8px',
                                        py: 1.3,
                                        px: 3,
                                        fontSize: '0.95rem',
                                        borderColor: '#d0d0d0',
                                        color: '#1a1a1a',
                                        fontWeight: '500',
                                        '&:hover': { borderColor: '#1a1a1a', background: '#f9f9f9' }
                                    }}
                                >
                                    Nos agents
                                </Button>
                            </div>
                        </div>
                        <div className="col-lg-6" style={{ marginTop: '2rem' }}>
                            <div className="position-relative" style={{ height: '420px' }}>
                                <img 
                                    src={require('../img/about.jpg')} 
                                    alt="Ndaku Team" 
                                    className="img-fluid"
                                    style={{ 
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '12px'
                                    }}
                                />
                                <div 
                                    className="position-absolute" 
                                    style={{ 
                                        bottom: '-1.5rem',
                                        right: '0',
                                        background: '#1a1a1a',
                                        padding: '1.5rem 2rem',
                                        borderRadius: '8px',
                                        color: 'white',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    <div style={{ fontSize: '1.8rem', fontWeight: '300', marginBottom: '0.2rem' }}>7+ ans</div>
                                    <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>d'expertise</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section - Minimalist */}
            <section style={{ background: '#f9f9f9', paddingTop: '3.5rem', paddingBottom: '3.5rem', marginTop: '3rem' }}>
                <div className="container">
                    <div className="row g-4">
                        {stats.map((stat, index) => (
                            <ScrollReveal key={index} className="col-6 col-md-3">
                                <div className="text-center" style={{ padding: '2rem 1rem' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#666' }}>
                                        {stat.icon}
                                    </div>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '300', marginBottom: '0.5rem', color: '#1a1a1a' }}>
                                        {stat.number}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: '#777', marginBottom: '0', fontWeight: '300' }}>
                                        {stat.label}
                                    </p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Nos Valeurs Section - Minimalist */}
            <section style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem', background: 'white' }}>
                <div className="container">
                    <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2rem', fontWeight: '300', color: '#1a1a1a' }}>
                        Nos Valeurs
                    </h2>
                    <div className="row g-4">
                        {values.map((value, index) => (
                            <ScrollReveal key={index} className="col-md-4">
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2.5rem 1.5rem',
                                    borderTop: '2px solid #e0e0e0',
                                    height: '100%',
                                    background: 'white',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderTopColor = '#1a1a1a'}
                                onMouseLeave={(e) => e.currentTarget.style.borderTopColor = '#e0e0e0'}
                                >
                                    <div style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#666' }}>
                                        {value.icon}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '500', color: '#1a1a1a' }}>
                                        {value.title}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: '#777', marginBottom: '0', lineHeight: '1.6', fontWeight: '300' }}>
                                        {value.description}
                                    </p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Notre Histoire Section - Minimalist */}
            <section style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem', background: '#f9f9f9' }}>
                <div className="container">
                    <div className="row align-items-center gap-4">
                        <div className="col-lg-6">
                            <h2 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: '300', color: '#1a1a1a' }}>
                                Notre Histoire
                            </h2>
                            <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: '#666', lineHeight: '1.7', fontWeight: '300' }}>
                                Fondée en 2018, Ndaku est née d'une vision simple mais ambitieuse : 
                                transformer l'expérience immobilière à Kinshasa. Face aux défis du marché 
                                traditionnel, nous avons créé une plateforme qui met l'innovation et la 
                                transparence au service de nos clients.
                            </p>
                            <p style={{ marginBottom: '0', fontSize: '0.95rem', color: '#666', lineHeight: '1.7', fontWeight: '300' }}>
                                Aujourd'hui, Ndaku est devenue la référence de l'immobilier moderne à Kinshasa, 
                                connectant propriétaires, agents et clients dans un écosystème digital innovant 
                                et sécurisé.
                            </p>
                        </div>
                        <div className="col-lg-6">
                            <div className="row g-4">
                                <div className="col-6">
                                    <img 
                                        src={require('../img/property-1.jpg')} 
                                        alt="Ndaku History 1" 
                                        className="img-fluid rounded-4 shadow-sm"
                                        style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="col-6">
                                    <img 
                                        src={require('../img/property-2.jpg')} 
                                        alt="Ndaku History 2" 
                                        className="img-fluid rounded-4 shadow-sm"
                                        style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="col-6">
                                    <img 
                                        src={require('../img/property-3.jpg')} 
                                        alt="Ndaku History 3" 
                                        className="img-fluid rounded-4 shadow-sm"
                                        style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="col-6">
                                    <img 
                                        src={require('../img/property-4.jpg')} 
                                        alt="Ndaku History 4" 
                                        className="img-fluid rounded-4 shadow-sm"
                                        style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section - Minimalist */}
            <section style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem', background: 'white' }}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8" style={{ textAlign: 'center' }}>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: '300', color: '#1a1a1a' }}>
                                Contactez-nous
                            </h2>
                            <p style={{ marginBottom: '3rem', fontSize: '0.95rem', color: '#666', lineHeight: '1.7', fontWeight: '300' }}>
                                Notre équipe est disponible pour répondre à toutes vos questions 
                                et vous accompagner dans vos projets immobiliers.
                            </p>
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <FaMapMarkerAlt style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#999' }} />
                                        <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>Adresse</h5>
                                        <p style={{ fontSize: '0.85rem', color: '#777', marginBottom: '0', fontWeight: '300' }}>
                                            10 Avenue du Commerce, Gombe, Kinshasa
                                        </p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <FaPhoneAlt style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#999' }} />
                                        <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>Téléphone</h5>
                                        <p style={{ fontSize: '0.85rem', color: '#777', marginBottom: '0', fontWeight: '300' }}>
                                            +243 900 000 000
                                        </p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <FaEnvelope style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#999' }} />
                                        <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>Email</h5>
                                        <p style={{ fontSize: '0.85rem', color: '#777', marginBottom: '0', fontWeight: '300' }}>
                                            contact@ndaku.cd
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <FooterPro />
        </>
    );
};

export default About;
