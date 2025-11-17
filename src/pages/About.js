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
            
            {/* Hero Section */}
            <section className="position-relative bg-light">
                <div className="container py-5">
                    <div className="row align-items-center">
                        <div className="col-lg-6">
                            <h1 className="display-4 fw-bold mb-4" style={{ color: theme.palette.primary.main }}>
                                À propos de Ndaku
                            </h1>
                            <p className="lead mb-4" style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
                                Ndaku est la première plateforme immobilière moderne de Kinshasa, 
                                conçue pour simplifier vos recherches et transactions immobilières. 
                                Notre mission est de révolutionner le marché immobilier congolais 
                                en offrant une expérience transparente, sécurisée et professionnelle.
                            </p>
                            <div className="d-flex gap-3">
                                <Button 
                                    variant="contained" 
                                    color="success"
                                    component={Link}
                                    to="/contact"
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        py: 1.5,
                                        px: 3,
                                        fontSize: '1rem'
                                    }}
                                >
                                    Nous contacter
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    color="success"
                                    component={Link}
                                    to="/agents"
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        py: 1.5,
                                        px: 3,
                                        fontSize: '1rem'
                                    }}
                                >
                                    Nos agents
                                </Button>
                            </div>
                        </div>
                        <div className="col-lg-6 mt-5 mt-lg-0">
                            <div className="position-relative" style={{ height: '400px' }}>
                                <img 
                                    src={require('../img/about.jpg')} 
                                    alt="Ndaku Team" 
                                    className="img-fluid rounded-4 shadow-lg"
                                    style={{ 
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div 
                                    className="position-absolute" 
                                    style={{ 
                                        bottom: '-2rem',
                                        right: '-2rem',
                                        background: 'var(--ndaku-primary)',
                                        padding: '2rem',
                                        borderRadius: '1rem',
                                        color: 'white',
                                        boxShadow: '0 10px 30px var(--ndaku-primary-33)'
                                    }}
                                >
                                    <h3 className="h2 mb-0">7+ ans</h3>
                                    <p className="mb-0">d'expertise</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-5" style={{ background: `linear-gradient(135deg, var(--ndaku-primary) 0%, #0ea67e 100%)` }}>
                <div className="container py-4">
                    <div className="row g-4">
                        {stats.map((stat, index) => (
                            <ScrollReveal key={index} className="col-6 col-md-3">
                                <div className="text-center text-white">
                                    <div className="display-4 mb-2">
                                        {stat.icon}
                                    </div>
                                    <h3 className="h2 mb-2">{stat.number}</h3>
                                    <p className="mb-0">{stat.label}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Nos Valeurs Section */}
            <section className="py-5">
                <div className="container py-4">
                    <h2 className="text-center mb-5">Nos Valeurs</h2>
                    <div className="row g-4">
                        {values.map((value, index) => (
                            <ScrollReveal key={index} className="col-md-4">
                                <div className="text-center p-4 rounded-4" style={{
                                    background: 'white',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                    height: '100%'
                                }}>
                                    <div className="mb-4">
                                        {value.icon}
                                    </div>
                                    <h3 className="h4 mb-3">{value.title}</h3>
                                    <p className="text-muted mb-0">{value.description}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Notre Histoire Section */}
            <section className="py-5 bg-light">
                <div className="container py-4">
                    <div className="row align-items-center">
                        <div className="col-lg-6 mb-4 mb-lg-0">
                            <h2 className="mb-4">Notre Histoire</h2>
                            <p className="mb-4">
                                Fondée en 2018, Ndaku est née d'une vision simple mais ambitieuse : 
                                transformer l'expérience immobilière à Kinshasa. Face aux défis du marché 
                                traditionnel, nous avons créé une plateforme qui met l'innovation et la 
                                transparence au service de nos clients.
                            </p>
                            <p className="mb-4">
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

            {/* Contact Section */}
            <section className="py-5">
                <div className="container py-4">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 text-center">
                            <h2 className="mb-4">Contactez-nous</h2>
                            <p className="mb-5">
                                Notre équipe est disponible pour répondre à toutes vos questions 
                                et vous accompagner dans vos projets immobiliers.
                            </p>
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="d-flex flex-column align-items-center">
                                        <FaMapMarkerAlt className="text-success mb-3" size={24} />
                                        <h5 className="h6 mb-2">Adresse</h5>
                                        <p className="text-muted mb-0">10 Avenue du Commerce, Gombe, Kinshasa</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex flex-column align-items-center">
                                        <FaPhoneAlt className="text-success mb-3" size={24} />
                                        <h5 className="h6 mb-2">Téléphone</h5>
                                        <p className="text-muted mb-0">+243 900 000 000</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex flex-column align-items-center">
                                        <FaEnvelope className="text-success mb-3" size={24} />
                                        <h5 className="h6 mb-2">Email</h5>
                                        <p className="text-muted mb-0">contact@ndaku.cd</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <FooterPro />
            <MessengerWidget/>
        </>
    );
};

export default About;
