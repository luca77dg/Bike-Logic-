
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
    { label: 'Pneumatici', value: specs.pneumatici, icon: 'fa-ring' },
    { label: 'Sella', value: specs.sella, icon: 'fa-chair' },
    { label: 'Peso', value: specs.peso, icon: 'fa-weight-hanging' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-file-lines text-blue-500"></i>
            Scheda Tecnica
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4">
          {items.map((item, idx) => item.value && (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                <i className={`fa-solid ${item.icon} text-blue-400`}></i>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">{item.label}</p>
                <p className="text-slate-200 text-sm font-medium leading-tight">{item.value}</p>
              </div>
            </div>
          ))}
          {!items.some(i => i.value) && (
            <div className="text-center py-10">
              <i className="fa-solid fa-ghost text-4xl text-slate-800 mb-4"></i>
              <p className="text-slate-500">Nessuna specifica trovata per questa bici.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
