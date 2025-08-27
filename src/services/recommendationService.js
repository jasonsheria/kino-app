/**
 * Service pour gérer les recommandations de propriétés et véhicules
 */

// Fonction utilitaire pour mélanger un tableau
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Fonction pour filtrer les éléments similaires basés sur certains critères
function getSimilarItems(item, items, kind) {
    if (kind === 'properties') {
        return items.filter(p => 
            p.id !== item.id && (
                p.type === item.type ||
                p.price >= item.price * 0.8 && p.price <= item.price * 1.2 ||
                p.address.includes(item.address.split(',')[0]) // Même commune
            )
        );
    } else if (kind === 'vehicles') {
        return items.filter(v => 
            v.id !== item.id && (
                v.brand === item.brand ||
                v.type === item.type ||
                v.price >= item.price * 0.8 && v.price <= item.price * 1.2
            )
        );
    }
    return [];
}

// File d'attente d'événements à synchroniser
let eventQueue = [];
const MAX_QUEUE_SIZE = 1000;
let syncInterval = null;

/**
 * Démarre la synchronisation des événements en arrière-plan
 */
export function startEventSync() {
    if (syncInterval) return; // Déjà démarré

    // Essayer de restaurer la file d'attente du localStorage
    try {
        const saved = localStorage.getItem('ndaku_event_queue');
        if (saved) {
            eventQueue = JSON.parse(saved);
            if (!Array.isArray(eventQueue)) eventQueue = [];
        }
    } catch (e) {
        console.error('Erreur lors de la restauration de la file d\'événements:', e);
        eventQueue = [];
    }

    // Synchroniser toutes les 5 minutes si en ligne
    syncInterval = setInterval(() => {
        if (navigator.onLine && eventQueue.length > 0) {
            flushEvents();
        }
    }, 5 * 60 * 1000);

    // Aussi synchroniser quand on revient en ligne
    window.addEventListener('online', flushEvents);
}

/**
 * Ajoute un événement à la file d'attente
 */
function queueEvent(event) {
    if (eventQueue.length >= MAX_QUEUE_SIZE) {
        eventQueue = eventQueue.slice(-MAX_QUEUE_SIZE + 1);
    }
    eventQueue.push(event);
    try {
        localStorage.setItem('ndaku_event_queue', JSON.stringify(eventQueue));
    } catch (e) {
        console.error('Erreur lors de l\'enregistrement de la file d\'événements:', e);
    }
}

/**
 * Tente d'envoyer tous les événements en attente au serveur
 */
async function flushEvents() {
    if (!navigator.onLine || eventQueue.length === 0) return;

    try {
        // TODO: Implémenter l'envoi au serveur
        // const response = await fetch('/api/events/bulk', {
        //     method: 'POST',
        //     body: JSON.stringify(eventQueue)
        // });
        // if (response.ok) {
            eventQueue = [];
            localStorage.removeItem('ndaku_event_queue');
        // }
    } catch (e) {
        console.error('Erreur lors de la synchronisation des événements:', e);
    }
}

class RecommendationService {
    /**
     * Récupère les recommandations pour une liste d'éléments
     * @param {Array} items - Liste des éléments (propriétés ou véhicules)
     * @param {Object} options - Options de configuration
     * @param {string} options.kind - Type d'éléments ('properties' ou 'vehicles')
     * @param {number} options.limit - Nombre maximum de recommandations à retourner
     * @returns {Promise<Array>} Liste des éléments recommandés
     */
    async getRecommendations(items, options = {}) {
        const { kind = 'properties', limit = 12 } = options;

        try {
            // Pour l'instant, on utilise une approche simple :
            // 1. On récupère quelques éléments similaires pour chaque élément
            // 2. On mélange les résultats
            // 3. On limite le nombre de résultats

            let recommendations = new Set();
            
            // Pour chaque élément, on trouve des éléments similaires
            items.forEach(item => {
                const similarItems = getSimilarItems(item, items, kind);
                similarItems.forEach(similar => recommendations.add(similar));
            });

            // Convertir en tableau et mélanger
            let results = shuffleArray(Array.from(recommendations));

            // Limiter le nombre de résultats
            results = results.slice(0, limit);

            // Si on n'a pas assez de recommandations, on complète avec des éléments aléatoires
            if (results.length < limit) {
                const remainingCount = limit - results.length;
                const remainingItems = items
                    .filter(item => !results.includes(item))
                    .slice(0, remainingCount);
                results = [...results, ...remainingItems];
            }

            return results;

        } catch (error) {
            console.error('Erreur lors de la récupération des recommandations:', error);
            // En cas d'erreur, on retourne un sous-ensemble aléatoire des éléments
            return shuffleArray([...items]).slice(0, limit);
        }
    }

    /**
     * Récupère les tendances actuelles
     * @param {Array} items - Liste des éléments
     * @param {Object} options - Options de configuration
     * @returns {Promise<Array>} Liste des éléments tendance
     */
    async getTrending(items, options = {}) {
        const { limit = 6 } = options;
        
        try {
            // Pour l'instant, on retourne simplement des éléments aléatoires
            // Plus tard, on pourrait implémenter une vraie logique basée sur :
            // - Le nombre de vues
            // - Le nombre de likes
            // - Le nombre de partages
            // - La date de publication
            // - etc.
            return shuffleArray([...items]).slice(0, limit);
        } catch (error) {
            console.error('Erreur lors de la récupération des tendances:', error);
            return [];
        }
    }
}

export default new RecommendationService();
