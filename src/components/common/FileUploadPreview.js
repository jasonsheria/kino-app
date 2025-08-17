import React, { useState, useEffect, useRef } from 'react';
import { precheckImage } from '../../utils/ocr';

export default function FileUploadPreview({file, onChange, accept='image/*,application/pdf', label, runPrecheck=true}){
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [validation, setValidation] = useState(null);
  const inputRef = useRef(null);

  useEffect(()=>{
    let mounted = true;
    if(!file){ setPreview(null); setValidation(null); return; }
    const reader = new FileReader();
    reader.onload = ()=> { if(mounted) setPreview(reader.result); };
    if(file) reader.readAsDataURL(file);
    // immediate simple validation
    const errors = [];
    if(file.size > 5 * 1024 * 1024) errors.push('Fichier trop volumineux (>5MB)');
    if(!accept.split(',').some(a => a === 'image/*' ? file.type.startsWith('image') : file.type === a)){
      // allow pdf
      if(!file.type.includes('pdf')) errors.push('Type de fichier non pris en charge');
    }
    if(errors.length) setValidation({ ok:false, messages: errors });
    else setValidation({ ok:true, messages: ['Fichier valide'] });

    // optional OCR precheck
    (async ()=>{
      if(runPrecheck && file && file.type.startsWith('image')){
        try{
          const r = await precheckImage(file);
          if(mounted) setValidation(prev => ({...prev, ocr: r}));
        }catch(e){ /* ignore */ }
      }
    })();

    return ()=>{ mounted = false; };
  },[file]);

  const handleDrop = (e)=>{
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if(f) onChange(f);
  };

  const openFile = ()=> inputRef.current && inputRef.current.click();

  return (
    <div>
      <label className="form-label">{label || 'Fichier'}</label>
      <div
        onDragOver={(e)=>{ e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e)=>{ e.preventDefault(); setDragOver(false); }}
        onDrop={handleDrop}
        style={{border: dragOver ? '2px dashed var(--owner-accent)' : '1px dashed rgba(0,0,0,0.06)', borderRadius:10, padding:12, cursor:'pointer', display:'flex', gap:12, alignItems:'center'}}
        onClick={openFile}
      >
        <input ref={inputRef} type="file" style={{display:'none'}} accept={accept} onChange={(e)=> onChange(e.target.files[0])} />
        <div style={{width:140, height:100, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, background:'#fff'}}>
          {preview && file.type.startsWith('image') ? (
            <img src={preview} alt="preview" style={{width:140, height:100, objectFit:'cover', borderRadius:8}} />
          ) : (
            <div className="small text-muted">Glisser-déposer ou cliquez pour choisir</div>
          )}
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div className="fw-semibold">{file ? file.name : 'Aucun fichier sélectionné'}</div>
              <div className="small text-muted">{file ? `${Math.round(file.size/1024)} KB` : 'Formats acceptés : image, PDF'}</div>
            </div>
            <div>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={(e)=>{ e.stopPropagation(); openFile(); }}>Changer</button>
            </div>
          </div>
          <div style={{marginTop:8}}>
            {validation && (
              <div className={`small ${validation.ok ? 'text-success' : 'text-danger'}`}>
                {validation.messages.join(' • ')} {validation.ocr ? `• OCR: ${validation.ocr.text || 'aucune'}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
