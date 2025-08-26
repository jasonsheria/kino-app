import React, { useEffect, useRef, useState } from 'react';
import '../common/VirtualTourModal.css';

const isYoutube = (url) => !!(url && (url.includes('youtube') || url.includes('youtu.be') || url.includes('watch?v=')));
const toYoutubeEmbed = (url) => {
  if (!url) return url;
  try {
    if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
  } catch(e){}
  return url;
};

export default function VirtualTourModal({ open, onClose, videos = [], initialIndex = 0, onIndexChange }) {
  const [index, setIndex] = useState(initialIndex || 0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef();

  useEffect(() => { setIndex(initialIndex || 0); }, [initialIndex, videos]);
  useEffect(() => { if (typeof onIndexChange === 'function') onIndexChange(index); }, [index]);

  useEffect(() => {
    if (!open) {
      setPlaying(false);
      setProgress(0);
      try { if (videoRef.current && videoRef.current.pause) videoRef.current.pause(); } catch(e){}
    }
  }, [open]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || isYoutube(videos[index])) return;
    const onTime = () => setProgress((el.currentTime / Math.max(1, el.duration)) * 100);
    const onEnd = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnd);
    };
  }, [index, videos]);

  const playPause = () => {
    const el = videoRef.current;
    if (isYoutube(videos[index])) { setPlaying(!playing); return; }
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
  };

  const prev = () => setIndex(i => (i - 1 + videos.length) % videos.length);
  const next = () => setIndex(i => (i + 1) % videos.length);

  const onSeek = (e) => {
    const el = videoRef.current;
    if (!el || isYoutube(videos[index])) return;
    const rect = e.target.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) || 0;
    el.currentTime = pct * el.duration;
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (el && !isYoutube(videos[index])) { el.muted = !el.muted; setMuted(el.muted); }
    else setMuted(m => !m);
  };

  if (!open) return null;

  return (
    <div className="vt-modal-overlay" role="dialog" aria-modal="true">
      <div className="vt-modal">
        <div className="vt-header d-flex align-items-center justify-content-between">
          <div className="fw-bold">Visite virtuelle</div>
          <div>
            <button className="btn btn-sm btn-outline-secondary me-2" onClick={prev}>Préc</button>
            <button className="btn btn-sm btn-outline-secondary me-2" onClick={next}>Suiv</button>
            <button className="btn btn-sm btn-danger" onClick={onClose}>Fermer</button>
          </div>
        </div>

        <div className="vt-body d-flex gap-3">
          <div className="vt-player flex-grow-1 position-relative">
            {videos[index] && isYoutube(videos[index]) ? (
              <iframe title={`vt-${index}`} src={toYoutubeEmbed(videos[index])} frameBorder="0" allowFullScreen style={{width:'100%', height:'100%'}} />
            ) : (
              <video ref={videoRef} src={videos[index]} className="w-100 h-100" controls={false} style={{objectFit:'cover'}} />
            )}

            <div className="vt-controls d-flex align-items-center gap-2 p-2">
              <button className="btn btn-sm btn-primary" onClick={playPause}>{playing ? 'Pause' : 'Play'}</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={prev}>◀</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={next}>▶</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button>
              <div className="flex-grow-1 ms-2">
                <div className="vt-progress" onClick={onSeek} style={{height:8, background:'#eee', borderRadius:6, cursor:'pointer'}}>
                  <div style={{width:`${progress}%`, height:'100%', background:'var(--ndaku-primary)', borderRadius:6}} />
                </div>
              </div>
              <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => { const el = videoRef.current; if (el) { if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.(); } }}>⤢</button>
            </div>
          </div>

          <div className="vt-thumbs d-flex flex-column" style={{width:220}}>
            <div className="small text-muted mb-2">Playlist</div>
            <div className="flex-grow-1 overflow-auto">
              {videos.map((v,i) => (
                <div key={i} className={`vt-thumb d-flex gap-2 p-2 align-items-center ${i===index? 'active':''}`} onClick={() => setIndex(i)}>
                  {isYoutube(v) ? (
                    <img src={`https://img.youtube.com/vi/${(v.split('v=')[1]||v.split('/').pop()).split('&')[0]}/hqdefault.jpg`} alt={`thumb-${i}`} style={{width:84, height:56, objectFit:'cover'}} />
                  ) : (
                    <video src={v} style={{width:84, height:56, objectFit:'cover'}} muted />
                  )}
                  <div className="small text-truncate">Vidéo {i+1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
