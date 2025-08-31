import React from 'react';
import MessengerWidget from '../components/common/Messenger';
import { useTheme } from '@mui/material/styles';
import { FaUserTie,FaFilter,FaListUl, FaBuilding, FaArrowRight, FaHandshake, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaHome, FaUserFriends, FaCommentDots, FaCar, FaHouseUser, FaStore, FaTree, FaGlassCheers, FaKey } from 'react-icons/fa';
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
// import './auth.css';
import Preloader from '../components/common/Preloader';
import PropertyCard from '../components/property/PropertyCard';
import AgentCard from '../components/agent/AgentCard';
import ScrollReveal from '../components/common/ScrollReveal';
import AgentContactModal from '../components/common/Messenger';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Stack, Typography, IconButton, useMediaQuery, Button } from '@mui/material';
import authService from '../services/authService';

const Home = () => {
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

    // État local pour les résultats filtrés
    const [filteredResults, setFilteredResults] = React.useState(properties);
    
    // Comptage des biens par catégorie
    const categoryCounts = React.useMemo(() => {
        const counts = {};
        Object.entries(propertyConfig.categories).forEach(([key, category]) => {
            counts[key] = properties.filter(category.filter).length;
        });
        return counts;
    }, [properties, propertyConfig]);

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

    if (loading) return <Preloader />;
    return (
        <>
            {/* Navbar Bootstrap custom réutilisée */}
            <Navbar />

            {/* Hero Section moderne Kinshasa */}
            <section
                className="container-fluid hero-section d-flex align-items-center justify-content-center px-0"
                style={{ background: '#fff', color: theme.palette.text.primary, maxWidth: '100vw', overflowX: 'hidden' }}
            >
                <div className="row w-100 g-0 align-items-stretch" style={{ maxWidth: '100%', margin: 0 }}>
                    <div className="titr col-12 col-md-6 d-flex align-items-center justify-content-center text-section px-4 px-md-5">
                        <div className="w-100" style={{ maxWidth: 700 }}>
                            <h1
                                className="hero-title mb-4 display-2"

                            >
                                Trouvez le bien idéal à Kinshasa
                            </h1>
                            <p className="hero-desc mb-3">
                                Bienvenue sur <span>Ndaku</span>, la plateforme immobilière moderne pour <span>Kinshasa</span> et ses environs. Découvrez, louez ou vendez maisons, appartements, terrains et plus encore, avec l’aide de nos agents de confiance.
                            </p>
                            <p className="hero-desc mb-4">
                                <span>Tika kobanga !</span> Ndaku ezali mpo na yo, pona kozwa ndako, lopango, to koteka biloko na confiance na Kinshasa.
                            </p>
                            <div className='align-items-center justify-content-center' style={{ display: "flex" }}>
                                <MuiButton
                                    onClick={() => scrollToId('biens')}
                                    variant="contained"
                                    startIcon={<FaHome />}
                                    sx={{
                                        bgcolor: 'var(--ndaku-primary)',
                                        color: 'white',
                                        alignSelf: 'flex-start',
                                        textTransform: 'none',
                                        px: 3,
                                        '&:hover': {
                                            bgcolor: '#10a37f',
                                            transform: 'translateY(-2px)',
                                            transition: 'all 0.2s'
                                        }
                                    }}
                                >
                                    Voir les biens
                                </MuiButton>
                            </div>

                        </div>
                    </div>
                    <div className="col-12 col-md-6 d-flex align-items-stretch carousel-section p-0">
                        <div className="w-100 h-100 carousel-box d-flex align-items-center justify-content-center">
                            <LandingCarousel controlsOnSeparator color="var(--ndaku-primary)" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Bannière choix agent/propriétaire */}
            <div
                className="container-fluid py-4 animate__animated animate__fadeInDown"
                style={{ background: isDark ? theme.palette.background.paper : '#e9f7f3', color: theme.palette.text.primary }}
            >
                <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <FaUserTie className="text-success" size={38} />
                        <span className="fw-bold fs-4" style={{ color: theme.palette.text.primary }}>Vous êtes agent ou propriétaire ?</span>
                    </div>
                    <div className="d-flex gap-2 mt-3 mt-md-0">
                        <Link to="/agency/Onboard" style={{ textDecoration: 'none' }}>
                           <MuiButton variant="outlined" color="success" sx={{ px: 3 }} startIcon={<FaBuilding />} className='btn-home'> Agence</MuiButton>
                        </Link>
                        <Link to="/owner/onboard" style={{ textDecoration: 'none' }}>
                           <Button variant="outlined" color="success" sx={{ px: 3 }} startIcon={<FaHandshake />} className='btn-home'>Propriétaire</Button>
                        </Link>
                    </div>
                    <div className="d-none d-md-block">
                        <FaArrowRight className="text-secondary" size={32} />
                    </div>
                </div>
            </div>

            {/* Section Agence Immobilière Présentation améliorée */}
            <section className="container py-5 animate__animated animate__fadeInUp" id="agence">
                <div className="row align-items-center">
                    <div className="col-12 col-md-5 mb-4 mb-md-0 d-flex justify-content-center">
                        <div className="position-relative" style={{ maxWidth: 320, width: '100%' }}>
                            <img src={require('../img/about.jpg')} alt="Ndaku Agence Immobilière" className="img-fluid rounded-4 shadow-lg border border-3 border-success" style={{ width: '100%', objectFit: 'cover', minHeight: 160, maxHeight: 420, background: theme.palette.background.paper }} />
                            <div className="position-absolute top-0 start-0 translate-middle bg-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: 64, height: 64, boxShadow: '0 2px 8px #0002' }}>
                                <FaBuilding className="text-white" size={32} />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-7">
                        <h3 className="fw-bold text-success mb-3 d-flex align-items-center gap-2 animate__animated animate__pulse animate__delay-1s">
                            <FaBuilding className="me-2" /> Ndaku Agence Immobilière
                        </h3>
                        <p className="mb-2" >Votre <span >partenaire de confiance</span> pour l’achat, la vente et la location de biens immobiliers à Kinshasa et ses environs. Notre équipe expérimentée vous accompagne à chaque étape de votre projet, avec <span >professionnalisme</span>, <span >écoute</span> et <span >transparence</span>.</p>
                        <p className="mb-2" >Tosali mpo na yo : kobongisa, koteka, to kozwa ndako na confiance. Biso tozali awa pona kosalisa yo na biloko nyonso ya ndaku.</p>
                        <ul className="list-unstyled mb-3">
                            <li className="mb-2 d-flex align-items-center gap-2"><FaMapMarkerAlt className="text-success" /> <strong>Adresse :</strong> 10 Avenue du Commerce, Gombe, Kinshasa</li>
                            <li className="mb-2 d-flex align-items-center gap-2"><FaPhoneAlt className="text-success" /> <strong>Téléphone :</strong> +243 900 000 000</li>
                            <li className="mb-2 d-flex align-items-center gap-2"><FaEnvelope className="text-success" /> <strong>Email :</strong> contact@ndaku.cd</li>
                        </ul>
                        <div className="d-flex gap-2 mt-4">
                           <Button onClick={() => scrollToId('biens')} variant="outlined" color="success" className="animate__animated animate__pulse animate__infinite">Découvrir nos biens</Button>
                           <Button onClick={() => scrollToId('agents')} variant="outlined" color="success">Rencontrer nos agents</Button>
                        </div>
                    </div>
                </div>
            </section>


            {/* Section Biens moderne (6 biens, 3 par ligne) */}
            <div className="container py-5" id="biens">
                <div className="section-title text-center mb-4 animate__animated animate__fadeInDown">
                    <span className="icon-circle bg-success text-white me-3"><FaHome size={28} /></span>
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
                            <PropertyCard property={property} />
                        </ScrollReveal>
                    ))}
                    {filteredResults.length === 0 && (
                        <div className="col-12 text-center py-4">
                            <p className="text-muted">Aucun bien ne correspond aux critères sélectionnés.</p>
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
                    <span className="icon-circle bg-success text-white me-3"><FaCar size={28} /></span>
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
                        <span className="icon-circle bg-success text-white me-3"><FaUserFriends size={28} /></span>
                        <span className="fw-bold" >Rencontrez nos agents experts et certifiés à Kinshasa</span>
                    </div>
                    <p className="text-center text-muted mb-5">Des professionnels passionnés, prêts à vous guider et sécuriser chaque étape de votre projet immobilier.<br /><span>Bato ya ndaku oyo bazali na motema!</span></p>
                    <div className="row justify-content-center">
                        {agents.slice(0, 6).map(agent => (
                            <ScrollReveal className="col-12 col-md-6 col-lg-4 animate-card" key={agent.id}>
                                {/* wrapper cliquable pour ouvrir la messagerie */}
                                <div
                                    role="Buttons"
                                    tabIndex={0}
                                    onClick={() => openContact(agent)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') openContact(agent); }}
                                    style={{ cursor: 'pointer', outline: 'none' }}
                                >
                                    <AgentCard agent={agent} />
                                </div>
                            </ScrollReveal>
                        ))}
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
                                    <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, fontSize: 14 }}>
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

            {/* Promotions section: Voir plus d'offre (batching) - full width professional cards */}
            <section className="container py-4" aria-label="Promotions">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="fw-bold mb-0" style={{ fontSize: '1.6rem', color: '#d7263d' }}>Offres en promotion</h3>
                </div>
                <div className="row g-3">
                    {promotions && promotions.length > 0 ? promotions.map((p, i) => {
                        const promoKey = ensurePromoKey(p, i);
                        const likes = p.likes || 0;
                        const comments = p.comments || [];
                        return (
                            <div key={promoKey} id={`promo-${promoKey}`} className="col-12">
                                <div className="promo-salle-card animate-card position-relative d-flex flex-lg-row flex-column align-items-stretch shadow-lg border-0" style={{ background: 'linear-gradient(90deg, #fff 60%, #ffe06622 100%)', borderRadius: 18, overflow: 'hidden', minHeight: 220 }}>
                                    <div className="promo-salle-img-wrap flex-shrink-0" style={{ minWidth: 0, width: '100%', maxWidth: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff8e1' }}>
                                        <img src={p.images?.[0] || p.image || require('../img/property-1.jpg')} className="promo-salle-img" alt={p.name || p.title} style={{ width: '100%', maxWidth: 340, height: 220, objectFit: 'cover', borderRadius: 16, boxShadow: '0 2px 16px #d7263d22' }} />
                                    </div>
                                    <div className="promo-salle-body d-flex flex-column justify-content-between p-4" style={{ flex: 1, minWidth: 0 }}>
                                        <div>
                                            <h4 className="promo-salle-title mb-2" style={{ color: '#d7263d', fontWeight: 800, fontSize: '1.25rem' }}>{p.name || p.title}</h4>
                                            <p className="promo-salle-desc mb-3" style={{ fontSize: '1.08rem', color: '#333', fontWeight: 500 }}>{p.address || p.excerpt || ''}</p>
                                            <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                                                {p.oldPrice && <span className="promo-salle-oldprice text-muted" style={{ fontSize: '1.1rem', textDecoration: 'line-through' }}>{p.oldPrice} $</span>}
                                                {p.newPrice && <span className="promo-salle-newprice" style={{ fontSize: '2rem', color: 'var(--ndaku-primary)', fontWeight: 900 }}>{p.newPrice} $</span>}
                                                {p._promoMeta && p._promoMeta.discountPercent && <span className="badge bg-danger" style={{ fontSize: '1rem', fontWeight: 700 }}>-{p._promoMeta.discountPercent}%</span>}
                                            </div>
                                            {p.description && <div className="mb-2 text-secondary small">{p.description}</div>}
                                            <div className="mb-3">
                                                <span className="badge bg-warning text-dark" style={{ fontSize: '1rem', fontWeight: 600 }}>Offre limitée : réservez avant la fin du mois !</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="d-flex align-items-center gap-3 mb-2 flex-wrap">
                                               <Button className="btn btn-sm btn-outline-danger fw-bold px-3" onClick={() => toggleLikePromo(promoKey)}>
                                                    👍 {likes} J'aime
                                               </Button>
                                                <small className="text-muted">{comments.length} commentaires</small>
                                               <Button className="btn btn-sm btn-outline-secondary" onClick={() => {
                                                    const shareUrl = `${window.location.origin}${window.location.pathname}#promo-${promoKey}`;
                                                    if (navigator.share) {
                                                        navigator.share({ title: p.title || p.name, text: p.excerpt || '', url: shareUrl }).catch(() => { });
                                                    } else if (navigator.clipboard) {
                                                        navigator.clipboard.writeText(shareUrl).then(() => {
                                                            setInfoMsg('Lien de l’offre copié dans le presse-papiers');
                                                            setInfoOpen(true);
                                                        }).catch(() => {
                                                            setInfoMsg('Impossible de copier le lien');
                                                            setInfoOpen(true);
                                                        });
                                                    } else {
                                                        setInfoMsg('Partage non disponible sur ce navigateur');
                                                        setInfoOpen(true);
                                                    }
                                                }}>Partager</Button>
                                               <Button className="btn btn-sm btn-success" onClick={() => handleVisitOrView(p, i)}>Voir</Button>
                                            </div>
                                            <ul className="list-unstyled mb-2 w-100" style={{ maxHeight: 80, overflowY: 'auto' }}>
                                                {comments.map(c => (
                                                    <li key={c.id} className="mb-1"><strong>{c.author}:</strong> <span className="text-muted">{c.text}</span></li>
                                                ))}
                                            </ul>
                                            <CommentInput onAdd={(author, text) => addCommentPromo(promoKey, author || 'Anonyme', text)} />
                                            {comments.length > 0 && (
                                                <div className="mt-2">
                                                   <Button className="btn btn-link p-0 small" onClick={() => toggleCommentsOpen(promoKey)}>{commentsOpen[promoKey] ? 'Masquer les commentaires' : `Voir ${comments.length} commentaires`}</Button>
                                                    {commentsOpen[promoKey] && (
                                                        <ul className="list-unstyled mt-2 mb-0 small" style={{ maxHeight: 160, overflowY: 'auto' }}>
                                                            {comments.map(c => (<li key={c.id} className="mb-1"><strong>{c.author}:</strong> <span className="text-muted">{c.text}</span></li>))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 2 }}>
                                        {p._promoMeta && p._promoMeta.discountPercent && <span className="badge bg-danger" style={{ fontSize: '1.1rem', fontWeight: 700, padding: '0.7em 1.2em', boxShadow: '0 2px 8px #d7263d33' }}>-{p._promoMeta.discountPercent}%</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-12 text-muted">Aucune offre en promotion pour le moment.</div>
                    )}
                </div>
                {/* centralized load more Buttons */}
                <div className="d-flex justify-content-center mt-3">
                   <Button className="btn btn-lg btn-success fw-bold" onClick={() => {
                        setPromotions(prev => {
                            const already = prev.__shownCount || prev.length || 0;
                            const next = promoData.slice(already, already + 10).map(item => {
                                const prop = item.property || {};
                                return {
                                    ...prop,
                                    _promoMeta: { promoId: item.promoId, discountPercent: item.discountPercent },
                                    likes: prop.likes || 0,
                                    comments: prop.comments || []
                                };
                            });
                            const newList = [...prev, ...next];
                            newList.__shownCount = already + next.length;
                            return newList;
                        });
                    }}>Voir plus d'offre</Button>
                </div>
            </section>

            {/* Carte interactive des biens et position utilisateur */}
            <div className="container" style={{ paddingBottom: "3vh" }}>
                <div className="section-title text-center mb-3 animate__animated animate__fadeInDown">
                    <span className="icon-circle bg-success text-white me-3"><FaMapMarkerAlt size={28} /></span>
                    <span className="fw-bold" style={{ fontSize: '2rem', color: theme.palette.text.primary }}>Carte des biens à Kinshasa</span>
                </div>
                <MapView />
            </div>

            {/* Call to action */}
            <div className="bg-success text-white text-center py-5" style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <div className="container">
                    <h5 className="fw-bold mb-3 fs-3">Vous êtes agent ou propriétaire ?</h5>
                    <p className="mb-4 fs-5">Inscrivez-vous gratuitement, publiez vos biens et bénéficiez d’une visibilité maximale sur Ndaku.</p>
                   <Button variant="outlined" color="inherit" sx={{ fontSize: '1.05rem', minWidth: 'min(180px, 60vw)', borderColor: 'rgba(255,255,255,0.6)', color: 'white' }} onClick={() => scrollToId('agence')}>Devenir agent</Button>
                </div>
            </div >

          

            <FooterPro />
            <InfoModal open={infoOpen} title={'Information'} message={infoMsg} onClose={() => setInfoOpen(false)} />
            {/* ChatWidget MongoDB-style, always present */}
            <MessengerWidget />
        </>
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
                   <Button type="Buttons" className="btn btn-link btn-sm p-0 ms-2" onClick={onCancelReply}>Annuler</Button>
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




































































































