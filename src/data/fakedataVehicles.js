// Données factices pour véhicules (location/vente)
export const vehicles = [
  {
    id: 1,
    name: "Toyota RAV4",
    description: "SUV moderne, fiable et spacieux, idéal pour la famille ou les voyages d'affaires. Disponible à la location ou à la vente.",
    type: "SUV",
    price: 15000,
    status: "location",
    address: "Gombe, Kinshasa",
    images: [
      require('../img/Toyota RAV4.jpg'),
      require('../img/Toyota Yaris Cross -2024.jpg'),
      require('../img/Toyota car.jpg'),
    ],
    agentId: 1,
    visitFee: 2000,
    couleur: "Gris métallisé",
    kilometrage: 42000,
    annee: 2022,
    carburant: "Essence",
    transmission: "Automatique",
    places: 5,
  },
  {
    id: 2,
    name: "Toyota Yaris Cross",
    description: "Compacte, économique et parfaite pour la ville. Dernier modèle, faible kilométrage.",
    type: "SUV",
    price: 12000,
    status: "vente",
    address: "Limete, Kinshasa",
    images: [
      require('../img/Toyota Yaris Cross -2024.jpg'),
      require('../img/Toyota car.jpg'),
      require('../img/Toyota RAV4.jpg'),
    ],
    agentId: 2,
    visitFee: 1500,
    couleur: "Blanc perle",
    kilometrage: 18000,
    annee: 2024,
    carburant: "Hybride",
    transmission: "Automatique",
    places: 5,
  },
  {
    id: 3,
    name: "Toyota (RAV4) Occasion",
    description: "Véhicule d'occasion en très bon état, entretien régulier, prêt à rouler.",
    type: "SUV",
    price: 9000,
    status: "vente",
    address: "Kintambo, Kinshasa",
    images: [
      require('../img/Toyota car.jpg'),
      require('../img/Toyota RAV4.jpg'),
    ],
    agentId: 3,
    couleur: "Noir",
    kilometrage: 67000,
    annee: 2019,
    carburant: "Diesel",
    transmission: "Manuelle",
    places: 5,
  },
  {
    id: 4,
    name: "Toyota Corolla",
    description: "Berline fiable, économique, parfaite pour la ville.",
    type: "Berline",
    price: 8000,
    status: "vente",
    address: "Gombe, Kinshasa",
    images: [require('../img/Toyota car.jpg')],
    agentId: 1,
    couleur: "Blanc",
    kilometrage: 30000,
    annee: 2018,
    carburant: "Essence",
    transmission: "Automatique",
    places: 5,
  },
  {
    id: 5,
    name: "Nissan Navara",
    description: "Pick-up robuste, idéal pour travaux et transport léger.",
    type: "Camionette",
    price: 14000,
    status: "vente",
    address: "Limete, Kinshasa",
    images: [require('../img/Toyota car.jpg')],
    agentId: 2,
    couleur: "Bleu",
    kilometrage: 80000,
    annee: 2016,
    carburant: "Diesel",
    transmission: "Manuelle",
    places: 2,
  },
  {
    id: 6,
    name: "Hyundai Accent",
    description: "Voiture compacte, faible consommation, idéale pour étudiant.",
    type: "Berline",
    price: 6000,
    status: "location",
    address: "Kintambo, Kinshasa",
    images: [require('../img/Toyota car.jpg')],
    agentId: 3,
    couleur: "Gris",
    kilometrage: 45000,
    annee: 2019,
    carburant: "Essence",
    transmission: "Manuelle",
    places: 5,
  },
  {
    id: 7,
    name: "Ford Ranger",
    description: "Pick-up récent, parfait pour interventions et loisirs.",
    type: "Camionette",
    price: 22000,
    status: "vente",
    address: "Mont Ngafula, Kinshasa",
    images: [require('../img/Toyota car.jpg')],
    agentId: 1,
    couleur: "Noir",
    kilometrage: 27000,
    annee: 2021,
    carburant: "Diesel",
    transmission: "Automatique",
    places: 5,
  },
  {
    id: 8,
    name: "Suzuki Swift",
    description: "Citadine agile, parfaite pour la circulation urbaine.",
    type: "Berline",
    price: 7000,
    status: "location",
    address: "Bandalungwa, Kinshasa",
    images: [require('../img/Toyota car.jpg')],
    agentId: 2,
    couleur: "Rouge",
    kilometrage: 38000,
    annee: 2020,
    carburant: "Essence",
    transmission: "Manuelle",
    places: 5,
  },
  {
    id: 9,
    name: "Kia Sportage",
    description: "SUV compact, confortable et moderne.",
    type: "SUV",
    price: 13000,
    status: "vente",
    address: "Gombe, Kinshasa",
    images: [require('../img/Toyota RAV4.jpg')],
    agentId: 3,
    couleur: "Blanc",
    kilometrage: 25000,
    annee: 2020,
    carburant: "Essence",
    transmission: "Automatique",
    places: 5,
  },
  {
    id: 10,
    name: "Renault Kangoo",
    description: "Utilitaire pratique pour livraison et petites entreprises.",
    type: "Camionette",
    price: 5000,
    status: "vente",
    address: "Zone industrielle, Limete",
    images: [require('../img/Toyota car.jpg')],
    agentId: 2,
    couleur: "Blanc",
    kilometrage: 90000,
    annee: 2015,
    carburant: "Diesel",
    transmission: "Manuelle",
    places: 3,
  }
];

// --- Runtime replacement with real server data (non-blocking) ---
// Try to fetch /api/vehicules and replace the exported array in-place so
// other modules that imported `vehicles` see live data.
(async () => {
  try {
    const API_BASE = (process.env.REACT_APP_BACKEND_APP_URL || '').replace(/\/$/, '');
    if (!API_BASE) return;
    const tryUrls = [`${API_BASE}/api/vehicules`, `${API_BASE}/api/vehicules?limit=100`];
    let resp = null;
    for (const u of tryUrls) {
      try {
        const r = await fetch(u, { credentials: 'include' });
        if (!r.ok) continue;
        try { resp = await r.json(); } catch (e) { resp = null; }
        if (resp) break;
      } catch (e) {
        resp = null;
      }
    }
    const raw = resp && (Array.isArray(resp) ? resp : resp.data || resp.items) || null;
    if (raw && Array.isArray(raw) && raw.length) {
      const mapped = raw.map(v => ({
        id: v._id || v.id || String(Math.random()),
        name: v.nom || v.name || v.titre || v.title || '',
        title: v.titre || v.nom || v.title || v.name || '',
        description: v.description || v.excerpt || '',
        type: (v.type || v.category || 'VEHICULES'),
        price: v.prix || v.prix || v.price || v.amount || 0,
        prix: v.prix || v.price || 0,
        status: v.statut || v.status || 'vente',
        address: v.adresse || v.address || '',
        images: Array.isArray(v.images) ? v.images.map(i => (typeof i === 'string' ? i : (i.url || i.path || ''))) : (v.image ? [v.image] : []),
        videos: Array.isArray(v.videos) ? v.videos.map(i => (typeof i === 'string' ? i : (i.url || i.path || ''))) : (v.video ? [v.video] : []),
        agentId: v.agent || v.agentId || v.agentId || null,
        visitFee: v.fraisVisite || v.visitFee || 0,
        fraisVisite: v.fraisVisite || v.visitFee || 0,
        couleur: v.couleur || v.color || '',
        kilometrage: v.kilometrage || v.km || 0,
        annee: v.annee || v.year || null,
        carburant: v.carburant || v.fuel || '',
        transmission: v.transmission || v.gear || '',
        places: v.places || v.seats || 0,
        geoloc: v.geoloc || v.location || null
      }));
      vehicles.splice(0, vehicles.length, ...mapped);
      try { window.dispatchEvent(new CustomEvent('ndaku:vehicles-updated', { detail: { vehicles: mapped } })); } catch (e) { /* ignore */ }
    }
  } catch (err) {
    // ignore - keep fake data
    console.warn('fakedataVehicles: could not fetch live vehicles', err?.message || err);
  }
})();
