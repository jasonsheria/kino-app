import React from 'react';
import MessengerWidget from '../components/common/Messenger';
import { useTheme } from '@mui/material/styles';
import { FaUserTie, FaFilter, FaListUl, FaBuilding, FaArrowRight, FaHandshake, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaHome, FaUserFriends, FaCommentDots, FaCar, FaHouseUser, FaStore, FaTree, FaGlassCheers, FaKey, FaCertificate, FaBullhorn, FaTools } from 'react-icons/fa';
import Navbar from '../components/common/Navbar';
import InfoModal from '../components/common/InfoModal';
import { useAuth } from '../contexts/AuthContext';
import MapView from '../components/property/MapView';
import FooterPro from '../components/common/Footer';
import LandingCarousel from '../components/property/LandingCarousel';
import CustomButton from '../components/common/Button';
import { Button as MuiButton } from '@mui/material';
import { properties, agents } from '../data/fakedata';
import { vehicles } from '../data/fakedataVehicles';
import recService from '../services/recommendationService';
import { promotions as promoData } from '../data/fakedataPromotions';
import VehicleList from '../components/vehicle/VehicleList';
import './HomeSection.css';
import '../styles/services-modern.css';
// import './auth.css';
import Preloader from '../components/common/Preloader';
import PropertyCard from '../components/property/PropertyCard';
import VisitBookingModal from '../components/common/VisitBookingModal';
import AgentCard from '../components/agent/AgentCard';
import PromoCard from '../components/promotion/PromoCard';
import ScrollReveal from '../components/common/ScrollReveal';
import AutoReveal from '../components/common/AutoReveal';
import AgentContactModal from '../components/common/Messenger';
import { useSnackbar } from 'notistack';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Grid, Stack, Typography, IconButton, useMediaQuery, Button } from '@mui/material';
import authService from '../services/authService';
import HomeLayout from '../components/homeComponent/HomeLayout'
import img6 from '../assets/images/quelle-agence-immobiliere-choisir-pour-vendre-1.jpg'
const Home = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [contactOpen, setContactOpen] = React.useState(false);
    const [selectedAgent, setSelectedAgent] = React.useState(null);
    const openContact = (agent) => {
        setSelectedAgent(agent);
        setContactOpen(true);
    };
    const closeContact = () => {
        setContactOpen(false);
        setSelectedAgent(null);
    };
    const [loading, setLoading] = React.useState(true);
    const [isSticky, setIsSticky] = React.useState(false);
    const [filter, setFilter] = React.useState('Tous');
    const [commune, setCommune] = React.useState('Toutes');
    const [infoOpen, setInfoOpen] = React.useState(false);
    const [infoMsg, setInfoMsg] = React.useState('');
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    React.useEffect(() => {
        // Preloader now driven by data loads. We'll keep a safety timeout of 6s to avoid stuck UI
        const safety = setTimeout(() => setLoading(false), 6000);
        // Sticky navbar
        const scrollThreshold = 100;
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    setIsSticky(currentScrollY > scrollThreshold);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        // Smooth scroll for anchor links
        const handleAnchorClick = e => {
            if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
                const id = e.target.getAttribute('href').slice(1);
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        document.addEventListener('click', handleAnchorClick);
        return () => {
            clearTimeout(safety);
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('click', handleAnchorClick);
        };
    }, []);
    // Utilisation du composant GoogleOneTap
    const { isAuthenticated } = useAuth();
    // fetch recommendations on mount and when filters change
    const [recommendedProperties, setRecommendedProperties] = React.useState([]);
    const [recommendedVehicles, setRecommendedVehicles] = React.useState([]);
    const loadRecommendations = React.useCallback(async (kind) => {
        if (kind === 'properties') {

            const recs = await recService.getRecommendations(properties.slice(0, 50), { kind: 'properties', limit: 12 });
            setRecommendedProperties(recs);

        } else {

            const recs = await recService.getRecommendations(vehicles.slice(0, 50), { kind: 'vehicles', limit: 12 });
            setRecommendedVehicles(recs);

        }
    }, []);

    // Configuration des catégories et filtres
    const propertyConfig = React.useMemo(() => ({
        categories: {
            Tous: {
                label: 'Tous les biens',
                filter: () => true
            },
            Résidentiel: {
                label: 'Biens résidentiels',
                types: ["Appartement", "Villa", "Maison", "Studio", "Penthouse"],
                filter: (p) => ["Appartement", "Villa", "Maison", "Studio", "Penthouse"].includes(p.type)
            },
            Commerciaux: {
                label: 'Espaces commerciaux',
                types: ["Place commerciale", "Boutique", "Magasin"],
                filter: (p) => ["Place commerciale", "Boutique", "Magasin"].includes(p.type)
            },
            Terrains: {
                label: 'Terrains',
                types: ["Terrain", "Terrain vide"],
                filter: (p) => ["Terrain", "Terrain vide"].includes(p.type)
            },
            'Salles de fêtes': {
                label: 'Salles de fêtes',
                types: ["Salle de fête"],
                filter: (p) => p.type === "Salle de fête"
            },
            Locations: {
                label: 'En location',
                filter: (p) => p.status === 'location'
            }
        }
    }), []);

    // Fonction de filtrage principale
    const applyFilters = React.useCallback((props, activeFilter, activeCommune) => {
        let results = [...props];

        // Appliquer le filtre de catégorie
        if (activeFilter !== 'Tous') {
            const categoryFilter = propertyConfig.categories[activeFilter]?.filter;
            if (categoryFilter) {
                results = results.filter(categoryFilter);
            }
        }

        // Appliquer le filtre de commune
        if (activeCommune !== 'Toutes') {
            results = results.filter(p => {
                const parts = p.address.split(',').map(s => s.trim());
                return parts.some(part => part === activeCommune);
            });
        }

        return results;
    }, [propertyConfig]);

    // État local pour les résultats filtrés et le chargement
    const [filteredResults, setFilteredResults] = React.useState(properties);
    const [propertiesLoading, setPropertiesLoading] = React.useState(true);

    // track loading of both recommendations; hide preloader when both done or when safety timeout fires
    const [propsLoaded, setPropsLoaded] = React.useState(false);
    const [vehLoaded, setVehLoaded] = React.useState(false);
    React.useEffect(() => {
        let mounted = true;
        (async () => {
            await loadRecommendations('properties');
            if (!mounted) return;
            setPropsLoaded(true);
        })();
        (async () => {
            await loadRecommendations('vehicles');
            if (!mounted) return;
            setVehLoaded(true);
        })();
        return () => { mounted = false; };
    }, [loadRecommendations]);

    React.useEffect(() => {
        if (propsLoaded && vehLoaded) setLoading(false);
    }, [propsLoaded, vehLoaded]);

    // Écouter l'événement de mise à jour des propriétés
    React.useEffect(() => {
        const handlePropertiesUpdate = () => {
            setPropertiesLoading(false);
            const results = applyFilters(properties, filter, commune);
            setFilteredResults(results);
        };
        const handlePropertiesError = () => {
            setPropertiesLoading(false);
        };

        window.addEventListener('ndaku:properties-updated', handlePropertiesUpdate);
        window.addEventListener('ndaku:properties-error', handlePropertiesError);

        // Nettoyage
        return () => {
            window.removeEventListener('ndaku:properties-updated', handlePropertiesUpdate);
            window.removeEventListener('ndaku:properties-error', handlePropertiesError);
        };
    }, [applyFilters, filter, commune]);

    // Comptage des biens par catégorie
    const categoryCounts = React.useMemo(() => {
        const counts = {};
        Object.entries(propertyConfig.categories).forEach(([key, category]) => {
            counts[key] = properties.filter(category.filter).length;
        });
        return counts;
    }, [properties, propertyConfig]);

    // Effet pour mettre à jour les résultats filtrés
    React.useEffect(() => {
        const results = applyFilters(properties, filter, commune);
        setFilteredResults(results);
    }, [properties, filter, commune, applyFilters]);

    // Extraire la liste unique des communes à partir des adresses
    const communes = React.useMemo(() => {
        const all = properties.map(p => {
            // Extraction simple: on prend le dernier mot de l'adresse comme commune (ex: "Gombe, Kinshasa")
            const parts = p.address.split(',').map(s => s.trim());
            if (parts.length > 1) return parts[parts.length - 2];
            return null;
        }).filter(Boolean);
        return Array.from(new Set(all));
    }, [properties]);

    // Cette section n'est plus nécessaire car nous utilisons maintenant filteredResults
    // qui est géré par useEffect et applyFilters

    // Compact testimonials slider (3 visibles, texte réduit)
    const testimonials = React.useMemo(() => ([
        { id: 1, name: 'Aline M.', text: 'Très bonne expérience, service rapide et professionnel.' },
        { id: 2, name: 'Jean K.', text: 'J’ai trouvé ma maison en une semaine. Merci Ndaku!' },
        { id: 3, name: 'Marie T.', text: 'Support réactif et agents compétents.' },
        { id: 4, name: 'Paul D.', text: 'Processus simple et sécurisé, je recommande.' },
        { id: 5, name: 'Lucie R.', text: 'Tarifs transparents et accompagnement sérieux.' }
    ]), []);
    const [tIndex, setTIndex] = React.useState(0);
    const visibleCount = 3;
    const nextTestimonials = () => setTIndex(i => (i + visibleCount) % testimonials.length);
    const prevTestimonials = () => setTIndex(i => (i - visibleCount + testimonials.length) % testimonials.length);
    const visibleTestimonials = React.useMemo(() => {
        const out = [];
        for (let k = 0; k < visibleCount; k++) out.push(testimonials[(tIndex + k) % testimonials.length]);
        return out;
    }, [tIndex, testimonials]);

    const navigate = useNavigate();
    const location = useLocation();
    // Booking modal state (moved here so modal is page-level and can be full-screen)
    const [bookingOpen, setBookingOpen] = React.useState(false);
    const [bookingProperty, setBookingProperty] = React.useState(null);
    const [bookingAgent, setBookingAgent] = React.useState(null);

    const openBooking = (property, agent) => {
        setBookingProperty(property);
        setBookingAgent(agent || null);
        setBookingOpen(true);
    };
    const closeBooking = () => {
        setBookingOpen(false);
        setBookingProperty(null);
        setBookingAgent(null);
    };
    const handleBookingSuccess = (data) => {
        // The modal already writes to localStorage and dispatches event 'property-reserved'.
        // Show a snackbar and close the modal.
        try { enqueueSnackbar('Visite réservée — vous recevrez les coordonnées de l’agent', { variant: 'success' }); } catch (e) { /* ignore */ }
        setBookingOpen(false);
    };

    const scrollToId = (id) => {
        try {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else window.location.hash = id;
        } catch (e) { /* ignore */ }
    };

    // Promotion unique salle de fête -30% (each promo gets a stable __key)
    const [promotions, setPromotions] = React.useState([
        {
            __key: 'p1',
            id: 'p1',
            title: 'Salle de fête Gombe - Offre Spéciale',
            excerpt: 'Profitez d’une réduction exceptionnelle de 30% sur la location de notre salle de fête à Gombe ! Offre valable jusqu’à la fin du mois.',
            image: require('../img/salles/promo1.jpg'),
            oldPrice: 1000,
            newPrice: 700,
            likes: 12,
            comments: [{ id: 'c1', author: 'Aline', text: 'Excellente offre !' }]
        }
    ]);

    // per-promo comment open state to view older comments
    const [commentsOpen, setCommentsOpen] = React.useState({});
    const toggleCommentsOpen = (key) => setCommentsOpen(prev => ({ ...prev, [key]: !prev[key] }));

    const ensurePromoKey = (p, i) => p.__key || p.id || p.promoId || `promo-${i}`;

    const toggleLikePromo = (promoKey) => {
        setPromotions(prev => prev.map((p, i) => {
            const key = ensurePromoKey(p, i);
            if (key === promoKey) return { ...p, likes: (p.likes || 0) + 1 };
            return p;
        }));
    };

    // Ajout, réponse, suppression commentaire
    const [replyTo, setReplyTo] = React.useState({}); // { [promoKey]: commentObj|null }
    const user = getCurrentUser();

    const addCommentPromo = (promoKey, text, parentId = null) => {
        if (!text || !text.trim() || !user) return;
        setPromotions(prev => prev.map((p, i) => {
            const key = ensurePromoKey(p, i);
            if (key !== promoKey) return p;
            const newComment = {
                id: Date.now().toString(),
                author: user.name,
                userId: user.id,
                text,
                parentId: parentId || null,
                createdAt: Date.now()
            };
            return { ...p, comments: [...(p.comments || []), newComment] };
        }));
        setReplyTo(rt => ({ ...rt, [promoKey]: null }));
    };

    const deleteCommentPromo = (promoKey, commentId) => {
        setPromotions(prev => prev.map((p, i) => {
            const key = ensurePromoKey(p, i);
            if (key !== promoKey) return p;
            return {
                ...p,
                comments: (p.comments || []).filter(c => c.id !== commentId && c.parentId !== commentId)
            };
        }));
    };

    const handleVisitOrView = (promo, promoIndex) => {
        // append next batch of promotions (up to 10)
        setPromotions(prev => {
            const already = prev.__shownCount || prev.length || 0;
            const next = promoData.slice(already, already + 10).map((item, idx) => {
                const prop = item.property || {};
                return {
                    ...prop,
                    __key: prop.__key || prop.id || item.promoId || `promo-${already + idx}`,
                    _promoMeta: { promoId: item.promoId, discountPercent: item.discountPercent },
                    likes: prop.likes || 0,
                    comments: prop.comments || []
                };
            });
            const newList = [...prev, ...next];
            newList.__shownCount = already + next.length;
            return newList;
        });
        // navigate to property details (if id available)
        const id = promo.id || promo.propertyId || '';
        if (id) navigate(`/property/${id}`);
    };

    // Show notification if a navigation state message was passed (e.g. after successful payment)
    React.useEffect(() => {
        try {
            const msg = location?.state?.message;
            if (msg) {
                enqueueSnackbar(msg, { variant: 'success', autoHideDuration: 7000 });
                // Clear the navigation state so the toast doesn't reappear on back/refresh
                navigate(location.pathname, { replace: true, state: {} });
            }
        } catch (e) { /* ignore */ }
    }, [location, navigate, enqueueSnackbar]);

    // Hero slider component: multiple SVG-clipped images with captions and zoom animation
    const HeroSlider = () => {
        const slides = [
            { img: require('../img/about.jpg'), title: 'Annonces vérifiées', subtitle: 'Agents certifiés' },
            { img: require('../img/property-4.jpg'), title: 'Appartements récents', subtitle: 'Qualité & emplacement' },
            { img: require('../img/salles/promo1.jpg'), title: 'Offres spéciales', subtitle: 'Réductions limitées' }
        ];
        const [index, setIndex] = React.useState(0);
        const [paused, setPaused] = React.useState(false);
        const intervalRef = React.useRef(null);

        const next = React.useCallback(() => setIndex(i => (i + 1) % slides.length), [slides.length]);
        const prev = React.useCallback(() => setIndex(i => (i - 1 + slides.length) % slides.length), [slides.length]);

        React.useEffect(() => {
            if (paused) return;
            intervalRef.current = setInterval(() => next(), 4800);
            return () => clearInterval(intervalRef.current);
        }, [next, paused]);

        const handleMouseEnter = () => { setPaused(true); };
        const handleMouseLeave = () => { setPaused(false); };

        return (
            <div className="hero-illustration hero-slider" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} aria-hidden>
                <svg viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <clipPath id="heroClipMain">
                            <path d="M40,20 L820,40 L880,300 L760,560 L120,520 L40,300 Z" />
                        </clipPath>
                    </defs>
                    {/* Render only the active slide image (key forces remount to restart CSS animation) */}
                    <image key={index} className={`hero-img hero-slide`} clipPath="url(#heroClipMain)" href={slides[index].img} x="0" y="0" width="900" height="600" preserveAspectRatio="xMidYMid slice" />
                    <rect x="0" y="0" width="900" height="600" fill="rgba(2,6,23,0.02)" />
                    <g className="hero-deco" transform="translate(540,-20)">
                        <circle cx="40" cy="40" r="120" fill="var(--pro-accent)" opacity="0.06" />
                        <circle cx="220" cy="120" r="80" fill="var(--pro-accent-2)" opacity="0.06" />
                    </g>
                </svg>

                {/* caption overlay */}
                <div className="hero-caption">
                    <div className="caption-title">{slides[index].title}</div>
                    <div className="caption-sub">{slides[index].subtitle}</div>
                </div>

                {/* controls */}
                <button aria-label="Précédent" className="hero-arrow hero-arrow-left" onClick={prev}>&lsaquo;</button>
                <button aria-label="Suivant" className="hero-arrow hero-arrow-right" onClick={next}>&rsaquo;</button>
                {/* small indicators */}
                <div className="hero-indicators">
                    {slides.map((s, i) => (
                        <button key={i} className={`indicator ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`}></button>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return <Preloader />;
    return (
        <HomeLayout>
            {/* attach auto reveal to many page blocks for scroll animations */}
            <AutoReveal />
            {/* Navbar Bootstrap custom réutilisée */}
            {/* Nouveau Hero : spotlight Immobilier (SVG découpé, stats animées) */}
            <section className="landing-hero">
                <div className="container hero-inner">
                    <div className="hero-left hero-fade-up text-center">
                        <h1 className="hero-title">Ndaku — La plateforme immobilière de Kinshasa</h1>
                        <p className="hero-sub text-center">Trouvez, louez ou vendez des maisons, appartements, terrains et salles — confiance, transparence et agents certifiés. Inspirez-vous des expériences modernes de marketplaces internationales pour une navigation fluide.</p>


                        {/* ajouter une image visible uniquemen tpour le mobile */}
                        <div className='banniere-mobile mb-4'>
                            <img src={img6} alt="bannier" style={{ marginBotton: '2vh', width: '100%', height: '400px' }} />

                        </div>
                        <div className="hero-ctas" style={{ justifyContent: 'center' }}>
                            <Button onClick={() => scrollToId('biens')} variant="" startIcon={<FaHome />} sx={{ textTransform: 'none', borderRadius: 1, paddingTop: '10px', paddingBottom: '10px', border: "1px solid #00a8a7", color: '#00a8a7' }}> Voir les biens </Button>
                            <Button variant="" onClick={() => scrollToId('agents')} startIcon={<FaHome />} sx={{ textTransform: 'none', borderRadius: 1, paddingTop: '10px', paddingBottom: '10px', border: "1px solid #00a8a7", color: '#00a8a7' }}> Voir agents </Button>
                        </div>
                        <div className="hero-stats" aria-hidden>
                            <div className="stat-cards-pro-row">
                                <StatCardPro icon={<FaHome />} label="Biens listés" value={properties.length} accent="#00cdf2" />
                                <StatCardPro icon={<FaUserTie />} label="Agents certifiés" value={agents.length} accent="#764ba2" />
                                <StatCardPro icon={<FaHandshake />} label="Visites planifiées" value={Math.max(12, Math.floor(properties.length * 0.18))} accent="#d7263d" />
                            </div>
                        </div>
                    </div>

                    <div className="hero-right hero-fade-up">
                        <HeroSlider />
                    </div>
                </div>
            </section>

            {/* Bannière choix agent/propriétaire - improved with background image and glass CTA */}
            <section className="container-fluid agent-banner py-5 animate__animated animate__fadeInDown" aria-label="Bannière agent ou propriétaire" style={{ color: isDark ? theme.palette.text.primary : '#fff' }}>
                <div className="agent-banner-inner container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <FaUserTie className="agent-banner-icon text-white" size={44} />
                        <div>
                            <div className="fw-bold fs-4 agent-title">Vous êtes agent ou propriétaire ?</div>
                            <div className="agent-subtext text-white-80">Publiez vos annonces ou rejoignez notre réseau d'agents certifiés — simple et sécurisé.</div>
                        </div>
                    </div>

                    <div className="d-flex gap-2 mt-3 mt-md-0">
                        <Link to="/agency/Onboard" style={{ textDecoration: 'none' }}>
                            <MuiButton variant="contained" color="primary" sx={{ px: 3 }} startIcon={<FaBuilding />} className='owner-btn-primary'> Agence </MuiButton>
                        </Link>
                        <Link to="/owner/onboard" style={{ textDecoration: 'none' }}>
                            <Button variant="outlined" color="inherit" sx={{ px: 3 }} startIcon={<FaHandshake />} className='owner-btn-outline'> Propriétaire </Button>
                        </Link>
                    </div>

                </div>
            </section>

            {/* Cleaned Agency section: concise, airy, professional */}
            <section className="services-section-modern" id="agence" aria-labelledby="agence-heading">
                <div className="services-wrapper">
                    {/* Left Side - Hero */}
                    <div className="services-hero-left">
                        <div className="services-hero-circle">
                            <FaBuilding />
                        </div>
                        <h2 className="services-hero-title">Ndaku</h2>
                        <p className="services-hero-subtitle">Visibilité, qualification et sécurité pour vos transactions immobilières — des solutions claires et efficaces pour vendre ou louer.</p>
                    </div>

                    {/* Right Side - Services */}
                    <div className="services-right">
                        <h3 id="agence-heading" className="fw-bold" style={{ fontSize: '2.8rem', color: 'var(--primary-dark)', marginBottom: '1rem' }}>Nos services clés</h3>
                        <div className="services-cards-grid">
                            <div className="service-card-modern">
                                <div className="service-card-icon"><FaCertificate /></div>
                                <div className="service-card-content">
                                    <div className="service-card-title">Agents certifiés</div>
                                    <div className="service-card-desc">Sélection et accompagnement pro pour des transactions fiables.</div>
                                </div>
                            </div>

                            <div className="service-card-modern">
                                <div className="service-card-icon"><FaBullhorn /></div>
                                <div className="service-card-content">
                                    <div className="service-card-title">Marketing pro</div>
                                    <div className="service-card-desc">Photos HD, rédaction professionnelle & diffusion multicanal.</div>
                                </div>
                            </div>

                            <div className="service-card-modern">
                                <div className="service-card-icon"><FaTools /></div>
                                <div className="service-card-content">
                                    <div className="service-card-title">Support légal</div>
                                    <div className="service-card-desc">Vérification documentaire et assistance complète jusqu'à la signature.</div>
                                </div>
                            </div>
                        </div>

                        <div className="services-cta-group">
                            <button className="services-cta-btn services-cta-primary" onClick={() => scrollToId('biens')}>
                                Voir les biens <FaArrowRight />
                            </button>
                            <button className="services-cta-btn services-cta-secondary" onClick={() => scrollToId('agents')}>
                                Contact agent
                            </button>
                        </div>

                        <div className="services-features-badge">
                            <div className="badge-feature">Vérification rapide</div>
                            <div className="badge-feature">Documentation simple</div>
                            <div className="badge-feature">Activation immédiate</div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Section Biens moderne (6 biens, 3 par ligne) */}
            <div className="container py-5" id="biens">
                <div className="section-title text-center mb-4 animate__animated animate__fadeInDown">
                    <span className="icon-circle text-white me-3"><FaHome size={28} /></span>
                    <span className="fw-bold">Découvrez nos meilleures offres immobilières à Kinshasa</span>
                </div>
                <p className="text-center text-muted mb-4 ">Appartements, maisons, terrains, boutiques, magasins : trouvez le bien qui vous correspond vraiment.<br /><span className="text-success">Tala ndako, lopango, biloko nyonso ya sika na Kinshasa !</span></p>
                {/* Filtres intelligents */}
                <div className="filter-cards-container mb-4">
                    <div className="row g-3 justify-content-center">
                        {[
                            { name: 'Tous', icon: <FaHome size={24} /> },
                            { name: 'Résidentiel', icon: <FaHouseUser size={24} /> },
                            { name: 'Commerciaux', icon: <FaStore size={24} /> },
                            { name: 'Terrains', icon: <FaTree size={24} /> },
                            { name: 'Salles de fêtes', icon: <FaGlassCheers size={24} /> },
                            { name: 'Locations', icon: <FaKey size={24} /> }
                        ].map((cat) => (
                            <div className="col-6 col-md-4 col-lg-2" key={cat.name}>
                                <Button
                                    className="filter-card-button"
                                    variant={cat.name === filter ? 'contained' : 'outlined'}
                                    color={cat.name === filter ? 'primary' : 'secondary'}
                                    onClick={() => setFilter(cat.name)}
                                    fullWidth
                                    sx={{
                                        height: '100%',
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 1,
                                        borderRadius: 2,
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: cat.name === filter ? 'translateY(-4px)' : 'none',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            bgcolor: cat.name === filter ? 'var(--ndaku-primary)' : 'var(--ndaku-primary-100)'
                                        }
                                    }}
                                >
                                    <div className={`icon-wrapper ${cat.name === filter ? 'active' : ''}`}>
                                        {cat.icon}
                                    </div>
                                    <div className="filter-card-title">{cat.name}</div>
                                    <div className="filter-card-count">{categoryCounts[cat.name]} biens</div>
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Debug info - à supprimer en production */}
                    <div className="filter-stats-container mt-4 mb-3">
                        <div className="filter-stats-grid">
                            <div className="filter-stat-card">
                                <div className="stat-icon">
                                    <FaFilter className="text-success" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Filtre actif</div>
                                    <div className="stat-value">{filter}</div>
                                </div>
                            </div>
                            <div className="filter-stat-card">
                                <div className="stat-icon">
                                    <FaMapMarkerAlt className="text-success" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Commune</div>
                                    <div className="stat-value">{commune}</div>
                                </div>
                            </div>
                            <div className="filter-stat-card">
                                <div className="stat-icon">
                                    <FaListUl className="text-success" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Résultats</div>
                                    <div className="stat-value">{filteredResults.length}</div>
                                </div>
                            </div>
                        </div>
                        <style jsx>{`
                            .filter-stats-container {
                                background: linear-gradient(to right, var(--ndaku-primary-11), var(--ndaku-primary-11));
                                padding: 1.5rem;
                                border-radius: 16px;
                                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
                            }
                            .filter-stats-grid {
                                display: grid;
                                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                                gap: 1rem;
                                justify-content: center;
                            }
                            .filter-stat-card {
                                display: flex;
                                align-items: center;
                                gap: 1rem;
                                padding: 1rem;
                                background: white;
                                border-radius: 12px;
                                box-shadow: 0 2px 8px var(--ndaku-primary-22);
                                transition: all 0.2s ease;
                            }
                            .filter-stat-card:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 4px 12px var(--ndaku-primary-33);
                            }
                            .stat-icon {
                                width: 40px;
                                height: 40px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: var(--ndaku-primary-100);
                                border-radius: 10px;
                                font-size: 1.2rem;
                            }
                            .stat-info {
                                flex: 1;
                            }
                            .stat-label {
                                font-size: 0.85rem;
                                color: #64748b;
                                margin-bottom: 0.2rem;
                            }
                            .stat-value {
                                font-weight: 600;
                                color: #1e293b;
                                font-size: 1.1rem;
                            }
                        `}</style>
                    </div>
                    <div className="commune-filter-container mt-4 mb-2">
                        <div className="text-center mb-3">
                            <span className="filter-section-title">
                                <FaMapMarkerAlt className="text-success me-2" size={20} />
                                Filtrer par commune
                            </span>
                        </div>
                        <div className="d-flex justify-content-center">
                            <div className="position-relative commune-select-wrapper">
                                <select
                                    className="form-select custom-select-pro"
                                    value={commune}
                                    onChange={e => setCommune(e.target.value)}
                                >
                                    <option value="Toutes">Toutes les communes</option>
                                    {communes.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <div className="select-icon">
                                    <FaMapMarkerAlt className="text-success" size={16} />
                                </div>
                            </div>
                        </div>
                        <style jsx>{`
                            .commune-filter-container {
                                background: linear-gradient(to right, var(--ndaku-primary-11), var(--ndaku-primary-11));
                                padding: 1.5rem;
                                border-radius: 16px;
                            }
                            .filter-section-title {
                                font-weight: 600;
                                font-size: 1.1rem;
                                color: #1e293b;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                            .commune-select-wrapper {
                                position: relative;
                                width: 100%;
                                max-width: 320px;
                            }
                            .custom-select-pro {
                                width: 100%;
                                padding: 12px 40px 12px 16px;
                                font-weight: 500;
                                font-size: 0.95rem;
                                color: #0f172a;
                                background-color: white;
                                border: 2px solid #e2e8f0;
                                border-radius: 12px;
                                appearance: none;
                                transition: all 0.2s ease;
                                cursor: pointer;
                                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                            }
                            .custom-select-pro:hover {
                                border-color: var(--ndaku-primary);
                                box-shadow: 0 2px 12px var(--ndaku-primary-22);
                            }
                            .custom-select-pro:focus {
                                outline: none;
                                border-color: var(--ndaku-primary);
                                box-shadow: 0 0 0 3px var(--ndaku-primary-22);
                            }
                            .select-icon {
                                position: absolute;
                                right: 12px;
                                top: 50%;
                                transform: translateY(-50%);
                                pointer-events: none;
                            }
                        `}</style>
                    </div>
                </div>

                <style jsx>{`
                    .filter-cards-container {
                        margin-top: 1rem;
                    }
                    .filter-card-button {
                        background: white;
                    }
                    .icon-wrapper {
                        width: 48px;
                        height: 48px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 12px;
                        background: var(--ndaku-primary-100);
                        color: var(--ndaku-primary);
                        transition: all 0.3s ease;
                    }
                    .icon-wrapper.active {
                        background: var(--ndaku-primary);
                        color: white;
                    }
                    .filter-card-title {
                        font-weight: 600;
                        font-size: 0.95rem;
                        margin-top: 0.5rem;
                        text-align: center;
                    }
                    .filter-card-count {
                        font-size: 0.85rem;
                        color: #64748b;
                    }
                    .custom-select:focus {
                        border-color: var(--ndaku-primary);
                        box-shadow: 0 0 0 2px var(--ndaku-primary-33);
                    }
                `}</style>
                <div className="row justify-content-center">
                    {filteredResults.slice(0, 6).map((property, idx) => (
                        <ScrollReveal className="col-12 col-md-6 col-lg-4 mb-4 animate-card" key={property.id}>
                            <PropertyCard property={property} onOpenBooking={openBooking} />
                        </ScrollReveal>
                    ))}
                    {filteredResults.length === 0 && (
                        <div className="col-12 text-center py-4">
                            {!propertiesLoading && <p className="text-muted">Aucun bien ne correspond aux critères sélectionnés.</p>}
                            {propertiesLoading && <p className="text-muted">Chargement des biens...</p>}
                        </div>
                    )}
                </div>
                <div className="d-flex justify-content-center mt-3">
                    <Link to="/appartement" style={{ textDecoration: 'none' }}>
                        <Button variant="outlined" color="success" sx={{ px: 4 }}>Voir plus de biens</Button>
                    </Link>
                </div>
                {/* Publicité pour appartements/bureaux récemment construits */}
                <div className="container py-4">
                    <div className="card shadow-sm border-0 p-3" style={{ borderRadius: 12 }}>
                        <div className="row align-items-center g-3">
                            <div className="col-auto" style={{ maxWidth: 350, width: '100%' }}>
                                <img src={require('../img/property-4.jpg')} alt="Appartements neufs" style={{ width: '100%', maxWidth: 350, height: 'auto', objectFit: 'cover', borderRadius: 8 }} />
                            </div>
                            <div className="col">
                                <h5 className="card-title fw-bold text-primary mb-1">Nouveaux appartements & bureaux en ville</h5>
                                <p className="mb-1 text-muted">Promotion exclusive: appartements neufs et espaces de bureaux disponibles en pré-lancement au centre-ville — réservations ouvertes.</p>
                                <div className="d-flex gap-2 mt-2">
                                    <Link to="/appartement" className="btn btn-success btn-sm"> Appartements </Link>
                                    <Link to="/commercials" className="btn btn-outline-secondary btn-sm"> Bureaux </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Véhicules à louer ou à vendre */}
            <div className="container py-5" id="vehicules">
                <div className="section-title text-center mb-4 animate__animated animate__fadeInDown">
                    <span className="icon-circle  text-white me-3"><FaCar size={28} /></span>
                    <span >Véhicules à louer ou à vendre</span>
                </div>
                <p className="text-center text-muted mb-5">Toyota, SUV, berlines, et plus encore : trouvez le véhicule idéal pour vos besoins à Kinshasa.<br /><span>Location ou achat, tout est possible sur Ndaku !</span></p>
                <VehicleList vehicles={(recommendedVehicles && recommendedVehicles.length ? recommendedVehicles.slice(0, 6) : vehicles.slice(0, 6))} />
                <div className="d-flex justify-content-center mt-3">
                    <Link to="/voitures" style={{ textDecoration: 'none' }}>
                        <Button variant="outlined" color="success" sx={{ px: 4 }}>Voir plus de véhicules</Button>
                    </Link>
                </div>

                {/* Publicité produit voiture (ex: constructeur) */}
                <div className="container py-4">
                    <div className="card shadow-sm border-0 p-3 d-flex align-items-center gap-3 card-vehicule" style={{ borderRadius: 12 }}>
                        <img src={require('../img/Toyota car.jpg')} alt="Annonce constructeur" style={{ width: '100%', maxWidth: 350, height: 'auto', objectFit: 'cover', borderRadius: 8 }} />
                        <div className="flex-grow-1">
                            <h5 className="fw-bold mb-1">Promotion constructeur: Toyota RAV4</h5>
                            <p className="mb-1 text-muted">Offre spéciale concession — facilités de financement et garanties incluses. Découvrez le nouveau RAV4 aujourd'hui.</p>
                            <div className="d-flex gap-3 mt-3">
                                <Link to="/voitures" style={{ textDecoration: 'none' }}>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            bgcolor: 'var(--ndaku-primary)',
                                            color: 'white',
                                            '&:hover': {
                                                bgcolor: '#0ea67e',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px var(--ndaku-primary-33)'
                                            },
                                            transition: 'all 0.2s ease',
                                            borderRadius: '12px',
                                            padding: '8px 20px',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Voir l'offre
                                    </Button>
                                </Link>
                                <Button
                                    variant="outlined"
                                    component="a"
                                    href="#contact"
                                    sx={{
                                        borderColor: '#9ca3af',
                                        color: '#4b5563',
                                        '&:hover': {
                                            borderColor: '#6b7280',
                                            backgroundColor: 'rgba(107, 114, 128, 0.04)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                        },
                                        transition: 'all 0.2s ease',
                                        borderRadius: '12px',
                                        padding: '8px 20px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        textTransform: 'none'
                                    }}
                                >
                                    Contacter le concessionnaire
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Agents moderne */}
            <div className="bg-light py-5" id="agents">
                <div className="container">
                    <div className="section-title text-center mb-4 animate__animated animate__fadeInDown">
                        <span className="icon-circle  text-white me-3"><FaUserFriends size={28} /></span>
                        <span className="fw-bold" >Rencontrez nos agents experts et certifiés à Kinshasa</span>
                    </div>
                    <p className="text-center text-muted mb-5">Des professionnels passionnés, prêts à vous guider et sécuriser chaque étape de votre projet immobilier.<br /><span>Bato ya ndaku oyo bazali na motema!</span></p>
                    <div className="row justify-content-center" style={{ gap: '70px' }}>
                        {(() => {
                            // make agent list deterministic and surface best matches first
                            const sorted = [...agents].sort((a, b) => {
                                // certified first
                                const certA = a.isCertified ? 0 : 1;
                                const certB = b.isCertified ? 0 : 1;
                                if (certA !== certB) return certA - certB;
                                // active status next
                                const statusOrder = s => (s === 'Actif' || s === 'active' ? 0 : 1);
                                const sA = statusOrder(a.status);
                                const sB = statusOrder(b.status);
                                if (sA !== sB) return sA - sB;
                                // then by dealsCount (desc)
                                const da = Number(a.dealsCount || a.deals || 0);
                                const db = Number(b.dealsCount || b.deals || 0);
                                if (db !== da) return db - da;
                                // finally by name
                                return String(a.name || '').localeCompare(String(b.name || ''));
                            });

                            return sorted.slice(0, 6).map(agent => (
                                <ScrollReveal className="col-12 col-md-6 col-lg-4 animate-card" key={agent.id}>
                                    {/* wrapper cliquable pour ouvrir la messagerie */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openContact(agent)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') openContact(agent); }}
                                        style={{ cursor: 'pointer', outline: 'none' }}
                                    >
                                        <AgentCard agent={agent} />
                                    </div>
                                </ScrollReveal>
                            ));
                        })()}
                    </div>
                    <div className="d-flex justify-content-center mt-3">
                        <Link to="/agents" style={{ textDecoration: 'none' }}>
                            <Button variant="outlined" color="success" sx={{ px: 4 }}>Voir plus d'agents</Button>
                        </Link>
                    </div>
                </div>
            </div>


            {/* Modal de messagerie / contact agent */}
            <AgentContactModal agent={selectedAgent} open={contactOpen} onClose={closeContact} />

            {/* Modal de réservation: monté au niveau page pour plein écran */}
            <VisitBookingModal
                open={bookingOpen}
                onClose={closeBooking}
                onSuccess={handleBookingSuccess}
                property={bookingProperty}
                agent={bookingAgent}
            />

            {/* Témoignages utilisateurs — compact, 3 visibles, navigation */}
            <section className="container py-4" aria-label="Avis utilisateurs">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="fw-bold mb-0" style={{ fontSize: '1.4rem' }}>Avis des utilisateurs</h3>
                    <div>
                        <Button className="btns btn-sm btn-outline-secondary me-2" onClick={prevTestimonials} aria-label="Précédent">‹</Button>
                        <Button className="btns btn-sm btn-outline-secondary" onClick={nextTestimonials} aria-label="Suivant">›</Button>
                    </div>
                </div>
                <div className="row g-3">
                    {visibleTestimonials.map(t => (
                        <div key={t.id} className="col-12 col-md-4">
                            <div className="p-3 rounded-3 shadow-sm" style={{ minHeight: 110, fontSize: '0.95rem', background: 'var(--bs-body-bg, #fff)' }}>
                                <div className="d-flex align-items-start gap-2">
                                    <div className="rounded-circle  text-white d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, fontSize: 14 }}>
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="fw-semibold">{t.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                            {t.text.length > 80 ? t.text.slice(0, 80) + '…' : t.text}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Promotion publicitaire unique */}
            <section className="container py-4" aria-label="Promotion salle de fête">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="fw-bold mb-0" style={{ fontSize: '1.6rem', color: '#d7263d' }}>
                        <span style={{ background: '#ffe066', color: '#d7263d', borderRadius: 8, padding: '0.2em 0.7em', fontWeight: 800, fontSize: '1.1rem', marginRight: 12 }}>PROMO -30%</span>
                        Salle de fête à Gombe
                    </h3>
                </div>
                <div className="row g-3">
                    {promotions.slice(0, 1).map(promo => (
                        <div key={promo.id} className="col-12">
                            <div className="promo-salle-card animate-card position-relative d-flex flex-lg-row flex-column align-items-stretch shadow-lg border-0" style={{ background: 'linear-gradient(90deg, #fff 60%, #ffe06622 100%)', borderRadius: 18, overflow: 'hidden', minHeight: 260 }}>
                                <div className="promo-salle-img-wrap flex-shrink-0" style={{ minWidth: 0, width: '100%', maxWidth: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff8e1' }}>
                                    <img src={promo.image} className="promo-salle-img" alt={promo.title} style={{ width: '100%', maxWidth: 340, height: 220, objectFit: 'cover', borderRadius: 16, boxShadow: '0 2px 16px #d7263d22' }} />
                                </div>
                                <div className="promo-salle-body d-flex flex-column justify-content-between p-4" style={{ flex: 1, minWidth: 0 }}>
                                    <div>
                                        <h4 className="promo-salle-title mb-2" style={{ color: '#d7263d', fontWeight: 800, fontSize: '1.25rem' }}>{promo.title}</h4>
                                        <p className="promo-salle-desc mb-3" style={{ fontSize: '1.08rem', color: '#333', fontWeight: 500 }}>{promo.excerpt}</p>
                                        <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                                            <span className="promo-salle-oldprice text-muted" style={{ fontSize: '1.1rem', textDecoration: 'line-through' }}>{promo.oldPrice} $</span>
                                            <span className="promo-salle-newprice" style={{ fontSize: '2rem', color: 'var(--ndaku-primary)', fontWeight: 900 }}>{promo.newPrice} $</span>
                                            <span className="badge bg-danger" style={{ fontSize: '1rem', fontWeight: 700 }}>-30%</span>
                                        </div>
                                        <div className="mb-3">
                                            <span className="badge bg-warning text-dark" style={{ fontSize: '1rem', fontWeight: 600 }}>Offre limitée : réservez avant la fin du mois !</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                                            <Button
                                                variant="outlined"
                                                onClick={() => toggleLikePromo(promo.id)}
                                                sx={{
                                                    borderColor: '#d7263d',
                                                    color: '#d7263d',
                                                    '&:hover': {
                                                        borderColor: '#d7263d',
                                                        backgroundColor: 'rgba(215, 38, 61, 0.04)',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 4px 12px rgba(215, 38, 61, 0.15)'
                                                    },
                                                    transition: 'all 0.2s ease',
                                                    borderRadius: '12px',
                                                    padding: '8px 16px',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.2rem' }}>👍</span>
                                                <span>{promo.likes} J'aime</span>
                                            </Button>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="badge" style={{
                                                    backgroundColor: 'rgba(75, 85, 99, 0.1)',
                                                    color: '#4b5563',
                                                    padding: '8px 12px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500
                                                }}>
                                                    {promo.comments.length} commentaires
                                                </span>
                                            </div>
                                        </div>
                                        <div className="comments-section" style={{
                                            maxHeight: '180px',
                                            overflowY: 'auto',
                                            borderRadius: '12px',
                                            background: 'rgba(249, 250, 251, 0.8)',
                                            padding: '12px',
                                            marginBottom: '16px'
                                        }}>
                                            <ul className="list-unstyled mb-2">
                                                {promo.comments.map(c => (
                                                    <li key={c.id} className="comment-item" style={{
                                                        padding: '8px 12px',
                                                        marginBottom: '8px',
                                                        borderRadius: '8px',
                                                        background: 'white',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                                    }}>
                                                        <strong style={{ color: '#374151' }}>{c.author}:</strong>
                                                        <span style={{ color: '#6b7280', marginLeft: '8px' }}>{c.text}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <CommentInput onAdd={(author, text) => addCommentPromo(promo.id, author || 'Anonyme', text)} />
                                    </div>
                                </div>
                                <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 2 }}>
                                    <span className="badge bg-danger" style={{ fontSize: '1.1rem', fontWeight: 700, padding: '0.7em 1.2em', boxShadow: '0 2px 8px #d7263d33' }}>-30%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Promotions section avec PromoCard - Design professionnel */}
            <section className="container py-4" aria-label="Promotions">
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h3 className="fw-bold mb-0" style={{ fontSize: '1.6rem', color: '#d7263d' }}>
                            🔥 Offres en promotion
                        </h3>
                        <p className="text-muted mt-2 mb-0">Les meilleures réductions du moment</p>
                    </div>
                </div>
                <div className="row g-4">
                    {promotions && promotions.length > 0 ? promotions.map((p, i) => {
                        const promoKey = ensurePromoKey(p, i);
                        return (
                            <div key={promoKey} className="col-12 col-lg-6">
                                <PromoCard
                                    id={p.id || promoKey}
                                    promoId={p._promoMeta?.promoId || promoKey}
                                    title={p.name || p.title || 'Offre spéciale'}
                                    description={p.address || p.excerpt || p.description || ''}
                                    image={p.images?.[0] || p.image || require('../img/property-1.jpg')}
                                    oldPrice={p.oldPrice}
                                    newPrice={p.newPrice}
                                    discountPercent={p._promoMeta?.discountPercent}
                                    likes={p.likes || 0}
                                    comments={p.comments || []}
                                    category={p.category || 'Immobilier'}
                                    isHot={i === 0}
                                    isTrending={i % 2 === 0}
                                    onLike={(id) => toggleLikePromo(promoKey)}
                                    onShare={(id) => {
                                        const shareUrl = `${window.location.origin}${window.location.pathname}#promo-${promoKey}`;
                                        if (navigator.share) {
                                            navigator.share({ title: p.title || p.name, text: p.excerpt || '', url: shareUrl }).catch(() => { });
                                        } else if (navigator.clipboard) {
                                            navigator.clipboard.writeText(shareUrl).then(() => {
                                                setInfoMsg('Lien de l\'offre copié dans le presse-papiers');
                                                setInfoOpen(true);
                                            }).catch(() => {
                                                setInfoMsg('Impossible de copier le lien');
                                                setInfoOpen(true);
                                            });
                                        } else {
                                            setInfoMsg('Partage non disponible sur ce navigateur');
                                            setInfoOpen(true);
                                        }
                                    }}
                                    onComment={(id, text) => addCommentPromo(promoKey, text)}
                                />
                            </div>
                        );
                    }) : (
                        <div className="col-12 text-center py-5">
                            <div className="text-muted" style={{ fontSize: '1.1rem' }}>
                                🎉 Aucune offre en promotion pour le moment. Revenez bientôt !
                            </div>
                        </div>
                    )}
                </div>
                {/* Load more button */}
                <div className="d-flex justify-content-center mt-5">
                    <Button
                        className="btn btn-lg btn-success fw-bold px-5"
                        variant='outlined'
                        onClick={() => {
                            setPromotions(prev => {
                                const already = prev.__shownCount || prev.length || 0;
                                const next = promoData.slice(already, already + 10).map(item => {
                                    const prop = item.property || {};
                                    return {
                                        ...prop,
                                        __key: prop.__key || prop.id || item.promoId || `promo-${already + Math.random()}`,
                                        _promoMeta: { promoId: item.promoId, discountPercent: item.discountPercent },
                                        likes: prop.likes || 0,
                                        comments: prop.comments || []
                                    };
                                });
                                const newList = [...prev, ...next];
                                newList.__shownCount = already + next.length;
                                return newList;
                            });
                        }}
                        style={{

                            border: 'none',
                            borderRadius: '12px',
                            padding: '14px 40px',
                            fontSize: '1.05rem',
                            color: 'white',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            boxShadow: '0 6px 20px rgba(15, 81, 50, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-3px)';
                            e.target.style.boxShadow = '0 8px 28px rgba(15, 81, 50, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 6px 20px rgba(15, 81, 50, 0.3)';
                        }}
                    >
                        ⬇️ Voir plus d'offres
                    </Button>
                </div>
            </section>

            {/* Carte interactive des biens et position utilisateur */}
            <div className="container" style={{ paddingBottom: "3vh" }}>
                <div className="section-title text-center mb-3 animate__animated animate__fadeInDown">
                    <span className="icon-circle  text-white me-3"><FaMapMarkerAlt size={28} /></span>
                    <span className="fw-bold" style={{ fontSize: '2rem', color: theme.palette.text.primary }}>Carte des biens à Kinshasa</span>
                </div>
                <MapView />
            </div>

            {/* Call to action */}
            <div className=" text-white text-center py-5" style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: 'var(--ndaku-primary)',
            }}>
                <div className="container">
                    <h5 className="fw-bold mb-3 fs-3 text-white">Vous êtes agent ou propriétaire ?</h5>
                    <p className="mb-4 fs-5 text-white">Inscrivez-vous gratuitement, publiez vos biens et bénéficiez d’une visibilité maximale sur Ndaku.</p>
                    <Button variant="outlined" color="inherit" sx={{ fontSize: '1.05rem', minWidth: 'min(180px, 60vw)', borderColor: 'rgba(255,255,255,0.6)', color: 'white' }} onClick={() => scrollToId('agence')}>Devenir agent</Button>
                </div>
            </div >



            <FooterPro />
            <InfoModal open={infoOpen} title={'Information'} message={infoMsg} onClose={() => setInfoOpen(false)} />
            {/* ChatWidget MongoDB-style, always present */}
        </HomeLayout>
    );
};

export default Home;
// Petit composant inline pour l'input de commentaire (concise, réutilisable)
// Utilitaire pour récupérer l'utilisateur connecté
function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem('ndaku_user'));
        if (user && user.id && user.name) return user;
    } catch (e) { }
    return null;
}

// ----------------- Small utilities for the hero stats -----------------
function useCountUp(end, { duration = 900 } = {}) {
    const [value, setValue] = React.useState(0);
    const rafRef = React.useRef(null);
    const startRef = React.useRef(null);

    React.useEffect(() => {
        let mounted = true;
        const start = () => {
            startRef.current = performance.now();
            const loop = (now) => {
                if (!mounted) return;
                const elapsed = now - startRef.current;
                const t = Math.min(1, elapsed / duration);
                const current = Math.round(t * end);
                setValue(current);
                if (t < 1) rafRef.current = requestAnimationFrame(loop);
            };
            rafRef.current = requestAnimationFrame(loop);
        };
        // if end is zero, show 0 immediately
        if (!end) { setValue(0); return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); }; }
        start();
        return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [end, duration]);

    return value;
}

function StatCard({ label, value }) {
    const animated = useCountUp(value, { duration: 1100 });
    return (
        <div className="stat-card animate-card" style={{
            background: '#f5f5f5',
            borderRadius: 12,
            minWidth: 0,
            flex: 1,
            margin: '0 0.7rem',
            padding: '1.2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div className="stat-value" style={{
                fontWeight: 700,
                fontSize: '1.8rem',
                color: '#333',
                marginBottom: 6,
            }}>{animated}</div>
            <div className="stat-label" style={{
                fontWeight: 600,
                fontSize: '1rem',
                color: '#666',
                textAlign: 'center',
            }}>{label}</div>
        </div>
    );
}

// Nouveau StatCardPro : design glassmorphism, icône, animation, premium
function StatCardPro({ icon, label, value, accent }) {
    const animated = useCountUp(value, { duration: 1100 });
    return (
        <div className="stat-card-pro animate-card" style={{
            background: 'rgba(255,255,255,0.18)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
            borderRadius: 18,
            border: `1.5px solid ${accent || '#e0e0e0'}`,
            minWidth: 0,
            flex: 1,
            margin: '0 0.7rem',
            padding: '1.5rem 1.2rem 1.1rem 1.2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'box-shadow 0.18s, transform 0.18s',
            cursor: 'pointer',
            overflow: 'hidden',
        }}>
            <div className="stat-pro-icon" style={{
                background: accent,
                color: '#fff',
                borderRadius: '50%',
                width: 54,
                height: 54,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                marginBottom: 18,
                boxShadow: `0 2px 12px ${accent}33`,
            }}>{icon}</div>
            <div className="stat-pro-value" style={{
                fontWeight: 900,
                fontSize: '2.2rem',
                color: accent,
                letterSpacing: '-1px',
                marginBottom: 6,
                textShadow: '0 2px 8px #0001',
            }}>{animated}</div>
            <div className="stat-pro-label" style={{
                fontWeight: 600,
                fontSize: '1.08rem',
                color: '#222',
                opacity: 0.85,
                textAlign: 'center',
                letterSpacing: '-0.2px',
            }}>{label}</div>
        </div>
    );
}

function CommentInput({ onAdd, replyingTo, onCancelReply }) {
    const [text, setText] = React.useState('');
    const user = getCurrentUser();
    if (!user) {
        return <div className="alert alert-warning py-2 px-3 mb-2">Connectez-vous pour commenter.</div>;
    }
    return (
        <div className="d-flex gap-2 align-items-center mb-2">
            {replyingTo && (
                <span className="badge bg-info text-dark me-2">Réponse à {replyingTo.author}
                    <Button type="button" className="btn btn-link btn-sm p-0 ms-2" onClick={onCancelReply}>Annuler</Button>
                </span>
            )}
            <input
                className="form-control form-control-sm"
                placeholder={replyingTo ? `Répondre à ${replyingTo.author}...` : "Ajouter un commentaire..."}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && text.trim()) {
                        onAdd(text, replyingTo?.id || null);
                        setText('');
                    }
                }}
            />
            <Button className="btn btn-sm btn-success" onClick={() => { if (text.trim()) { onAdd(text, replyingTo?.id || null); setText(''); } }}>Envoyer</Button>
        </div>
    );
}