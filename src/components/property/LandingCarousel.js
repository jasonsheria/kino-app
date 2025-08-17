
import React, { useState, useEffect, useRef } from 'react';
import img11 from '../../img/carousel/kin.jpg';
import img12 from '../../img/carousel/kin3.jpg';
import img13 from '../../img/property-1.jpg';
import img4 from '../../img/Toyota car.jpg';
import img5 from '../../img/Toyota Yaris Cross -2024.jpg';
const images = [img11,img4, img12, img13, img5];





const LandingCarousel = () => {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timeoutRef = useRef();
  const zoomRef = useRef();
  const [zoom, setZoom] = useState(true); // true: zoom avant, false: zoom arrière

  // Scroll automatique
  useEffect(() => {
    timeoutRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 7500);
    return () => clearInterval(timeoutRef.current);
  }, []);

  // Animation zoom avant/arrière sur l'image active
  useEffect(() => {
    setZoom(true);
    zoomRef.current = setTimeout(() => setZoom(false), 2800);
    return () => clearTimeout(zoomRef.current);
  }, [index]);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setIndex((prev) => (prev - 1 + images.length) % images.length);
    setLoaded(false);
  };
  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setIndex((prev) => (prev + 1) % images.length);
    setLoaded(false);
  };

  return (
    <div className="carousel w-100 position-relative" style={{background:'#e3eafc', minHeight:'320px', height:'100vh', maxHeight:'100vh', borderRadius:0}}>
      <div className="carousel-inner h-100 w-100 position-relative" style={{overflow:'hidden'}}>
        {images.map((img, i) => (
          <div
            className={`carousel-item h-100 w-100${i === index ? ' active' : ''}`}
            key={img}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100vh',
              maxHeight: '100vh',
              minHeight: '320px',
              opacity: i === index && loaded ? 1 : 0,
              transition: 'opacity 0.7s',
              zIndex: i === index ? 2 : 1,
              pointerEvents: i === index ? 'auto' : 'none',
            }}
          >
            <img
              src={img}
              alt={`carousel-${i}`}
              className="d-block w-100 h-100 carousel-image"
              onLoad={() => setLoaded(true)}
              style={{
                objectFit:'cover',
                minHeight:'320px',
                height:'100vh',
                maxHeight:'100vh',
                filter: loaded ? 'brightness(1)' : 'brightness(0.95) blur(2px)',
                transition: 'filter 0.7s, transform 2.2s cubic-bezier(.77,0,.18,1)',
                transform: i === index && loaded ? (zoom ? 'scale(1.08)' : 'scale(1)') : 'scale(1)',
              }}
            />
          </div>
        ))}
      </div>
      {/* Contrôles verticaux à gauche, l'un au-dessus de l'autre, boutons blancs */}
      <div style={{position:'absolute', left:-26, top:'57%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:16, zIndex:100, height:'120px', justifyContent:'center'}}>
        <button className="btn d-flex align-items-center justify-content-center mb-2" type="button" onClick={handlePrev} style={{width:48,height:48,borderRadius:'50%',background:'#fff',border:'none',opacity:0.95,boxShadow:'0 2px 8px #0001'}}>
          <span className="carousel-control-prev-icon" aria-hidden="true" style={{filter:'invert(0.2)'}}></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="btn d-flex align-items-center justify-content-center" type="button" onClick={handleNext} style={{width:48,height:48,borderRadius:'50%',background:'#fff',border:'none',opacity:0.95,boxShadow:'0 2px 8px #0001'}}>
          <span className="carousel-control-next-icon" aria-hidden="true" style={{filter:'invert(0.2)'}}></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </div>
  );
};

export default LandingCarousel;
