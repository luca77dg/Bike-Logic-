
import React from 'react';
import { BikeSpecs } from '../types.ts';

interface BikeSpecsProps {
  specs: BikeSpecs;
  productUrl?: string;
  onClose: () => void;
}

export const BikeSpecsModal: React.FC<BikeSpecsProps> = ({ specs, productUrl, onClose }) => {
  const items = [
    { label: 'Telaio', value: specs.telaio, icon: 'fa-layer-group' },
    { label: 'Forcella', value: specs.forcella, icon: 'fa-fork' },
    { label: 'Gruppo', value: specs.gruppo, icon: 'fa-gear' },
    { label: 'Cambio', value: specs.cambio, icon: 'fa-shuffle' },
    { label: 'Freni', value: specs.freni, icon: 'fa-circle-stop' },
    { label: 'Ruote', value: specs.ruote, icon: 'fa-circle-dot' },
    { label: 'Pneumatici', value: specs.pneumatici, icon: 'fa-ring' },
    { label: 'Passaggio Ruota Max', value: specs.clearance_max, icon: 'fa-arrows-left-right' },
    { label: 'Peso', value: specs.peso, icon: 'fa-weight-hanging' },
  ].filter(item => item.value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
        
        {/* Header compatto */}
        <div className="relative shrink-0 flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
              <i className="fa-solid fa-list-check text-blue-500"></i>
            </div>
            <h2 className="text-xl font-black text-white">Scheda Tecnica</h2>
          </div>
          <div className="flex items-center gap-3">
            {productUrl && (
              <a 
                href={productUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-900/20"
              >
                <i className="fa-solid fa-globe"></i>
                Sito Produttore
              </a>
            )}
            <button onClick={onClose} className="bg-slate-800 h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Immagine con Aspect Ratio 16:9 fisso */}
          {specs.imageUrl && (
            <div className="w-full bg-slate-950 p-4 border-b border-slate-800/50">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                <img 
                  src={specs.imageUrl} 
                  className="w-full h-full object-cover" 
                  alt="Bike Detail" 
                />
              </div>
            </div>
          )}

          <div className="p-6">
            {items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/30 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 mt-0.5">
                      <i className={`fa-solid ${item.icon} text-blue-400 text-sm`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-0.5">{item.label}</p>
                      <p className="text-white text-sm font-bold leading-relaxed break-words">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 opacity-50">
                <i className="fa-solid fa-database text-4xl mb-4 text-slate-700"></i>
                <p className="text-sm font-bold uppercase tracking-widest">Nessun dato tecnico salvato</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
