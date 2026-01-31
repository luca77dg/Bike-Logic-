
import React, { useState } from 'react';
import { Bike, MaintenanceRecord } from '../types.ts';
import { supabaseService } from '../services/supabase.ts';

interface MaintenanceManagerProps {
  bike: Bike;
  records: MaintenanceRecord[];
  onUpdate: () => void;
  onClose: () => void;
}

export const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ bike, records, onUpdate, onClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState(3000);

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: MaintenanceRecord = {
      id: crypto.randomUUID(),
      bike_id: bike.id,
      component_name: newName,
      km_at_install: bike.total_km,
      last_check_km: bike.total_km,
      lifespan_limit: newLimit
    };
    await supabaseService.saveMaintenance(newRecord);
    setNewName('');
    setIsAdding(false);
    onUpdate();
  };

  const handleReset = async (record: MaintenanceRecord) => {
    const confirmation = confirm(
      `Confermi la sostituzione/manutenzione di: ${record.component_name}?\n\nL'usura verrà azzerata partendo dal chilometraggio attuale della bici (${bike.total_km.toLocaleString()} km).`
    );
    
    if (confirmation) {
      const updated = { 
        ...record, 
        km_at_install: bike.total_km,
        last_check_km: bike.total_km 
      };
      await supabaseService.saveMaintenance(updated);
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Rimuovere questo componente dal tracciamento?")) {
      const data = localStorage.getItem('bikelogic_maintenance');
      if (data) {
        const allRecords: MaintenanceRecord[] = JSON.parse(data);
        localStorage.setItem('bikelogic_maintenance', JSON.stringify(allRecords.filter(r => r.id !== id)));
      }
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center border border-orange-600/30">
              <i className="fa-solid fa-screwdriver-wrench text-orange-500"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Gestione Componenti</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{bike.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-slate-800 h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isAdding ? (
            <form onSubmit={handleAddComponent} className="mb-8 p-6 bg-slate-800/50 rounded-3xl border border-blue-500/30 space-y-4 animate-in slide-in-from-top-4">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Nuovo Componente</h3>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 ml-1">Nome (es. Catena, Freni...)</label>
                <input 
                  autoFocus
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 ring-blue-500"
                  placeholder="Es: Catena 12v, Pasticche Post..."
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 ml-1">Durata stimata (km)</label>
                <input 
                  type="number"
                  required
                  value={newLimit}
                  onChange={(e) => setNewLimit(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-xs font-bold text-slate-400 uppercase">Annulla</button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-500">Aggiungi</button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full mb-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-dashed border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-blue-400 transition-all group"
            >
              <i className="fa-solid fa-plus text-xs group-hover:scale-125 transition-transform"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Traccia nuovo componente</span>
            </button>
          )}

          <div className="space-y-3">
            {records.length > 0 ? records.map(record => {
              const kmSinceInstall = bike.total_km - record.km_at_install;
              const wearPercentage = Math.min(Math.round((kmSinceInstall / record.lifespan_limit) * 100), 100);
              const isCritical = wearPercentage > 85;

              return (
                <div key={record.id} className="p-5 bg-slate-800/30 border border-slate-700/50 rounded-2xl flex items-center justify-between group hover:border-blue-500/20 transition-all">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-white truncate">{record.component_name}</span>
                      <span className={`text-[10px] font-black ${isCritical ? 'text-red-400' : 'text-blue-400'}`}>{wearPercentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                        style={{ width: `${wearPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                        Uso: {kmSinceInstall.toLocaleString()} / {record.lifespan_limit.toLocaleString()} km
                      </p>
                      {isCritical && (
                        <p className="text-[9px] text-red-500 font-black uppercase animate-pulse">Sostituire!</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleReset(record)}
                      className="h-10 px-4 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl border border-blue-600/20 transition-all flex items-center gap-2 group/btn"
                      title="Registra Sostituzione"
                    >
                      <i className="fa-solid fa-rotate text-xs group-hover/btn:rotate-180 transition-transform duration-500"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Sostituisci</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="h-10 w-10 bg-slate-800 text-slate-500 hover:text-red-500 rounded-xl border border-slate-700 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      title="Elimina"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-10 opacity-30">
                <i className="fa-solid fa-box-open text-3xl mb-3"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Nessun componente in lista</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
