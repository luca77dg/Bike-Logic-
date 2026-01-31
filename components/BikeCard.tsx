
import React, { useState } from 'react';
import { Bike, MaintenanceRecord } from '../types.ts';
import { BikeSpecsModal } from './BikeSpecsModal.tsx';
import { BikeAlbumModal } from './BikeAlbumModal.tsx';
import { MaintenanceManager } from './MaintenanceManager.tsx';

interface BikeCardProps {
  bike: Bike;
  maintenance: MaintenanceRecord[];
  onAnalyze: (bike: Bike) => void;
  onEdit: (bike: Bike) => void;
  onUpdateKm: (bike: Bike) => void;
  onDelete: (bike: Bike) => void;
  onRefresh: () => void;
}

export const BikeCard: React.FC<BikeCardProps> = ({ bike, maintenance, onAnalyze, onEdit, onUpdateKm, onDelete, onRefresh }) => {
  const [showSpecs, setShowSpecs] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [showMaintManager, setShowMaintManager] = useState(false);

  const getIcon = () => {
    switch(bike.type) {
      case 'MTB': return 'fa-mountain-sun';
      case 'Gravel': return 'fa-road-barrier';
      default: return 'fa-road';
    }
  };

  const photoCount = bike.specs?.photos?.length || 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-blue-500/30 transition-all group relative flex flex-col shadow-xl">
      {/* Immagine di Anteprima - Aspect Ratio Fisso 16:9 */}
      <div className="aspect-video w-full bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-800/50">
        {bike.specs?.imageUrl ? (
          <img 
            src={bike.specs.imageUrl} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
            alt={bike.name} 
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <i className={`fa-solid ${getIcon()} text-5xl text-slate-800`}></i>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Nessuna Foto</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
        <div className="absolute bottom-4 left-6 flex items-center gap-2">
          <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full border border-blue-600/30 backdrop-blur-md uppercase tracking-tighter">
            {bike.type}
          </span>
          <button 
            onClick={() => setShowAlbum(true)}
            className="bg-black/40 text-white text-[9px] font-black px-2 py-1 rounded-full border border-white/20 backdrop-blur-md flex items-center gap-1 hover:bg-purple-600/50 transition-colors"
          >
            <i className="fa-solid fa-images text-[8px]"></i>
            {photoCount} Album
          </button>
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-black text-white truncate pr-2">{bike.name}</h3>
            <div className="flex gap-4 items-center mt-2">
              <button 
                onClick={() => setShowSpecs(true)}
                className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors bg-blue-600/10 px-3 py-1.5 rounded-full border border-blue-500/20"
              >
                <i className="fa-solid fa-file-invoice"></i>
                Scheda Tecnica
              </button>
              <button 
                onClick={() => setShowAlbum(true)}
                className="text-[9px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors bg-purple-600/10 px-3 py-1.5 rounded-full border border-purple-500/20"
              >
                <i className="fa-solid fa-images"></i>
                Album Foto
              </button>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => onEdit(bike)}
              className="text-slate-500 hover:text-blue-400 h-10 w-10 flex items-center justify-center bg-slate-800 rounded-full transition-all border border-slate-700"
              title="Modifica Bici"
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            <button 
              onClick={() => onDelete(bike)}
              className="text-slate-500 hover:text-red-400 h-10 w-10 flex items-center justify-center bg-slate-800 rounded-full transition-all border border-slate-700"
              title="Elimina"
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div className="mb-8 p-6 bg-slate-800/40 rounded-3xl border border-slate-700/50">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Distanza Totale</p>
              <p className="text-3xl font-black text-white leading-none tracking-tight">
                {bike.total_km.toLocaleString('it-IT')} <span className="text-sm font-bold text-slate-500">km</span>
              </p>
            </div>
            <button 
              onClick={() => onUpdateKm(bike)}
              className="h-10 w-10 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all active:scale-90"
            >
              <i className="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manutenzione Componenti</h4>
            <button 
              onClick={() => setShowMaintManager(true)}
              className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest bg-blue-600/10 px-2 py-1 rounded-lg border border-blue-600/20"
            >
              Gestisci
            </button>
          </div>
          
          {maintenance.length > 0 ? maintenance.slice(0, 3).map(item => {
            const kmSinceInstall = bike.total_km - item.km_at_install;
            const wearPercentage = Math.min(Math.round((kmSinceInstall / item.lifespan_limit) * 100), 100);
            const isCritical = wearPercentage > 85;
            
            return (
              <div key={item.id} className="group/item">
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-tight">
                  <span className="text-slate-300">{item.component_name}</span>
                  <span className={`${isCritical ? 'text-red-400' : 'text-blue-400'}`}>{wearPercentage}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.3)] ${isCritical ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} 
                    style={{ width: `${wearPercentage}%` }}
                  ></div>
                </div>
              </div>
            );
          }) : (
            <p className="text-xs text-slate-600 font-bold italic">Nessun componente tracciato</p>
          )}
        </div>

        <button 
          onClick={() => onAnalyze(bike)}
          className="w-full bg-slate-800 hover:bg-blue-600 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all group-hover:shadow-lg group-hover:shadow-blue-900/10"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-blue-400 group-hover:text-white transition-colors"></i>
          Check-up AI Vision
        </button>
      </div>

      {showSpecs && bike.specs && (
        <BikeSpecsModal 
          specs={bike.specs} 
          productUrl={bike.product_url}
          onClose={() => setShowSpecs(false)} 
        />
      )}

      {showAlbum && (
        <BikeAlbumModal 
          bike={bike}
          onUpdate={onRefresh}
          onClose={() => setShowAlbum(false)} 
        />
      )}

      {showMaintManager && (
        <MaintenanceManager 
          bike={bike}
          records={maintenance}
          onUpdate={onRefresh}
          onClose={() => setShowMaintManager(false)}
        />
      )}
    </div>
  );
};
