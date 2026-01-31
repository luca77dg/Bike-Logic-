
import React from 'react';
import { Bike, MaintenanceRecord } from '../types';

interface BikeCardProps {
  bike: Bike;
  maintenance: MaintenanceRecord[];
  onAnalyze: (bike: Bike) => void;
  onUpdateKm: (bike: Bike) => void;
}

export const BikeCard: React.FC<BikeCardProps> = ({ bike, maintenance, onAnalyze, onUpdateKm }) => {
  const getIcon = () => {
    switch(bike.type) {
      case 'MTB': return 'fa-mountain-sun';
      case 'Gravel': return 'fa-road-barrier';
      default: return 'fa-road';
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-3 rounded-xl group-hover:bg-blue-600/20 transition-colors">
              <i className={`fa-solid ${getIcon()} text-xl text-blue-400`}></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{bike.name}</h3>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{bike.type}</span>
            </div>
          </div>
          <button 
            onClick={() => onUpdateKm(bike)}
            className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-arrows-rotate"></i>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Chilometraggio Totale</span>
            <span className="font-mono text-white font-bold">{bike.total_km.toFixed(1)} km</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 w-full opacity-50"></div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stato Componenti</h4>
          {maintenance.map(item => {
            const kmSinceInstall = bike.total_km - item.km_at_install;
            const wearPercentage = Math.min(Math.round((kmSinceInstall / item.lifespan_limit) * 100), 100);
            const isCritical = wearPercentage > 85;
            
            return (
              <div key={item.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{item.component_name}</span>
                  <span className={`${isCritical ? 'text-red-400' : 'text-slate-400'}`}>{wearPercentage}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${wearPercentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          {maintenance.length === 0 && (
             <p className="text-slate-600 text-xs italic">Nessun componente tracciato</p>
          )}
        </div>

        <button 
          onClick={() => onAnalyze(bike)}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <i className="fa-solid fa-camera-retro"></i>
          AI Vision Analysis
        </button>
      </div>
    </div>
  );
};
