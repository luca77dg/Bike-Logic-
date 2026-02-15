
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

  const sortedMaintenance = [...maintenance].sort((a, b) => {
    const wearA = (bike.total_km - a.km_at_install) / a.lifespan_limit;
    const wearB = (bike.total_km - b.km_at_install) / b.lifespan_limit;
    return wearB - wearA;
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-blue-500/30 transition-all group relative flex flex-col shadow-xl">
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
          {bike.strava_gear_id && (
            <span className="bg-orange-600/20 text-orange-400 text-[10px] font-black px-3 py-1 rounded-full border border-orange-600/30 backdrop-blur-md flex items-center gap-1.5 uppercase tracking-tighter">
              <i className="fa-brands fa-strava"></i> Linked
            </span>
          )}
        </div>
      </div>

      <div className="p-8">
        <div className="mb-8">
          {/* Nome della bici con dimensione bilanciata */}
          <h3 className="text-3xl font-black text-white leading-tight mb-5 tracking-tighter group-hover:text-blue-400 transition-colors">
            {bike.name}
          </h3>
          
          {/* Toolbar Pulsanti: Allineamento perfetto sulla stessa riga */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSpecs(true)}
                className="text-[9px] font-black text-blue-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all bg-blue-600/10 hover:bg-blue-600 px-4 py-3 rounded-xl border border-blue-500/20"
              >
                <i className="fa-solid fa-file-invoice"></i>
                <span className="hidden sm:inline">Scheda Tecnica</span>
                <span className="sm:hidden">Scheda</span>
              </button>
              <button 
                onClick={() => setShowAlbum(true)}
                className="text-[9px] font-black text-purple-400 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all bg-purple-600/10 hover:bg-purple-600 px-4 py-3 rounded-xl border border-purple-500/20"
              >
                <i className="fa-solid fa-images"></i>
                <span className="hidden sm:inline">Album Foto</span>
                <span className="sm:hidden">Album</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <button 
                onClick={() => onEdit(bike)}
                className="text-slate-500 hover:text-blue-400 h-10 w-10 flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all border border-slate-700"
                title="Modifica"
              >
                <i className="fa-solid fa-pen-to-square text-xs"></i>
              </button>
              <button 
                onClick={() => onDelete(bike)}
                className="text-slate-500 hover:text-red-400 h-10 w-10 flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all border border-slate-700"
                title="Elimina"
              >
                <i className="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
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
              className={`h-12 w-12 rounded-full text-white shadow-lg transition-all active:scale-90 flex items-center justify-center ${bike.strava_gear_id ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
              title={bike.strava_gear_id ? "Sincronizza con Strava" : "Aggiorna km manuale"}
            >
              <i className={`fa-solid ${bike.strava_gear_id ? 'fa-arrows-rotate' : 'fa-pen'}`}></i>
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
          
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {sortedMaintenance.length > 0 ? sortedMaintenance.map(item => {
              const kmSinceInstall = Math.max(0, bike.total_km - item.km_at_install);
              const wearPercentage = Math.min(Math.round((kmSinceInstall / item.lifespan_limit) * 100), 100);
              const isCritical = wearPercentage > 85;
              
              return (
                <div key={item.id} className="group/item">
                  <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-tight">
                    <span className="text-slate-300 truncate mr-2">{item.component_name}</span>
                    <span className={`${isCritical ? 'text-red-400' : 'text-blue-400'} shrink-0`}>{wearPercentage}%</span>
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
              <p className="text-xs text-slate-600 font-bold italic py-2">Nessun componente tracciato</p>
            )}
          </div>
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
