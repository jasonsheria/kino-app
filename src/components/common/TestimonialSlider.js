import React from 'react';
import { FaQuoteLeft, FaStar, FaCommentDots } from 'react-icons/fa';
import './TestimonialSlider.css';

const testimonials = [
  {
    name: 'Aline K.',
    comment: "Service rapide, agents très professionnels. J'ai trouvé ma maison idéale en 2 semaines !",
    rating: 5,
    city: 'Kinshasa',
    avatar: require('../../img/about.jpg'),
  },
  {
    name: 'Patrick M.',
    comment: "Plateforme intuitive, beaucoup de choix et accompagnement personnalisé. Merci Ndaku !",
    rating: 4,
    city: 'Gombe',
    avatar: require('../../img/about.jpg'),
  },
  {
    name: 'Sarah B.',
    comment: "J'ai vendu mon terrain facilement grâce à l'équipe Ndaku. Je recommande à 100% !",
    rating: 5,
    city: 'Limete',
    avatar: require('../../img/about.jpg'),
  },
];

const TestimonialSlider = () => {
  const [current, setCurrent] = React.useState(0);
  const visibleCount = 3;
  // Slider automatique
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  // Pour le slide groupé, on duplique le tableau pour la boucle infinie
  const extended = [...testimonials, ...testimonials, ...testimonials];
  const start = testimonials.length + current;
  const slideWidth = 340 + 32; // card + gap

  return (
    <div className="testimonial-slider-container py-5 animate__animated animate__fadeInUp" style={{background: 'linear-gradient(120deg, #f8f9fa 60%, #e9f7f3 100%)'}}>
      <div className="container">
        <div className="section-title text-center mb-4">
          <span className="icon-circle bg-success text-white me-3"><FaCommentDots size={28}/></span>
          <span className="fw-bold" style={{fontSize:'2.2rem', color:'#222', letterSpacing:'-1px'}}>Avis de nos utilisateurs</span>
        </div>
        <div className="d-flex justify-content-center align-items-center position-relative" style={{minHeight:260}}>
          <button className="btn btn-light shadow-sm position-absolute start-0 top-50 translate-middle-y rounded-circle" style={{zIndex:2, width:44, height:44}} onClick={prev} aria-label="Précédent">
            <i className="bi bi-chevron-left fs-3"></i>
          </button>
          <div className="testimonial-slider-track" style={{width:'100%', overflow:'hidden', maxWidth:1100}}>
            <div
              className="testimonial-slider-inner"
              style={{
                display: 'flex',
                gap: 32,
                transform: `translateX(-${start * slideWidth}px)`,
                transition: 'transform 0.7s cubic-bezier(.23,1.02,.47,.98)',
                willChange: 'transform',
              }}
            >
              {extended.map((t, idx) => (
                <div key={idx} className="testimonial-card shadow-lg border-0 rounded-4 p-0 d-flex flex-column align-items-center position-relative" style={{maxWidth:340, minWidth:240, flex:1, background:'#fff', overflow:'hidden', border:'none'}}>
                  <div className="w-100 d-flex flex-column align-items-center justify-content-center" style={{background:'#13c296',padding:'1.2rem 0 0.7rem 0',borderBottomLeftRadius:32,borderBottomRightRadius:32}}>
                    <FaQuoteLeft className="text-white mb-2" size={32}/>
                    <div className="d-flex align-items-center gap-1 mb-2">
                      {[...Array(5)].map((_,i)=>(
                        <FaStar key={i} className={i<t.rating?"text-warning":"text-white opacity-50"} />
                      ))}
                    </div>
                  </div>
                  <div className="p-4 d-flex flex-column align-items-center w-100" style={{minHeight:160}}>
                    <p className="fs-5 text-center mb-3" style={{color:'#222',fontWeight:500}}>&ldquo;{t.comment}&rdquo;</p>
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <img src={t.avatar} alt={t.name} className="rounded-circle border shadow" style={{width:54,height:54,objectFit:'cover',border:'3px solid #13c296'}} />
                      <div>
                        <div className="fw-bold text-success" style={{fontSize:'1.1rem'}}>{t.name}</div>
                        <div className="small text-muted">{t.city}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-light shadow-sm position-absolute end-0 top-50 translate-middle-y rounded-circle" style={{zIndex:2, width:44, height:44}} onClick={next} aria-label="Suivant">
            <i className="bi bi-chevron-right fs-3"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestimonialSlider;
