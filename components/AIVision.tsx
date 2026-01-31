
import React, { useState, useRef } from 'react';
import { analyzeBikePart } from '../services/gemini.ts';

interface AIVisionProps {
  bikeName: string;
  onClose: () => void;
}

export const AIVision: React.FC<AIVisionProps> = ({ bikeName, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const analysis = await analyzeBikePart(image);
      if (analysis === "ERROR:ENTITY_NOT_FOUND") {
        setResult("La tua chiave API non sembra valida per questo servizio. Per favore, clicca su 'Collega API' nella home per configurarne una nuova.");
      } else {
        setResult(analysis);
      }
    } catch (error) {
      setResult("Errore durante l'analisi dell'immagine.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-blue-600/5">
          <div>
            <h2 className="text-2xl font-black text-white">Vision AI</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{bikeName}</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div 
            onClick={() => !analyzing && fileInputRef.current?.click()}
            className="aspect-square bg-slate-800 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all"
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover" alt="Bike Part" />
            ) : (
              <div className="text-center p-10">
                <i className="fa-solid fa-camera text-5xl text-slate-700 mb-4 block"></i>
                <p className="text-slate-500 font-bold text-sm">Carica una foto della catena o dei freni per un check-up istantaneo</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

          {image && !result && (
            <button 
              onClick={handleAnalyze} 
              disabled={analyzing}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all"
            >
              {analyzing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
              {analyzing ? 'Analisi in corso...' : 'Lancia Analisi Gemini'}
            </button>
          )}

          {result && (
            <div className="bg-slate-800/80 p-6 rounded-[2rem] border border-blue-600/20 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-4 text-blue-400 text-xs font-black uppercase tracking-widest">
                <i className="fa-solid fa-brain"></i>
                <span>Responso Tecnico</span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">{result}</p>
              <button onClick={() => { setImage(null); setResult(null); }} className="mt-6 text-[10px] font-black text-blue-500 hover:underline uppercase tracking-widest">Nuova Analisi</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
