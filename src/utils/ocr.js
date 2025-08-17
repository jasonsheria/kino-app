// Mock OCR pre-check helper (stub). Replace with real OCR service integration.
export async function precheckImage(file){
  return new Promise((resolve)=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      // fake analysis
      setTimeout(()=> resolve({ ok:true, text: 'NOM: DUPONT; ID: 12345', confidence: 0.92 }), 700);
    };
    reader.readAsDataURL(file);
  });
}
