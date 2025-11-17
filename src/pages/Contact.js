import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
    FaMapMarkerAlt, 
    FaPhoneAlt, 
    FaEnvelope, 
    FaClock, 
    FaWhatsapp, 
    FaFacebook,
    FaInstagram,
    FaLinkedin
} from 'react-icons/fa';
import FooterPro from '../components/common/Footer';
import ScrollReveal from '../components/common/ScrollReveal';
import { Button, TextField, Alert, CircularProgress } from '@mui/material';
import HomeLayout from '../components/homeComponent/HomeLayout';
import MessengerWidget from '../components/common/Messenger';

const Contact = () => {
    const theme = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const contactInfo = [
        {
            icon: <FaMapMarkerAlt size={24} />,
            title: "Notre Adresse",
            details: ["10 Avenue du Commerce", "Gombe, Kinshasa", "République Démocratique du Congo"],
        },
        {
            icon: <FaPhoneAlt size={24} />,
            title: "Téléphone",
            details: ["+243 900 000 000", "+243 900 000 001"],
        },
        {
            icon: <FaEnvelope size={24} />,
            title: "Email",
            details: ["contact@ndaku.cd", "support@ndaku.cd"],
        },
        {
            icon: <FaClock size={24} />,
            title: "Heures d'ouverture",
            details: ["Lundi - Vendredi: 8h00 - 18h00", "Samedi: 9h00 - 15h00"],
        }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSubmitStatus(null);

        // Simulate API call
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setSubmitStatus({ type: 'success', message: 'Votre message a été envoyé avec succès. Notre équipe vous contactera bientôt.' });
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (error) {
            setSubmitStatus({ type: 'error', message: 'Une erreur est survenue. Veuillez réessayer plus tard.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <>
             <HomeLayout/>

            {/* Hero Section */}
            <section className="position-relative" style={{
                background: `linear-gradient(135deg, var(--ndaku-primary) 0%, #0ea67e 100%)`,
                color: 'white'
            }}>
                <div className="container py-5">
                    <div className="row justify-content-center text-center">
                        <div className="col-lg-8">
                            <h1 className="display-4 fw-bold mb-4">Contactez-nous</h1>
                            <p className="lead mb-0" style={{ fontSize: '1.2rem' }}>
                                Notre équipe est à votre disposition pour répondre à toutes vos questions 
                                et vous accompagner dans vos projets immobiliers.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="position-absolute bottom-0 start-0 w-100 overflow-hidden" style={{ height: '4rem' }}>
                    <svg viewBox="0 0 2880 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 48h2880V0h-720C1442.5 52 720 0 720 0H0v48z" fill="currentColor"></path>
                    </svg>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="py-5">
                <div className="container py-4">
                    <div className="row g-4">
                        {contactInfo.map((info, index) => (
                            <ScrollReveal key={index} className="col-md-6 col-lg-3">
                                <div className="p-4 rounded-4 h-100" style={{
                                    background: 'white',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                    transition: 'transform 0.3s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'translateY(-5px)'
                                    }
                                }}>
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="me-3" style={{ color: 'var(--ndaku-primary)' }}>
                                            {info.icon}
                                        </div>
                                        <h3 className="h5 mb-0">{info.title}</h3>
                                    </div>
                                    {info.details.map((detail, idx) => (
                                        <p key={idx} className="mb-1 text-muted">{detail}</p>
                                    ))}
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form & Map Section */}
            <section className="py-5 bg-light">
                <div className="container py-4">
                    <div className="row g-4">
                        <div className="col-lg-6">
                            <div className="bg-white p-4 rounded-4 shadow-sm">
                                <h2 className="mb-4">Envoyez-nous un message</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <TextField
                                                fullWidth
                                                label="Nom complet"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                variant="outlined"
                                                sx={{ mb: 2 }}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <TextField
                                                fullWidth
                                                label="Email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                variant="outlined"
                                                sx={{ mb: 2 }}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <TextField
                                                fullWidth
                                                label="Téléphone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                variant="outlined"
                                                sx={{ mb: 2 }}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <TextField
                                                fullWidth
                                                label="Sujet"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                variant="outlined"
                                                sx={{ mb: 2 }}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <TextField
                                                fullWidth
                                                label="Message"
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                required
                                                multiline
                                                rows={4}
                                                variant="outlined"
                                                sx={{ mb: 3 }}
                                            />
                                        </div>
                                    </div>

                                    {submitStatus && (
                                        <Alert 
                                            severity={submitStatus.type} 
                                            sx={{ mb: 3 }}
                                        >
                                            {submitStatus.message}
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        sx={{
                                            bgcolor: 'var(--ndaku-primary)',
                                            color: 'white',
                                            py: 1.5,
                                            px: 4,
                                            '&:hover': {
                                                bgcolor: 'rgba(14,166,126,0.92)'
                                            }
                                        }}
                                    >
                                        {loading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            'Envoyer le message'
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="h-100">
                                <div className="ratio ratio-4x3 rounded-4 overflow-hidden shadow-sm">
                                    <iframe 
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63464.41083843849!2d15.266534899999999!3d-4.325131599999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1a6a3130fe066a8b%3A0x168b7e4e1f52378d!2sGombe%2C%20Kinshasa!5e0!3m2!1sfr!2scd!4v1629654083000!5m2!1sfr!2scd" 
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        title="Notre localisation"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Media Section */}
            <section className="py-5">
                <div className="container py-4">
                    <div className="text-center mb-5">
                        <h2 className="mb-3">Suivez-nous sur les réseaux sociaux</h2>
                        <p className="text-muted">Restez connecté avec nous pour les dernières offres et actualités immobilières</p>
                    </div>
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="d-flex justify-content-center gap-4">
                                {[
                                    { icon: <FaWhatsapp size={32} />, link: '#', color: '#25D366' },
                                    { icon: <FaFacebook size={32} />, link: '#', color: '#1877F2' },
                                    { icon: <FaInstagram size={32} />, link: '#', color: '#E4405F' },
                                    { icon: <FaLinkedin size={32} />, link: '#', color: '#0A66C2' }
                                ].map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.link}
                                        className="text-decoration-none"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            background: 'white',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            color: social.color,
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-5px)';
                                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        }}
                                    >
                                        {social.icon}
                                    </a>
                                ))}
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

export default Contact;
