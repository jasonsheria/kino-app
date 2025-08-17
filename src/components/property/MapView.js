import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { properties, agents } from '../../data/fakedata';
import RedIcon from './RedIcon';
import Messenger from '../common/Messenger';

// Correction des icônes Leaflet par défaut
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocateUser({ setUserPosition }) {
  const map = useMap();
  React.useEffect(() => {
    if (!navigator.geolocation) return;
    let watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);
        map.flyTo([latitude, longitude], 13);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, setUserPosition]);
  return null;
}

const MapView = () => {
  const [userPosition, setUserPosition] = React.useState(null);
  const [radius, setRadius] = React.useState(5); // km
  const [openMessenger, setOpenMessenger] = React.useState(null); // agentId
  // Extraction simple des coordonnées fictives à partir des adresses (à améliorer si besoin)
  const fakeCoords = {
    'Gombe': [-4.3208, 15.3126],
    'Mont Ngafula': [-4.4841, 15.2471],
    'Kasa-Vubu': [-4.3386, 15.2986],
    'Limete': [-4.3892, 15.3486],
    'Ngaliema': [-4.3833, 15.2333],
    'Matete': [-4.3833, 15.3667],
    'Barumbu': [-4.3167, 15.3000],
    'Lingwala': [-4.3333, 15.3000],
    'Selembao': [-4.4167, 15.2667],
    'Ndjili': [-4.3833, 15.4167],
    'Kinshasa': [-4.325, 15.322],
  };
  function getCoords(p) {
    // if property provides explicit geoloc, use it
    if (p && p.geoloc && Array.isArray(p.geoloc)) return p.geoloc;
    if (p && p.geoloc && p.geoloc.lat && p.geoloc.lng) return [p.geoloc.lat, p.geoloc.lng];
    const address = p && p.address ? p.address : '';
    for (const commune in fakeCoords) {
      if (address.includes(commune)) return fakeCoords[commune];
    }
    return fakeCoords['Kinshasa'];
  }
  // Calcul de la distance (Haversine)
  function getDistanceKm(coord1, coord2) {
    if (!coord1 || !coord2) return 9999;
    const toRad = deg => deg * Math.PI / 180;
    const [lat1, lon1] = coord1, [lat2, lon2] = coord2;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // Filtrer les biens par proximité
  const filtered = userPosition
    ? properties.filter(p => getDistanceKm(userPosition, getCoords(p)) <= radius)
    : properties;

  return (
    <div className="my-5" style={{height:440, width:'100%'}}>
      <div className="d-flex align-items-center mb-2 gap-2">
        <span className="fw-bold">Recherche par proximité :</span>
        <select value={radius} onChange={e => setRadius(Number(e.target.value))} className="form-select" style={{width:100}}>
          {[1,2,5,10,20,50].map(r => <option key={r} value={r}>{r} km</option>)}
        </select>
        {userPosition && <span className="text-success ms-2">{filtered.length} bien(s) dans ce rayon</span>}
      </div>
      <MapContainer center={userPosition || [-4.325, 15.322]} zoom={12} style={{height:'100%', width:'100%', borderRadius:16, boxShadow:'0 2px 16px #0001'}}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocateUser setUserPosition={setUserPosition} />
        {userPosition && (
          <Marker position={userPosition} icon={RedIcon}>
            <Popup>Vous êtes ici (temps réel)</Popup>
          </Marker>
        )}
        {/* Tracer les routes entre la position utilisateur et chaque bien */}
        {userPosition && filtered.map((p) => (
          <Polyline
            key={'route-' + p.id}
            positions={[userPosition, getCoords(p.address)]}
            pathOptions={{ color: 'red', weight: 2, dashArray: '6 8' }}
          />
        ))}
        {filtered.map((p) => {
          const agent = agents.find(a => a.id === p.agentId);
          return (
            <Marker key={p.id} position={getCoords(p)}>
              <Popup>
                <b>{p.name || p.title}</b><br/>{p.address}<br/>{p.price ? p.price.toLocaleString() + ' $' : ''}<br/>
                {agent && (
                  <>
                    <div className="mt-2">
                      <a
                        href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, '')}?text=Bonjour,%20je%20suis%20intéressé%20par%20le%20bien%20${encodeURIComponent(p.name)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="btn btn-success btn-sm mb-1 w-100"
                      >
                        Message WhatsApp
                      </a>
                      <a
                        href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, '')}?call`}
                        target="_blank" rel="noopener noreferrer"
                        className="btn btn-outline-success btn-sm mb-1 w-100"
                      >
                        Appel WhatsApp
                      </a>
                      <button
                        className="btn btn-outline-primary btn-sm w-100"
                        onClick={() => setOpenMessenger(agent.id)}
                      >
                        Message intégré
                      </button>
                    </div>
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {openMessenger && (
        <Messenger
          agent={agents.find(a => a.id === openMessenger)}
          onClose={() => setOpenMessenger(null)}
        />
      )}
    </div>
  );
};

export default MapView;
