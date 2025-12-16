import React from 'react';
import MessengerWidget from '../components/common/Messenger';
import { useTheme } from '@mui/material/styles';
import { FaUserTie, FaFilter, FaListUl, FaBuilding, FaArrowRight, FaHandshake, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaHome, FaUserFriends, FaCommentDots, FaCar, FaHouseUser, FaStore, FaTree, FaGlassCheers, FaKey, FaCertificate, FaBullhorn, FaTools, FaStar, FaStarHalfAlt, FaRegStar, FaHeart, FaRegHeart, FaEye, FaShoppingCart } from 'react-icons/fa';
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
import axios from 'axios';
import recService from '../services/recommendationService';
import { getLocalPromotions, fetchMorePromotionsFromServer } from '../data/fakedataPromotions';
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
import MapPropertyViewer from '../components/map/MapPropertyViewer'
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
    const parallaxRef = React.useRef(null);
    const heroLeftRef = React.useRef(null);
    const promoRef = React.useRef(null);
    const [likedMap, setLikedMap] = React.useState({});

    const toggleLike = (id) => {
        setLikedMap(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getLikes = (p) => {
        const base = Number(p.likes || 0);
        const extra = likedMap[p.id] ? 1 : 0;
        return base + extra;
    };

    const renderStars = (rating) => {
        const out = [];
        if (!rating && rating !== 0) return null;
        let r = Math.max(0, Math.min(5, Number(rating)));
        for (let i = 1; i <= 5; i++) {
            if (r >= 1) { out.push(<FaStar key={i} style={{ color: '#f6c343' }} />); r -= 1; }
            else if (r > 0.4) { out.push(<FaStarHalfAlt key={i} style={{ color: '#f6c343' }} />); r = 0; }
            else { out.push(<FaRegStar key={i} style={{ color: '#f6c343' }} />); }
        }
        return <span className="star-rating" aria-hidden>{out}</span>;
    };

    React.useEffect(() => {
        const onScroll = () => {
            try {
                if (!parallaxRef.current || !heroLeftRef.current) return;
                const rect = parallaxRef.current.getBoundingClientRect();
                const windowH = window.innerHeight || 800;
                const pct = Math.min(Math.max((windowH - rect.top) / (windowH + rect.height), 0), 1);
                const img = parallaxRef.current.querySelector('.parallax-img');
                if (img) img.style.transform = `translateY(${(1 - pct) * 28}px)`;
                heroLeftRef.current.style.transform = `translateY(${-(1 - pct) * 10}px)`;
            } catch (e) { /* ignore */ }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollPromos = (dir = 'next') => {
        const node = promoRef.current;
        if (!node) return;
        const card = node.querySelector('.promo-item');
        const step = (card ? card.offsetWidth : Math.min(360, node.clientWidth)) + 16;
        node.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
    };


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
    const [serverVehicles, setServerVehicles] = React.useState([]);
    const loadRecommendations = React.useCallback(async (kind) => {
        if (kind === 'properties') {

            const recs = await recService.getRecommendations(properties.slice(0, 50), { kind: 'properties', limit: 12 });
            setRecommendedProperties(recs);

        } else {

            // Try to fetch vehicles from backend first. If unavailable, fall back to fake data + recommender
            try {
                const base = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/+$/, '');
                const token = localStorage.getItem('ndaku_auth_token');
                const res = await axios.get(`${base}/api/vehicules?limit=50`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                const items = res.data?.data || res.data || [];
                if (Array.isArray(items) && items.length) {
                    setServerVehicles(items);
                    // Use recommender over server items if desired; for now feed recommender with server items
                    const recs = await recService.getRecommendations(items.slice(0, 50), { kind: 'vehicles', limit: 12, promotion: false });
                    setRecommendedVehicles(recs);
                } else {
                    const recs = await recService.getRecommendations(vehicles.slice(0, 50), { kind: 'vehicles', limit: 12 });
                    setRecommendedVehicles(recs);
                }
            } catch (e) {
                // network or backend failure - fall back to local fake vehicles
                const recs = await recService.getRecommendations(vehicles.slice(0, 50), { kind: 'vehicles', limit: 12 });
                setRecommendedVehicles(recs);
            }

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
            const parts = p.commune;
            return parts;
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

    // Promotions state (loaded from local fakedataPromotions or server)
    const [promotions, setPromotions] = React.useState([]);
    const [promotionsOffset, setPromotionsOffset] = React.useState(0);
    const [loadingPromotions, setLoadingPromotions] = React.useState(false);
    const [promotionsHasMore, setPromotionsHasMore] = React.useState(true);

    // demo promotions to show when server data is not available
    const demoPromos = React.useMemo(() => ([
        { id: 'demo-1', title: 'Appartement moderne 2ch', subtitle: 'Centre-ville, proche commerces', image: img6, likes: 12, oldPrice: 120000, newPrice: 99000, discount: 18, agent: { name: 'Jean K.', avatar: img6, rating: 4.7 } },
        { id: 'demo-2', title: 'Villa familiale', subtitle: 'Quartier résidentiel calme', image: img6, likes: 9, oldPrice: 250000, newPrice: 219000, discount: 12, agent: { name: 'Aline M.', avatar: img6, rating: 4.9 } },
        { id: 'demo-3', title: 'Terrain constructible', subtitle: 'Emplacement stratégique', image: img6, likes: 6, oldPrice: 80000, newPrice: 72000, discount: 10, agent: { name: 'Paul D.', avatar: img6, rating: 4.5 } },
        { id: 'demo-4', title: 'Boutique commerciale', subtitle: 'Rue passante', image: img6, likes: 4, oldPrice: 60000, newPrice: 54000, discount: 10, agent: { name: 'Marie T.', avatar: img6, rating: 4.4 } },
        { id: 'demo-5', title: 'Salle de fête', subtitle: 'Capacité 200 personnes', image: img6, likes: 3, oldPrice: 40000, newPrice: 28000, discount: 30, agent: { name: 'Lucie R.', avatar: img6, rating: 4.6 } },
        { id: 'demo-6', title: 'Studio cosy', subtitle: 'Idéal pour étudiant', image: img6, likes: 7, oldPrice: 45000, newPrice: 39500, discount: 12, agent: { name: 'Jean K.', avatar: img6, rating: 4.2 } }
    ]), []);

    const displayedPromotions = (promotions && promotions.length > 0) ? promotions : demoPromos;

    // Featured mobilier: try to fetch one mobilier from backend, fallback to demo
    const [featuredMobilier, setFeaturedMobilier] = React.useState(null);
    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const base = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/+$/, '');
                const url = base ? `${base}/api/mobilier?limit=1` : '/api/mobilier?limit=1';
                const res = await axios.get(url).catch(() => null);
                const items = res && res.data && (Array.isArray(res.data) ? res.data : res.data.data) ? (Array.isArray(res.data) ? res.data : res.data.data) : (Array.isArray(res) ? res : null);
                let first = null;
                if (items && Array.isArray(items) && items.length) first = items[0];
                if (!first) {
                    // fallback to demo promo as mobilier sample
                    first = demoPromos && demoPromos.length ? demoPromos[0] : null;
                }
                if (!mounted) return;
                if (first) {
                    const mapped = {
                        id: first._id || first.id || first.__uid || first.id || 'demo-mob',
                        title: first.title || first.name || first.label || 'Mobilier en vedette',
                        description: first.description || first.subtitle || first.excerpt || '',
                        image: (first.images && first.images[0]) || first.image || img6,
                        price: first.price || first.prix || first.newPrice || first.oldPrice || null,
                        agent: first.agent || first.owner || null,
                        meta: first.meta || {}
                    };
                    setFeaturedMobilier(mapped);
                }
            } catch (e) {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, [demoPromos]);

    // Carousel runtime items (used for autoplay append/rotate). We keep a mutable ref to the
    // index of last appended demo so we can append different items and avoid unbounded growth.
    const [carouselItems, setCarouselItems] = React.useState(displayedPromotions);
    const lastAppendedRef = React.useRef(displayedPromotions.length - 1);

    React.useEffect(() => {
        setCarouselItems(displayedPromotions.map((p, idx) => ({ ...p, __uid: p.id || `d-${idx}` })));
        lastAppendedRef.current = displayedPromotions.length - 1;
    }, [displayedPromotions]);

    // Autoplay: scroll right every few seconds through existing items only (no appends)
    React.useEffect(() => {
        if (!promoRef.current) return;
        const interval = setInterval(() => {
            try {
                scrollPromos('next');
            } catch (e) { /* ignore */ }
        }, 4200);
        return () => clearInterval(interval);
    }, [promoRef, displayedPromotions]);

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

    // Load initial promotions from local source on mount
    React.useEffect(() => {
        let mounted = true;
        (async () => {
            setLoadingPromotions(true);
            try {
                // Request promotions from server only (no local fallback)
                const items = await fetchMorePromotionsFromServer({ offset: 0, limit: 10, noFallback: true });
                if (!mounted) return;
                // log what we received for debugging
                // eslint-disable-next-line no-console
                console.debug('[Home] initial promotions fetched', { count: Array.isArray(items) ? items.length : 0, sample: Array.isArray(items) && items[0] ? (items[0]._id || items[0].id || '(obj)') : null });
                setPromotions(Array.isArray(items) ? items : []);
                setPromotionsOffset(Array.isArray(items) ? items.length : 0);
                setPromotionsHasMore(Array.isArray(items) && items.length >= 10);
            } catch (e) {
                console.warn('Failed to load promotions from server', e);
                if (!mounted) return;
                setPromotions([]);
                setPromotionsOffset(0);
                setPromotionsHasMore(false);
            } finally {
                if (mounted) setLoadingPromotions(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Debug: log promotions state when it changes to help trace rendering issues
    React.useEffect(() => {
        // eslint-disable-next-line no-console
        console.debug('[Home] promotions state updated', { length: promotions.length, sample: promotions[0] ? (promotions[0].id || promotions[0].title || '(obj)') : null });
        // detect problematic fields that are objects but used as children later
        promotions.forEach((p, idx) => {
            try {
                if (p && typeof p.title === 'object') {
                    // eslint-disable-next-line no-console
                    console.warn('[Home] promotion title is an object (likely cause of React child error)', { index: idx, title: p.title, item: p });
                }
                if (p && p.image && typeof p.image !== 'string') {
                    // eslint-disable-next-line no-console
                    console.warn('[Home] promotion image is not a string', { index: idx, image: p.image });
                }
                if (p && p.comments && !Array.isArray(p.comments)) {
                    // eslint-disable-next-line no-console
                    console.warn('[Home] promotion comments is not an array', { index: idx, comments: p.comments });
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[Home] error inspecting promotion item', { index: idx, error: err && err.message });
            }
        });
    }, [promotions]);

    const loadMorePromotions = async () => {
        if (loadingPromotions) return;
        setLoadingPromotions(true);
        try {
            // try server first; fetchMorePromotionsFromServer will fallback to local data
            const next = await fetchMorePromotionsFromServer({ offset: promotionsOffset, limit: 10 });
            if (Array.isArray(next) && next.length) {
                setPromotions(prev => [...prev, ...next]);
                setPromotionsOffset(prev => prev + next.length);
                if (next.length < 10) setPromotionsHasMore(false);
                else setPromotionsHasMore(true);
            } else {
                // no items returned
                setPromotionsHasMore(false);
            }
        } catch (err) {
            console.warn('Error loading more promotions', err);
        } finally {
            setLoadingPromotions(false);
        }
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
        // Load more promotions (best-effort) then navigate to property details
        loadMorePromotions();
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
            {/* Nouveau Hero v2 : section commerciale avec CTA et parallax image */}
            <section className="hero-v2" aria-label="Hero commercial">
                <div className="hero-v2-inner">
                    <div className="hero-v2-left" ref={heroLeftRef}>
                        <h1 className="hero-title">Boostez vos ventes avec <span className="hero-highlight">Ndaku</span></h1>
                        <p className="hero-desc">Annoncez vos produits et services immobiliers auprès de milliers de visiteurs chaque mois. Profitez d'une mise en avant professionnelle, d'agents certifiés et d'outils marketing pour convertir plus rapidement.</p>

                        <div className="hero-features" aria-hidden>
                            <div className="feature"><FaBullhorn /> <span>Visibilité ciblée</span></div>
                            <div className="feature"><FaCertificate /> <span>Agents certifiés</span></div>
                            <div className="feature"><FaBuilding /> <span>Marketing pro</span></div>
                        </div>

                        <div className="hero-ctas">
                            <MuiButton variant="contained" color="primary" className="hero-btn" onClick={() => scrollToId('biens')}>Voir les offres</MuiButton>
                            <Button variant="outlined" className="hero-btn-outline" onClick={() => navigate('/owner/onboard')}>Vendre / Louer</Button>
                        </div>
                    </div>

                    <div className="hero-v2-right">
                        <div className="parallax-wrap" ref={parallaxRef}>
                            <img src={img6} alt="Produit en destaque" className="parallax-img" />
                            <div className="floating-card">
                                Promo du jour
                                <small>Jusqu'à -15% sur certaines annonces</small>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Promotions section - mise en avant des produits */}
            <section aria-label="Promotions" className="container py-5">
                <div className="section-title text-center mb-3">
                    <span className="icon-circle text-white me-3"><FaBullhorn size={24} /></span>
                    <span className="fw-bold">Promotions & Offres spéciales</span>
                </div>
                <p className="text-center text-muted mb-4">Découvrez nos meilleures offres et promotions sélectionnées pour vous.</p>
                <div className="promo-carousel-wrap" style={{ position: 'relative' }}>
                    <button className="promo-control-left" aria-label="Précédent" onClick={() => scrollPromos('prev')}>◀</button>
                    <div ref={promoRef} className="promo-carousel" role="region" aria-label="carrousel promotions">
                        {carouselItems.map((p, i) => (
                            <div className="promo-item" key={p.__uid || p.id || i}>
                                <article className="promo-pro-card">
                                    <div className="promo-pro-inner">
                                        <div className="promo-pro-top">
                                            <img src={p.image || img6} className="promo-pro-img" alt={p.title} />
                                            {p.discount ? <div className="promo-ribbon">-{p.discount}%</div> : null}
                                        </div>
                                        <div className="promo-pro-body">
                                            <h4 className="promo-pro-title">{p.title}</h4>
                                            <p className="promo-pro-sub">{p.subtitle || p.excerpt || p.description}</p>
                                            { (p.address || p.location || p.adresse || p.city) && (
                                                <div className="promo-address text-muted" style={{ marginTop: 6, fontSize: '0.9rem' }}>
                                                    <small>Adresse: {p.address || p.location || p.adresse || p.city}</small>
                                                </div>
                                            ) }
                                            <div className="promo-pro-meta">
                                                <div className="promo-prices">
                                                    {p.oldPrice ? <div className="promo-old">€{Number(p.oldPrice).toLocaleString()}</div> : null}
                                                    {p.newPrice ? <div className="promo-new">€{Number(p.newPrice).toLocaleString()}</div> : null}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Button variant="contained" size="small" onClick={() => handleVisitOrView(p, i)}>Voir</Button>
                                                    <Button variant="outlined" size="small" onClick={() => openContact(p.agent || p.owner)}>Contact</Button>
                                                </div>
                                            </div>
                                        </div>
                                        <footer className="promo-pro-footer">
                                            <div className="promo-agent">
                                                <img src={(p.agent && p.agent.avatar) || img6} alt={(p.agent && p.agent.name) || 'Agent'} />
                                                <div>
                                                    <div className="agent-name">{(p.agent && p.agent.name) || 'Agent Ndaku'}</div>
                                                    <div className="agent-rating">{renderStars((p.agent && p.agent.rating) || 0)}</div>
                                                </div>
                                            </div>
                                            <div className="promo-cta-group">
                                                <button className="promo-like-btn" onClick={() => toggleLike(p.id || `promo-${i}`)} aria-pressed={!!likedMap[p.id]} aria-label="Like">
                                                    {likedMap[p.id] ? <FaHeart style={{ color: '#e63946' }} /> : <FaRegHeart style={{ color: '#e63946' }} />}
                                                    <span style={{ marginLeft: 6, fontWeight: 700, color: '#d7263d' }}>{getLikes(p)}</span>
                                                </button>
                                            </div>
                                        </footer>
                                    </div>
                                    <div className="promo-overlay" aria-hidden>
                                        <div className="overlay-inner">
                                            <button className="overlay-btn" onClick={() => handleVisitOrView(p, i)}><FaEye /> Voir</button>
                                            <button className="overlay-btn" onClick={() => openBooking(p)}><FaShoppingCart /> Réserver</button>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        ))}
                    </div>
                    <button className="promo-control-right" aria-label="Suivant" onClick={() => scrollPromos('next')}>▶</button>
                </div>
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                    <Button variant="contained" color="primary" onClick={() => navigate('/promotions')}>Voir toutes les offres</Button>
                </div>
            </section>

         


            {/* Cleaned Agency section: concise, airy, professional */}
            <section className="services-section-modern" id="agence" aria-labelledby="agence-heading">
                <div className="services-wrapper">
                    {/* Left Side - Hero */}


                    {/* Right Side - Services */}
                    <div className="services-right section-title">
                        <span className="fw-bold" style={{ marginBottom: '1rem' }}>Services clés gerés entierèment par la plateforme</span>
                        <div className="services-hero-left">
                            <div className="services-hero-circle">
                                <FaBuilding />
                            </div>
                            <p className="services-hero-subtitle">Visibilité, qualification et sécurité pour vos transactions immobilières — des solutions claires et efficaces pour vendre ou louer.</p>
                        </div>
                        <div className="services-cards-grid">
                            <div className="service-card-modern">
                                <div className="service-card-icon"><FaCertificate /></div>
                                <div className="service-card-content d-flex justify-content-lg-start align-items-start">
                                    <div className="service-card-title">Agents certifiés</div>
                                    <div className="service-card-desc">Sélection et accompagnement pro pour des transactions fiables.</div>
                                </div>
                            </div>

                            <div className="service-card-modern">
                                <div className="service-card-icon"><FaBullhorn /></div>
                                <div className="service-card-content d-flex justify-content-lg-start align-items-start">
                                    <div className="service-card-title">Marketing pro</div>
                                    <div className="service-card-desc">Photos HD, rédaction professionnelle & diffusion multicanal.</div>
                                </div>
                            </div>

                            <div className="service-card-modern">
                                <div className="service-card-icon"><FaTools /></div>
                                <div className="service-card-content d-flex justify-content-lg-start align-items-start">
                                    <div className="service-card-title">Support légal</div>
                                    <div className="service-card-desc">Vérification documentaire et assistance complète jusqu'à la signature.</div>
                                </div>
                            </div>
                        </div>

                        <div className="services-cta-group">
                            <button className="services-cta-btn services-cta-primary" onClick={() => scrollToId('biens')}>
                                Voir les biens
                            </button>
                            <button className="services-cta-btn services-cta-secondary" onClick={() => scrollToId('agents')}>
                                Contact agent
                            </button>
                        </div>

                        <div className="services-features-badge">
                            <div className="badge-feature">Vérification rapide</div>
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
                    <div className="compact-filter-bar-wrap">
                        <div className="compact-filter-bar d-flex justify-content-center flex-wrap" role="tablist" aria-label="Filtres de biens">
                            {[
                                { name: 'Tous', icon: <FaHome size={16} /> },
                                { name: 'Résidentiel', icon: <FaHouseUser size={16} /> },
                                { name: 'Commerciaux', icon: <FaStore size={16} /> },
                                { name: 'Terrains', icon: <FaTree size={16} /> },
                                { name: 'Salles de fêtes', icon: <FaGlassCheers size={16} /> },
                                { name: 'Locations', icon: <FaKey size={16} /> }
                            ].map(cat => (
                                <Button
                                    key={cat.name}
                                    variant={cat.name === filter ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => setFilter(cat.name)}
                                    sx={{
                                        minWidth: 120,
                                        borderRadius: 20,
                                        px: 2,
                                        py: 0.6,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: '0.9rem'
                                    }}
                                    aria-pressed={cat.name === filter}
                                    role="tab"
                                >
                                    <span className="filter-icon" aria-hidden>{cat.icon}</span>
                                    <span className="filter-label">{cat.name}</span>
                                    <span className="filter-count">{` (${categoryCounts[cat.name] || 0})`}</span>
                                </Button>
                            ))}
                        </div>
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
                                background: #e7e7e7;
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
                    .filter-cards-container { margin-top: 0.6rem; }
                    .compact-filter-bar-wrap { width: 100%; display:flex; justify-content:center; }
                    .compact-filter-bar { gap: 8px; row-gap: 10px; }
                    .compact-filter-bar .filter-icon { display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; }
                    .compact-filter-bar .filter-label { font-weight:600; margin-left:4px; }
                    .compact-filter-bar .filter-count { margin-left:6px; color: #64748b; font-size:0.85rem; }
                    .compact-filter-bar button { box-shadow: none; }
                    .compact-filter-bar button[aria-pressed="true"] { box-shadow: 0 6px 20px rgba(102,126,234,0.12); }
                    .custom-select:focus { border-color: var(--ndaku-primary); box-shadow: 0 0 0 2px var(--ndaku-primary-33); }
                `}</style>
                <div className="row justify-content-center">
                    {filteredResults.filter(p => p.promotion !== true).slice(0, 6).map((property, idx) => (
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
            
            </div>

            {/* Section Véhicules à louer ou à vendre */}
            <div className="container py-5" id="vehicules">
                  <div className="section-title text-center mb-3">
                    <span className="icon-circle text-white me-3"><FaCar size={28} /></span>
                    <span className="fw-bold">Véhicules à louer ou à vendre</span>
                </div>
               
                <p className="text-center text-muted mb-5">Toyota, SUV, berlines, et plus encore : trouvez le véhicule idéal pour vos besoins à Kinshasa.<br /><span>Location ou achat, tout est possible sur Ndaku !</span></p>
                <VehicleList vehicles={
                    (recommendedVehicles && recommendedVehicles.length)
                        ? recommendedVehicles.slice(0, 6)
                        : (serverVehicles && serverVehicles.length)
                            ? serverVehicles.slice(0, 6)
                            : vehicles.slice(0, 6)
                } />
                <div className="d-flex justify-content-center mt-3">
                    <Link to="/voitures" style={{ textDecoration: 'none' }}>
                        <Button variant="outlined" color="success" sx={{ px: 4 }}>Voir plus de véhicules</Button>
                    </Link>
                </div>


            </div>


            {/* Modal de réservation: monté au niveau page pour plein écran */}
            <VisitBookingModal
                open={bookingOpen}
                onClose={closeBooking}
                onSuccess={handleBookingSuccess}
                property={bookingProperty}
                agent={bookingAgent}
            />



            {/* Promotion publicitaire unique */}
            <section className="container py-4" aria-label="Promotion salle de fête">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="fw-bold mb-0" style={{ fontSize: '1.6rem', color: '#d7263d' }}>
                        <span style={{ background: '#ffe066', color: '#d7263d', borderRadius: 8, padding: '0.2em 0.7em', fontWeight: 800, fontSize: '1.1rem', marginRight: 12 }}>PROMO -30%</span>
                        Salle de fête à Kinshasa
                    </h3>
                </div>
                <div className="row g-3" style={{ flexDirection: 'row' }}>
                    {promotions.slice(0, 10).map(promo => (
                        <div key={promo.id} className="col-4 col-md-4 col-lg-3">
                            <article className="promo-pro-card" style={{ borderRadius: 18 }}>
                                <div className="promo-pro-inner">
                                    <div className="promo-pro-top">
                                        <img src={promo.image} className="promo-pro-img" alt={promo.title} />
                                        <div className="promo-ribbon">-{promo.discount || 30}%</div>
                                    </div>
                                    <div className="promo-pro-body">
                                        <h3 className="promo-pro-title" style={{ color: '#d7263d' }}>{promo.title}</h3>
                                        <p className="promo-pro-sub">{promo.excerpt}</p>
                                        {(promo.address || promo.location || promo.adresse || promo.city) && (
                                            <div className="promo-address text-muted" style={{ marginTop: 6, fontSize: '0.95rem' }}>
                                                Adresse: {promo.address || promo.location || promo.adresse || promo.city}
                                            </div>
                                        )}
                                        <div className="promo-pro-meta">
                                            <div className="promo-prices">
                                                {promo.oldPrice ? <div className="promo-old">€{Number(promo.oldPrice).toLocaleString()}</div> : null}
                                                {promo.newPrice ? <div className="promo-new">€{Number(promo.newPrice).toLocaleString()}</div> : null}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <Button variant="contained" color="primary" onClick={() => handleVisitOrView(promo)}>Voir</Button>
                                                <Button variant="outlined" onClick={() => openContact(promo.agent || promo.owner)}>Contact</Button>
                                            </div>
                                        </div>
                                    </div>
                                    <footer className="promo-pro-footer">
                                        <div className="promo-agent">
                                            <img src={(promo.agent && promo.agent.avatar) || img6} alt={(promo.agent && promo.agent.name) || 'Agent'} />
                                            <div>
                                                <div className="agent-name">{(promo.agent && promo.agent.name) || 'Annonceur'}</div>
                                                <div className="agent-rating">{renderStars((promo.agent && promo.agent.rating) || 0)}</div>
                                            </div>
                                        </div>
                                        <div className="promo-cta-group">
                                            <Button variant="outlined" onClick={() => toggleLikePromo(promo.id)} sx={{ borderRadius: 12 }}>
                                                👍 {promo.likes || 0} J'aime
                                            </Button>
                                        </div>
                                    </footer>
                                </div>
                                <div className="promo-overlay" aria-hidden>
                                    <div className="overlay-inner">
                                        <button className="overlay-btn" onClick={() => handleVisitOrView(promo)}><FaEye /> Voir</button>
                                        <button className="overlay-btn" onClick={() => openBooking(promo)}><FaShoppingCart /> Réserver</button>
                                    </div>
                                </div>
                            </article>
                        </div>
                    ))}
                </div>
            </section>
            {/* Section Agents moderne */}
            <div className="bg-light py-5" id="agents">
                <div className="container">
                    <div className="section-title text-center mb-4 animate__animated animate__fadeInDown">
                        <span className="icon-circle  text-white me-3"><FaUserFriends size={28} /></span>
                        <span className="fw-bold" >Rencontrez nos agents experts et certifiés à Kinshasa</span>
                    </div>
                    <p className="text-center text-muted mb-5">Des professionnels passionnés, prêts à vous guider et sécuriser chaque étape de votre projet immobilier.<br /><span>Bato ya ndaku oyo bazali na motema!</span></p>

                    <div className="d-flex justify-content-center mt-3">
                        <Link to="/agents" style={{ textDecoration: 'none' }}>
                            <Button variant="outlined" color="success" sx={{ px: 4 }}>Voir plus d'agents</Button>
                        </Link>
                    </div>
                </div>
            </div>


            {/* Modal de messagerie / contact agent */}
            <AgentContactModal agent={selectedAgent} open={contactOpen} onClose={closeContact} />

            {/* Témoignages util {/* Bannière choix agent/propriétaire - improved with background image and glass CTA */}


            {/* Map Section - Browse properties on interactive map */}
            <section className="map-section py-5" style={{ background: '#f8fafc' }}>
                <div className="container">
                    <div className="section-title text-center mb-4 animate__animated animate__fadeInDown">
                        <span className="icon-circle text-white me-3"><FaMapMarkerAlt size={28} /></span>
                        <span className="fw-bold">Explorez nos biens sur la carte</span>
                    </div>
                    <p className="text-center text-muted mb-4">Visualisez tous les biens disponibles à Kinshasa, interagissez avec les marqueurs et réservez une visite directement depuis la carte.</p>

                    <div style={{ height: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(17,25,40,0.12)' }}>
                        <MapPropertyViewer
                            properties={filteredResults && filteredResults.length > 0 ? filteredResults : properties}
                            onVisitRequest={(data) => {
                                openBooking(data.property, data.agent);
                            }}
                            defaultCenter={[-4.325, 15.322]}
                            defaultZoom={13}
                        />
                    </div>
                </div>
            </section>
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
                        <Link to="#" style={{ textDecoration: 'none' }}>
                            <MuiButton variant="contained" color="primary" sx={{ px: 3 }} startIcon={<FaBuilding />} className='owner-btn-primary'> Immobilier </MuiButton>
                        </Link>
                        <Link to="/owner/onboard" style={{ textDecoration: 'none' }}>
                            <Button variant="contained" color="primary" sx={{ px: 3 }} startIcon={<FaHandshake color='white' />} className='owner-btn-outline'> Propriétaire </Button>
                        </Link>
                    </div>

                </div>
            </section>
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


            {/* Call to action */}
            {/* <div className=" text-white text-center py-5" style={{
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
            </div > */}



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
function useCountUp(end, { duration = 900, start = true } = {}) {
    const [value, setValue] = React.useState(0);
    const rafRef = React.useRef(null);
    const startRef = React.useRef(null);

    // start when `start` flips true; allow controlling from outside
    React.useEffect(() => {
        let mounted = true;
        const startAnim = () => {
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
        if (start) startAnim();
        return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [end, duration, start]);

    return value;
}

// Hook to detect when element becomes visible in viewport
function useInView({ threshold = 0.35, root = null } = {}) {
    const ref = React.useRef(null);
    const [inView, setInView] = React.useState(false);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    setInView(true);
                    obs.disconnect();
                }
            });
        }, { threshold, root });
        obs.observe(el);
        return () => { try { obs.disconnect(); } catch (e) { } };
    }, [ref.current, threshold, root]);
    return [ref, inView];
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
    const [ref, inView] = useInView({ threshold: 0.35 });
    const animated = useCountUp(value, { duration: 1100, start: inView });
    return (
        <div ref={ref} className="stat-card-pro animate-card" style={{
            background: 'rgba(255,255,255,0.18)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
            borderRadius: 18,
            border: `1.5px solid ${accent || '#e0e0e0'}`,
            minWidth: 0,
            flex: 1,
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

// MapStatCard: professional stats card with RDC-shaped SVG and legend
function MapStatCard({ vendors = 0, products = 0, visits = 0, purchases = 0 }) {
    const [drcUrl, setDrcUrl] = React.useState(null);

    React.useEffect(() => {
        // Try loading a user-provided SVG from public assets (public/assets/images/drc.svg)
        // If present, we'll use it; otherwise keep using the inline path.
        const candidate = '/assets/images/drc.svg';
        fetch(candidate, { method: 'HEAD' }).then(res => {
            if (res.ok) setDrcUrl(candidate);
        }).catch(() => { /* ignore */ });
    }, []);

    return (
        <div className="map-stat-card animate-card">
            <div className="map-stat-left">
                <h4 className="map-stat-title">Aperçu national</h4>
                <p className="map-stat-sub">Répartition des activités sur la République Démocratique du Congo</p>
                <ul className="map-legend">
                    <li className="map-legend-item"><span className="map-count">{vendors}</span><span className="map-label">Vendeurs</span></li>
                    <li className="map-legend-item"><span className="map-count">{products}</span><span className="map-label">Produits</span></li>
                    <li className="map-legend-item"><span className="map-count">{visits}</span><span className="map-label">Visites</span></li>
                    <li className="map-legend-item"><span className="map-count">{purchases}</span><span className="map-label">Achats</span></li>
                </ul>
            </div>
            <div className="map-stat-right" aria-hidden>
                <svg className="map-svg" viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="g1" x1="0" x2="1">
                            <stop offset="0%" stopColor="#00cdf2" />
                            <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="100%" height="100%" rx="14" fill="url(#g1)" opacity="0.06" />
                    {drcUrl ? (
                        <image href={drcUrl} x="24" y="18" width="272" height="256" preserveAspectRatio="xMidYMid meet" />
                    ) : (
                        <path d="M42 38 C70 18 118 14 154 36 C180 52 210 66 232 96 C252 132 246 174 216 204 C188 232 150 244 110 232 C82 222 66 200 56 176 C46 150 36 118 42 88 C40 64 38 50 42 38 Z" fill="#ffffff" stroke="#e6eef6" strokeWidth="1.5" />
                    )}

                    {/* Highlighted central point with pulse and multi-line tooltip */}
                    <g className="map-point" transform="translate(0,0)">
                        <circle className="map-pulse" cx="86" cy="178" r="10" fill="#ff6b6b" opacity="0.28" />
                        <circle className="map-center-dot" cx="86" cy="178" r="8" fill="#ff6b6b" stroke="#fff" strokeWidth="2" />
                        <g className="map-tooltip" transform="translate(-4,110)">
                            <rect x="0" y="0" width="180" height="74" rx="8" fill="#07212a" opacity="0.96" />
                            <text className="tt-header" x="12" y="18" fill="#fff" fontSize="13" fontWeight="800">Statistiques</text>
                            <text className="tt-line tt-vendors" x="12" y="36" fill="#fff" fontSize="12"><tspan fontWeight="800">{vendors}</tspan> vendeurs</text>
                            <text className="tt-line tt-products" x="12" y="52" fill="#fff" fontSize="12"><tspan fontWeight="700">{products}</tspan> produits</text>
                            <text className="tt-line tt-views" x="12" y="68" fill="#fff" fontSize="12"><tspan fontWeight="700">{visits}</tspan> visites · <tspan fontWeight="700">{purchases}</tspan> achats</text>
                        </g>
                    </g>

                    <g className="map-decor" transform="translate(12,210)">
                        <circle cx="60" cy="20" r="6" fill="#ffd166" opacity="0.9" />
                        <circle cx="36" cy="28" r="4" fill="#06b6d4" opacity="0.9" />
                    </g>
                </svg>
            </div>
        </div>
    );
}