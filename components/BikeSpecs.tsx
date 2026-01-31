
import React from 'react';
import { BikeSpecs } from '../types.ts';

interface BikeSpecsProps {
  specs: BikeSpecs;
  onClose: () => void;
}

export const BikeSpecsModal: React.FC<BikeSpecsProps> = ({ specs, onClose }) => {
  const items = [
    { label: 'Telaio', value: specs.telaio, icon: 'fa-layer-group' },
    { label: 'Forcella', value: specs.forcella, icon: 'fa-fork' },
    { label: 'Gruppo', value: specs.gruppo, icon: 'fa-gear' },
    { label: 'Cambio', value: specs.cambio, icon: 'fa-shuffle' },
    { label: 'Freni', value: specs.freni, icon: 'fa-circle-stop' },
    { label: 'Ruote', value: specs.ruote, icon: 'fa-circle-dot' },
    { label: 'Pneumatici (Serie)', value: specs.pneumatici, icon: 'fa-ring' },
    { label: 'Passaggio Ruota Max', value: specs.clearance_max, icon: 'fa-arrows-left-right' },
    { label: 'Peso', value: specs.peso, icon: 'fa-weight-hanging' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in duration-300">
        
        {/* Header con Immagine se disponibile */}
        <div className="relative shrink-0">
          {specs.imageUrl ? (
            <div className="h-64 w-full bg-slate-800 overflow-hidden">
              <img 
                src={specs.imageUrl} 
                className="w-full h-full object-cover opacity-80" 
                alt="Bike" 
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
            </div>
          ) : (
            <div className="h-20 w-full bg-slate-900"></div>
          )}
          
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
            <h2 className="text-2xl font-black text-white flex items-center gap-3 drop-shadow-lg">
              <i className="fa-solid fa-list-check text-blue-500"></i>
              Scheda Tecnica
            </h2>
            <button onClick={onClose} className="bg-black/50 backdrop-blur-xl h-12 w-12 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-all">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-4 custom-scrollbar">
          <div className="grid grid-cols-1 gap-3">
            {items.map((item, idx) => item.value && (
              <div key={idx} className="flex items-center gap-5 p-5 rounded-[2rem] bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center shrink-0 border border-blue-600/20">
                  <i className={`fa-solid ${item.icon} text-blue-400 text-lg`}></i>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-1">{item.label}</p>
                  <p className="text-slate-200 text-sm font-bold leading-tight truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {specs.sources && specs.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-800/50">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Fonti Verificate Google Search</p>
              <div className="flex flex-wrap gap-2">
                {specs.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/20 text-[10px] font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <i className="fa-solid fa-link"></i>
                    {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {!items.some(i => i.value) && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-database text-3xl text-slate-700"></i>
              </div>
              <p className="text-slate-500 font-bold">Dati tecnici non disponibili per questo modello.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
