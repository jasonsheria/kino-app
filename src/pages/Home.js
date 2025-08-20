import React from 'react';
import { useTheme } from '@mui/material/styles';
import { FaUserTie, FaBuilding, FaArrowRight, FaHandshake, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaHome, FaUserFriends, FaCommentDots, FaCar } from 'react-icons/fa';
import Navbar from '../components/common/Navbar';
import InfoModal from '../components/common/InfoModal';
import MapView from '../components/property/MapView';
import FooterPro from '../components/common/FooterPro';
import LandingCarousel from '../components/property/LandingCarousel';
import Button from '../components/common/Button';
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

// --- PKCE helpers (browser) ---
async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
}
function base64UrlEncode(buffer) {
    let str = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        str += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomString(length = 64) {
    const arr = new Uint8Array(length);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec => ('0' + dec.toString(16)).slice(-2)).join('');
}
async function pkceChallengeFromVerifier(verifier) {
    const hashed = await sha256(verifier);
    return base64UrlEncode(hashed);
}

function startGoogleOAuth(onError) {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || window.__env?.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
    if (!clientId) {
        const msg = 'Google client ID not set. Define REACT_APP_GOOGLE_CLIENT_ID in your environment.';
        if (typeof onError === 'function') return onError(msg);
        console.warn(msg);
        return;
    }
    const state = randomString(16);
    const codeVerifier = randomString(64);
    pkceChallengeFromVerifier(codeVerifier).then(codeChallenge => {
        try { localStorage.setItem('ndaku_pkce_code_verifier', codeVerifier); } catch (e) {}
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid profile email',
            include_granted_scopes: 'true',
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            access_type: 'offline'
        });
        const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        window.location.href = url;
    }).catch(err => {
        console.error('ndaku: pkce error', err);
        const msg = 'Impossible de démarrer l’authentification Google. Voir console.';
        if (typeof onError === 'function') return onError(msg);
        console.warn(msg);
    });
}

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

    // Google sign-in toast on first visit (shows once, auto-dismiss)
    const [showGooglePrompt, setShowGooglePrompt] = React.useState(false);
    React.useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const force = params.get('ndaku_force_google');
            console.log('ndaku: google prompt init, force=', force);
            // Determine if user is authenticated by checking common localStorage auth keys
            const authKeys = ['ndaku_user', 'ndaku_auth_token', 'token', 'auth_token'];
            const isAuthed = authKeys.some(k => !!localStorage.getItem(k));
            console.log('ndaku: auth detected=', isAuthed);
            if (isAuthed) return; // don't show when logged in
            if (force === '1') {
                console.log('ndaku: forcing google prompt via URL param');
                setShowGooglePrompt(true);
                return;
            }
            const t = setTimeout(() => {
                console.log('ndaku: showing google prompt (timeout)');
                setShowGooglePrompt(true);
            }, 800);
            return () => clearTimeout(t);
        } catch (e) { /* ignore storage errors */ }
    }, []);

    // auto-hide after 4s when visible (but do not persist seen flag — show again until user logs in)
    React.useEffect(() => {
        if (!showGooglePrompt) return;
        const h = setTimeout(() => {
            setShowGooglePrompt(false);
        }, 4000);
        return () => clearTimeout(h);
    }, [showGooglePrompt]);

    // fetch recommendations on mount and when filters change
    const [recommendedProperties, setRecommendedProperties] = React.useState([]);
    const [recommendedVehicles, setRecommendedVehicles] = React.useState([]);
    const loadRecommendations = React.useCallback(async (kind) => {
        if(kind === 'properties'){
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
    React.useEffect(()=>{
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

    const acceptGoogleSign = () => {
    console.log('ndaku: acceptGoogleSign clicked');
    setShowGooglePrompt(false);
    // Start Google OAuth (Authorization Code + PKCE)
    startGoogleOAuth((errMsg) => {
        setInfoMsg(errMsg || 'Erreur inconnue lors du démarrage de Google OAuth.');
        setInfoOpen(true);
    });
    };

    const dismissGooglePrompt = () => {
        console.log('ndaku: dismissGooglePrompt clicked');
        setShowGooglePrompt(false);
    };

    // Filtres intelligents
            const commercialTypes = ["Place commerciale", "Terrain vide", "Boutique", "Magasin"];
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

            let filteredProperties =
                filter === 'Tous'
                    ? properties
                    : filter === 'Commerciaux'
                    ? properties.filter(p => commercialTypes.includes(p.type))
                    : filter === 'Terrains'
                    ? properties.filter(p => p.type.toLowerCase().includes('terrain'))
                    : filter === 'Salles de fêtes'
                    ? properties.filter(p => p.type.toLowerCase().includes('salle'))
                    : properties.filter(p => !commercialTypes.includes(p.type) && !p.type.toLowerCase().includes('terrain') && !p.type.toLowerCase().includes('salle'));

            if (commune !== 'Toutes') {
                filteredProperties = filteredProperties.filter(p => p.address.includes(commune));
            }

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
    const addCommentPromo = (promoKey, author, text) => {
        if (!text || !text.trim()) return;
        setPromotions(prev => prev.map((p, i) => {
            const key = ensurePromoKey(p, i);
            if (key !== promoKey) return p;
            const newComment = { id: Date.now().toString(), author, text };
            return { ...p, comments: [...(p.comments || []), newComment] };
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
                                style={{
                                    fontSize: 'clamp(2.5rem, 6vw, 3.2rem)',
                                    fontWeight: 900,
                                    background: 'linear-gradient(90deg, #13c296 0%, #0a223a 60%, #d7263d 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    letterSpacing: '-1.5px',
                                    lineHeight: 1.08,
                                    marginBottom: '1.2rem',
                                    textShadow: '0 2px 12px #13c29622',
                                    textAlign: 'left',
                                    maxWidth: '100%'
                                }}
                            >
                                Trouvez le bien idéal à Kinshasa
                            </h1>
                            <p className="hero-desc mb-3" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.1rem)', color: '#0a223a', fontWeight: 500, textShadow: '0 1px 4px #13c29611' }}>
                                Bienvenue sur <span style={{ color: '#13c296', fontWeight: 700 }}>Ndaku</span>, la plateforme immobilière moderne pour <span style={{ color: '#d7263d', fontWeight: 700 }}>Kinshasa</span> et ses environs. Découvrez, louez ou vendez maisons, appartements, terrains et plus encore, avec l’aide de nos agents de confiance.
                            </p>
                            <p className="hero-desc mb-4" style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>
                                <span style={{ fontWeight: 700, color: '#13c296' }}>Tika kobanga !</span> Ndaku ezali mpo na yo, pona kozwa ndako, lopango, to koteka biloko na confiance na Kinshasa.
                            </p>
                            <Button onClick={() => scrollToId('biens')} color="success" variant="contained" sx={{ fontWeight: 800, boxShadow: '0 6px 20px rgba(19,194,150,0.12)' }}>Voir les biens</Button>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 d-flex align-items-stretch carousel-section p-0">
                        <div className="w-100 h-100 carousel-box d-flex align-items-center justify-content-center">
                            <LandingCarousel controlsOnSeparator color="#13c296" />
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
                                                    <Button variant="outlined" color="success" sx={{ px: 3 }} startIcon={<FaBuilding />} className='btn-home'>Je suis une agence</Button>
                                                </Link>
                                                <Link to="/owner/onboard" style={{ textDecoration: 'none' }}>
                                                    <Button color="success" sx={{ px: 3 }} startIcon={<FaHandshake />} className='btn-home'>Je suis propriétaire</Button>
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
                        <p className="mb-2 fs-5" style={{ color: theme.palette.text.primary }}>Votre <span className="text-success fw-semibold">partenaire de confiance</span> pour l’achat, la vente et la location de biens immobiliers à Kinshasa et ses environs. Notre équipe expérimentée vous accompagne à chaque étape de votre projet, avec <span className="fw-semibold">professionnalisme</span>, <span className="fw-semibold">écoute</span> et <span className="fw-semibold">transparence</span>.</p>
                        <p className="mb-2" style={{ color: theme.palette.text.secondary }}>Tosali mpo na yo : kobongisa, koteka, to kozwa ndako na confiance. Biso tozali awa pona kosalisa yo na biloko nyonso ya ndaku.</p>
                        <ul className="list-unstyled mb-3">
                            <li className="mb-2 d-flex align-items-center gap-2"><FaMapMarkerAlt className="text-success" /> <strong>Adresse :</strong> 10 Avenue du Commerce, Gombe, Kinshasa</li>
                            <li className="mb-2 d-flex align-items-center gap-2"><FaPhoneAlt className="text-success" /> <strong>Téléphone :</strong> +243 900 000 000</li>
                            <li className="mb-2 d-flex align-items-center gap-2"><FaEnvelope className="text-success" /> <strong>Email :</strong> contact@ndaku.cd</li>
                        </ul>
                        <div className="d-flex gap-2 mt-3">
                            <Button onClick={() => scrollToId('biens')} color="success" className="animate__animated animate__pulse animate__infinite">Découvrir nos biens</Button>
                            <Button onClick={() => scrollToId('agents')} variant="outlined" color="success">Rencontrer nos agents</Button>
                        </div>
                    </div>
                </div>
            </section>


            {/* Section Biens moderne (6 biens, 3 par ligne) */}
                        <div className="container py-5" id="biens">
                                <div className="section-title text-center mb-4 animate__animated animate__fadeInDown">
                                    <span className="icon-circle bg-success text-white me-3"><FaHome size={28}/></span>
                                    <span className="fw-bold" style={{fontSize:'2.2rem', color: theme.palette.text.primary, letterSpacing:'-1px'}}>Découvrez nos meilleures offres immobilières à Kinshasa</span>
                                </div>
                                <p className="text-center text-muted mb-4 fs-5">Appartements, maisons, terrains, boutiques, magasins : trouvez le bien qui vous correspond vraiment.<br /><span className="text-success">Tala ndako, lopango, biloko nyonso ya sika na Kinshasa !</span></p>
                                {/* Filtres intelligents */}
                                <div className="d-flex flex-wrap justify-content-center mb-4 gap-2 align-items-center">
                                    {['Tous', 'Résidentiel', 'Commerciaux', 'Terrains', 'Salles de fêtes'].map((cat) => (
                                        <button
                                            key={cat}
                                            className={`btn fw-bold px-3 rounded-pill ${cat === filter ? 'btn-success' : 'btn-outline-success'}`}
                                            style={{minWidth:120}}
                                            onClick={() => setFilter(cat)}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                    <select
                                        className="form-select ms-2"
                                        style={{maxWidth:220, minWidth:140, fontWeight:'bold'}}
                                        value={commune}
                                        onChange={e => setCommune(e.target.value)}
                                    >
                                        <option value="Toutes">Toutes les communes</option>
                                        {communes.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="row justify-content-center">
                                    {(recommendedProperties && recommendedProperties.length ? recommendedProperties.slice(0,6) : filteredProperties.slice(0,6)).map((property, idx) => (
                                        <ScrollReveal className="col-12 col-md-6 col-lg-4 mb-4 animate-card" key={property.id}>
                                            <PropertyCard property={property} />
                                        </ScrollReveal>
                                    ))}
                                </div>
                                <div className="d-flex justify-content-center mt-3">
                                    <Link to="/appartement" style={{ textDecoration: 'none' }}>
                                        <Button variant="outlined" color="success" sx={{ px: 4 }}>Voir plus de biens</Button>
                                    </Link>
                                </div>
                                {/* Publicité pour appartements/bureaux récemment construits */}
                                <div className="container py-4">
                                    <div className="card shadow-sm border-0 p-3" style={{borderRadius:12}}>
                                        <div className="row align-items-center g-3">
                                            <div className="col-auto" style={{ maxWidth: 140, width: '100%' }}>
                                                <img src={require('../img/property-4.jpg')} alt="Appartements neufs" style={{width:'100%', maxWidth:140, height:'auto', objectFit:'cover', borderRadius:8}} />
                                            </div>
                                            <div className="col">
                                                <h5 className="fw-bold mb-1">Nouveaux appartements & bureaux en ville</h5>
                                                <p className="mb-1 text-muted">Promotion exclusive: appartements neufs et espaces de bureaux disponibles en pré-lancement au centre-ville — réservations ouvertes.</p>
                                                <div className="d-flex gap-2">
                                                    <Link to="/appartement" className="btn btn-success btn-sm">Voir les appartements</Link>
                                                    <Link to="/commercials" className="btn btn-outline-secondary btn-sm">Voir les bureaux</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        </div>

            {/* Section Véhicules à louer ou à vendre */}
                        <div className="container py-5" id="vehicules">
                                <div className="section-title text-center mb-4 animate__animated animate__fadeInDown">
                                    <span className="icon-circle bg-success text-white me-3"><FaCar size={28}/></span>
                                    <span className="fw-bold" style={{fontSize:'2.2rem', color: theme.palette.text.primary, letterSpacing:'-1px'}}>Véhicules à louer ou à vendre</span>
                                </div>
                                <p className="text-center text-muted mb-5 fs-5">Toyota, SUV, berlines, et plus encore : trouvez le véhicule idéal pour vos besoins à Kinshasa.<br /><span className="text-success">Location ou achat, tout est possible sur Ndaku !</span></p>
                                                                <VehicleList vehicles={(recommendedVehicles && recommendedVehicles.length ? recommendedVehicles.slice(0,6) : vehicles.slice(0,6))} />
                                                                    <div className="d-flex justify-content-center mt-3">
                                                                        <Link to="/voitures" style={{ textDecoration: 'none' }}>
                                                                            <Button variant="outlined" color="success" sx={{ px: 4 }}>Voir plus de véhicules</Button>
                                                                        </Link>
                                                                    </div>
                        
                                                                    {/* Publicité produit voiture (ex: constructeur) */}
                                                                    <div className="container py-4">
                                                                        <div className="card shadow-sm border-0 p-3 d-flex flex-row align-items-center gap-3" style={{borderRadius:12}}>
                                                                            <img src={require('../img/Toyota car.jpg')} alt="Annonce constructeur" style={{width:'100%', maxWidth:140, height:'auto', objectFit:'cover', borderRadius:8}} />
                                                                            <div className="flex-grow-1">
                                                                                <h5 className="fw-bold mb-1">Promotion constructeur: Toyota RAV4</h5>
                                                                                <p className="mb-1 text-muted">Offre spéciale concession — facilités de financement et garanties incluses. Découvrez le nouveau RAV4 aujourd'hui.</p>
                                                                                <div className="d-flex gap-2">
                                                                                    <Link to="/voitures" className="btn btn-primary btn-sm">Voir l'offre</Link>
                                                                                        <a href="#contact" className="btn btn-outline-secondary btn-sm">Contactez le concessionnaire</a>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                        </div>

            {/* Section Agents moderne */}
            <div className="bg-light py-5" id="agents">
                <div className="container">
                    <div className="section-title text-center mb-4 animate__animated animate__fadeInDown">
                      <span className="icon-circle bg-success text-white me-3"><FaUserFriends size={28}/></span>
                      <span className="fw-bold" style={{fontSize:'2.2rem', color: theme.palette.text.primary, letterSpacing:'-1px'}}>Rencontrez nos agents experts et certifiés à Kinshasa</span>
                    </div>
                    <p className="text-center text-muted mb-5 fs-5">Des professionnels passionnés, prêts à vous guider et sécuriser chaque étape de votre projet immobilier.<br /><span className="text-success">Bato ya ndaku oyo bazali na motema!</span></p>
                    <div className="row justify-content-center">
                        {agents.slice(0, 6).map(agent => (
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
                    <h3 className="fw-bold mb-0" style={{ fontSize: '1.4rem' }}>Avis de nos utilisateurs</h3>
                    <div>
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={prevTestimonials} aria-label="Précédent">‹</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={nextTestimonials} aria-label="Suivant">›</button>
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
                    {promotions.slice(0,1).map(promo => (
                        <div key={promo.id} className="col-12">
                            <div className="card h-100 shadow-lg border-3 border-danger position-relative animate-card" style={{overflow:'hidden', background: 'linear-gradient(90deg, #fff 60%, #ffe06622 100%)'}}>
                                <img src={promo.image} className="card-img-top" alt={promo.title} style={{ height: 260, objectFit: 'cover', borderBottom: '4px solid #d7263d' }} />
                                <div className="card-body d-flex flex-column align-items-start">
                                    <h4 className="card-title mb-2" style={{ color: '#d7263d', fontWeight: 800 }}>{promo.title}</h4>
                                    <p className="card-text mb-3" style={{ fontSize: '1.1rem', color: '#333', fontWeight: 500 }}>{promo.excerpt}</p>
                                    <div className="mb-3">
                                        <span style={{ fontSize: '1.2rem', color: '#888', textDecoration: 'line-through', marginRight: 12 }}>
                                            {promo.oldPrice} $
                                        </span>
                                        <span style={{ fontSize: '2rem', color: '#13c296', fontWeight: 900 }}>
                                            {promo.newPrice} $
                                        </span>
                                        <span className="ms-2 badge bg-danger" style={{ fontSize: '1rem', fontWeight: 700 }}>-30%</span>
                                    </div>
                                    <div className="mb-3">
                                        <span className="badge bg-warning text-dark" style={{ fontSize: '1rem', fontWeight: 600 }}>Offre limitée : réservez avant la fin du mois !</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-3 mb-2">
                                        <button className="btn btn-sm btn-outline-danger fw-bold px-3" onClick={() => toggleLikePromo(promo.id)}>
                                            👍 {promo.likes} J'aime
                                        </button>
                                        <small className="text-muted">{promo.comments.length} commentaires</small>
                                    </div>
                                    <ul className="list-unstyled mb-2 w-100" style={{ maxHeight: 80, overflowY: 'auto' }}>
                                        {promo.comments.map(c => (
                                            <li key={c.id} className="mb-1"><strong>{c.author}:</strong> <span className="text-muted">{c.text}</span></li>
                                        ))}
                                    </ul>
                                    <CommentInput onAdd={(author, text) => addCommentPromo(promo.id, author || 'Anonyme', text)} />
                                </div>
                                <div className="position-absolute top-0 end-0 m-3" style={{zIndex:2}}>
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
                                <div className="card shadow-sm mb-3" style={{ borderRadius: 12 }}>
                                    <div className="row g-0 align-items-stretch">
                                        <div className="col-auto" style={{ maxWidth: 320, width: '100%' }}>
                                            {/* image en avant, professionel */}
                                            <img src={p.images?.[0] || p.image || require('../img/property-1.jpg')} alt={p.name || p.title} style={{ width: '100%', maxWidth: 320, height: 'auto', objectFit: 'cover', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }} />
                                        </div>
                                        <div className="col">
                                            <div className="card-body d-flex flex-column h-100">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h5 className="fw-bold mb-1" style={{ color: '#0b5' }}>{p.name || p.title}</h5>
                                                        <p className="text-muted small mb-1">{p.address || p.excerpt || ''}</p>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="fs-6 text-success fw-bold">{p.price ? (typeof p.price === 'number' ? p.price.toLocaleString() + ' $' : p.price) : ''}</div>
                                                        {p._promoMeta && <small className="badge bg-danger">-{p._promoMeta.discountPercent}%</small>}
                                                    </div>
                                                </div>

                                                <p className="mb-2 text-secondary" style={{ flex: '0 0 auto' }}>{p.description || p.excerpt || ''}</p>

                                                <div className="mt-auto d-flex align-items-center justify-content-between">
                                                    <div className="d-flex gap-2 align-items-center">
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => toggleLikePromo(promoKey)} aria-label="J'aime">
                                                            👍 {likes}
                                                        </button>
                                                        <div style={{ minWidth: 'min(300px, 60vw)' }}>
                                                            <CommentInput onAdd={(author, text) => addCommentPromo(promoKey, author || 'Anonyme', text)} />
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                                                            // share: use Web Share API if available, otherwise copy link
                                                            const shareUrl = `${window.location.origin}${window.location.pathname}#promo-${promoKey}`;
                                                            if (navigator.share) {
                                                                navigator.share({ title: p.title || p.name, text: p.excerpt || '', url: shareUrl }).catch(() => {});
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
                                                        }}>Partager</button>
                                                        <button className="btn btn-sm btn-success" onClick={() => handleVisitOrView(p, i)}>Voir</button>
                                                    </div>
                                                </div>
                                                {/* Comments list (small) with toggle to view older */}
                                                {comments.length > 0 && (
                                                    <div className="mt-2">
                                                        <button className="btn btn-link p-0 small" onClick={() => toggleCommentsOpen(promoKey)}>{commentsOpen[promoKey] ? 'Masquer les commentaires' : `Voir ${comments.length} commentaires`}</button>
                                                        {commentsOpen[promoKey] && (
                                                            <ul className="list-unstyled mt-2 mb-0 small" style={{ maxHeight: 160, overflowY: 'auto' }}>
                                                                {comments.map(c => (<li key={c.id} className="mb-1"><strong>{c.author}:</strong> <span className="text-muted">{c.text}</span></li>))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-12 text-muted">Aucune offre en promotion pour le moment.</div>
                    )}
                </div>

                {/* centralized load more button */}
                <div className="d-flex justify-content-center mt-3">
                    <button className="btn btn-lg btn-success fw-bold" onClick={() => {
                        // append next batch of up to 10 promotions and ensure likes/comments exist
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
                    }}>Voir plus d'offre</button>
                </div>
            </section>

            {/* Carte interactive des biens et position utilisateur */}
            <div className="container" style={{paddingBottom:"3vh"}}>
                <div className="section-title text-center mb-3 animate__animated animate__fadeInDown">
                    <span className="icon-circle bg-success text-white me-3"><FaMapMarkerAlt size={28}/></span>
                    <span className="fw-bold" style={{fontSize:'2rem', color: theme.palette.text.primary}}>Carte des biens à Kinshasa</span>
                </div>
                <MapView />
            </div>

            {/* Call to action */}
            <div className="bg-success text-white text-center py-5">
                <div className="container">
                    <h5 className="fw-bold mb-3 fs-3">Vous êtes agent ou propriétaire ?</h5>
                    <p className="mb-4 fs-5">Inscrivez-vous gratuitement, publiez vos biens et bénéficiez d’une visibilité maximale sur Ndaku.</p>
                    <Button variant="outlined" color="inherit" sx={{ fontSize: '1.05rem', minWidth: 'min(180px, 60vw)', borderColor: 'rgba(255,255,255,0.6)', color: 'white' }} onClick={() => scrollToId('agence')}>Devenir agent</Button>
                </div>
            </div>

            {/* Footer pro et interactif */}
                        {/* Google sign-in dialog (moderne, centré en bas) */}
                        {showGooglePrompt && (
                            <div style={{
                                position: 'fixed',
                                left: '50%',
                                bottom: '2.5vh',
                                transform: 'translateX(-50%)',
                                zIndex: 3000,
                                minWidth: 320,
                                maxWidth: '95vw',
                                boxShadow: '0 8px 32px rgba(19,194,150,0.13)',
                                borderRadius: '18px',
                                background: 'linear-gradient(90deg, #fff 60%, #e0f7fa 100%)',
                                padding: '1.3rem 1.5rem 1.1rem 1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                border: '1.5px solid #e0f7fa',
                                animation: 'fadeInUp 0.5s cubic-bezier(.23,1.02,.47,.98)'
                            }}
                                aria-modal="true"
                                role="dialog"
                            >
                                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                                    {/* <img src={require('../img/logo192.png')} alt="Ndaku" style={{ width: 38, height: 38, borderRadius: 8, boxShadow: '0 2px 8px #13c29622' }} /> */}
                                    <span style={{fontWeight:800,fontSize:'1.18rem',color:'#0a223a'}}>Connexion rapide</span>
                                </div>
                                <div style={{textAlign:'center',color:'#0a223a',fontSize:'1.05rem',marginBottom:18,maxWidth:320}}>
                                    Connectez-vous avec Google pour un accès facilité et sécurisé à toutes les fonctionnalités Ndaku.
                                </div>
                                <button className="btn ndaku-btn" style={{minWidth:180,marginBottom:8}} onClick={acceptGoogleSign}>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" style={{width:22,height:22,marginRight:8,verticalAlign:'middle',borderRadius:4}} />
                                    Se connecter avec Google
                                </button>
                                <button className="btn btn-outline-secondary" style={{minWidth:120}} onClick={dismissGooglePrompt}>Plus tard</button>
                            </div>
                        )}

            {/* Dev-only debug controls (visible on localhost or with ?ndaku_debug=1) */}
           

            <FooterPro />
            <InfoModal open={infoOpen} title={'Information'} message={infoMsg} onClose={() => setInfoOpen(false)} />
        </>
    );
};

export default Home;
// Petit composant inline pour l'input de commentaire (concise, réutilisable)
function CommentInput({ onAdd }) {
    const [text, setText] = React.useState('');
    const [author, setAuthor] = React.useState('');
    return (
        <div className="d-flex gap-2">
            <input className="form-control form-control-sm" placeholder="Votre nom (optionnel)" value={author} onChange={e => setAuthor(e.target.value)} />
            <input className="form-control form-control-sm" placeholder="Ajouter un commentaire..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onAdd(author, text); setText(''); }}} />
            <button className="btn btn-sm btn-success" onClick={() => { onAdd(author, text); setText(''); }}>Envoyer</button>
        </div>
    );
}




































































































