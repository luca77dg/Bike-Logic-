
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

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const analysis = await analyzeBikePart(image);
      setResult(analysis);
    } catch (error) {
      setResult("Errore durante l'analisi dell'immagine.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Analisi AI Vision</h2>
            <p className="text-slate-400 text-sm">Analizzando: {bikeName}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6">
          <div className="aspect-video bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-700 overflow-hidden mb-6 relative group">
            {image ? (
              <img src={image} className="w-full h-full object-cover" alt="Bike Part" />
            ) : (
              <div className="text-center p-6">
                <i className="fa-solid fa-camera text-4xl text-slate-600 mb-3 block"></i>
                <p className="text-slate-400 text-sm">Carica una foto ravvicinata di catena, pacco pignoni o freni</p>
              </div>
            )}
            {!analyzing && !result && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                <span className="bg-white text-black font-bold py-2 px-4 rounded-full text-sm">Cambia Foto</span>
              </div>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />

          {!image && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/40 transition-all active:scale-95"
            >
              Scatta o Scegli Foto
            </button>
          )}

          {image && !result && (
            <button 
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3 transition-all"
            >
              {analyzing ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Analisi in corso...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-microchip"></i>
                  Lancia Analisi Gemini 3
                </>
              )}
            </button>
          )}

          {result && (
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-blue-900/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Responso AI</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {result}
              </p>
              <button 
                onClick={() => { setImage(null); setResult(null); }}
                className="text-xs text-blue-400 font-bold uppercase tracking-widest hover:text-blue-300"
              >
                Analizza un'altra parte
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
