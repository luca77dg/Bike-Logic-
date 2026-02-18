
import React, { useState, useEffect } from 'react';
import { Bike, MaintenanceRecord, MaintenanceHistory } from '../types.ts';
import { supabaseService } from '../services/supabase.ts';

interface MaintenanceManagerProps {
  bike: Bike;
  records: MaintenanceRecord[];
  onUpdate: () => void;
  onClose: () => void;
}

interface ComponentSuggestion {
  name: string;
  limit: number;
  icon: string;
}

const COMMON_SUGGESTIONS: ComponentSuggestion[] = [
  { name: 'Catena', limit: 3000, icon: 'fa-link' },
  { name: 'Pasticche Freni (Ant)', limit: 2000, icon: 'fa-circle-stop' },
  { name: 'Pasticche Freni (Post)', limit: 2000, icon: 'fa-circle-stop' },
  { name: 'Copertone Anteriore', limit: 4000, icon: 'fa-ring' },
  { name: 'Copertone Posteriore', limit: 3000, icon: 'fa-ring' },
  { name: 'Pacco Pignoni', limit: 8000, icon: 'fa-gear' },
  { name: 'Liquido Sigillante', limit: 500, icon: 'fa-droplet' },
  { name: 'Revisione Forcella', limit: 5000, icon: 'fa-code-fork' },
  { name: 'Cavi e Guaine', limit: 6000, icon: 'fa-lines-leaning' },
];

export const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ bike, records, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<MaintenanceHistory[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState(3000);
  const [installKm, setInstallKm] = useState(bike.total_km);
  const [newNotes, setNewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [editingHistory, setEditingHistory] = useState<MaintenanceHistory | null>(null);
  const [isAddingManualHistory, setIsAddingManualHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await supabaseService.getHistory(bike.id);
      setHistory(data);
    } catch (err) {
      console.error("History loading failed");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newRecord: MaintenanceRecord = {
        id: crypto.randomUUID(),
        bike_id: bike.id,
        component_name: newName,
        km_at_install: installKm,
        last_check_km: installKm,
        lifespan_limit: newLimit,
        notes: newNotes.trim() || undefined
      };
      await supabaseService.saveMaintenance(newRecord);
      setNewName('');
      setNewLimit(3000);
      setInstallKm(bike.total_km);
      setNewNotes('');
      setIsAdding(false);
      onUpdate();
    } catch (err: any) {
      console.error("Save Error:", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHistory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const record: MaintenanceHistory = {
        id: editingHistory?.id || crypto.randomUUID(),
        bike_id: bike.id,
        component_name: formData.get('h_name') as string,
        replaced_at_km: parseFloat(formData.get('h_km') as string),
        distance_covered: parseFloat(formData.get('h_dist') as string),
        notes: formData.get('h_notes') as string,
        replacement_date: new Date(formData.get('h_date') as string).toISOString()
      };
      
      await supabaseService.saveHistoryRecord(record);
      setEditingHistory(null);
      setIsAddingManualHistory(false);
      await loadHistory();
    } catch (err: any) {
      console.error("History Save Error:", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (record: MaintenanceRecord) => {
    const customKm = window.prompt(
      `Sostituzione di: ${record.component_name}\nA che km della bici hai fatto il cambio?`,
      bike.total_km.toString()
    );
    
    if (customKm !== null) {
      const resetKm = parseFloat(customKm);
      if (isNaN(resetKm)) return;

      const kmPercorsi = Math.max(0, resetKm - record.km_at_install);
      const historyRecord: MaintenanceHistory = {
        id: crypto.randomUUID(),
        bike_id: bike.id,
        component_name: record.component_name,
        replaced_at_km: resetKm,
        distance_covered: kmPercorsi,
        notes: `Sostituzione programmata (${record.notes || 'nessuna nota'})`,
        replacement_date: new Date().toISOString()
      };
      
      try {
        await supabaseService.saveHistoryRecord(historyRecord);
        await supabaseService.saveMaintenance({ 
          ...record, 
          km_at_install: resetKm,
          last_check_km: resetKm 
        });
        onUpdate();
        alert(`Sostituzione salvata correttamente!`);
      } catch (err) {
        console.error("Reset failed");
      }
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (confirm("Rimuovere definitivamente questo intervento dallo storico?")) {
      await supabaseService.deleteHistoryRecord(id);
      loadHistory();
    }
  };

  const handleDeleteCurrent = async (id: string) => {
    if (confirm("Rimuovere questo componente dal tracciamento?")) {
      await supabaseService.deleteMaintenance(id);
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center border border-orange-600/30">
              <i className="fa-solid fa-screwdriver-wrench text-orange-500"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Componenti</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{bike.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-slate-800 h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex bg-slate-950/50 p-1.5 mx-6 mt-4 rounded-2xl border border-slate-800 shrink-0">
          <button 
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'current' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Attivi
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Storico
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'current' ? (
            <>
              {isAdding ? (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
                  <form onSubmit={handleAddComponent} className="p-6 bg-slate-800/50 rounded-3xl border border-blue-500/30 space-y-4 shadow-xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Nuovo Componente</h3>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 ml-1">Nome</label>
                      <input 
                        autoFocus required disabled={isSaving} value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 ring-blue-500"
                        placeholder="Es: Catena 12v..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 ml-1">Km Installazione</label>
                        <input 
                          type="number" required disabled={isSaving} value={installKm}
                          onChange={(e) => setInstallKm(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 ml-1">Durata (km)</label>
                        <input 
                          type="number" required disabled={isSaving} value={newLimit}
                          onChange={(e) => setNewLimit(parseInt(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-xs font-bold text-slate-400 uppercase">Annulla</button>
                      <button type="submit" disabled={isSaving} className="flex-[2] py-3 bg-blue-600 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg">
                        {isSaving ? 'Salvataggio...' : 'Aggiungi'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="w-full mb-8 py-5 bg-slate-800/50 hover:bg-slate-800 border border-dashed border-slate-700 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-blue-400 transition-all"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Aggiungi componente</span>
                </button>
              )}

              <div className="space-y-4 pb-8">
                {records.length > 0 ? records.sort((a,b) => b.km_at_install - a.km_at_install).map(record => {
                  const kmSinceInstall = Math.max(0, bike.total_km - record.km_at_install);
                  const wearPercentage = Math.min(Math.round((kmSinceInstall / record.lifespan_limit) * 100), 100);
                  const isCritical = wearPercentage > 85;

                  return (
                    <div key={record.id} className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-[2rem] space-y-5 group hover:border-blue-500/20 transition-all relative overflow-hidden shadow-inner">
                      {/* Component Info */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                          <h4 className="text-[13px] font-black text-white leading-tight break-words uppercase tracking-tight">
                            {record.component_name}
                          </h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                            <i className="fa-solid fa-gauge-high opacity-50"></i>
                            Installato a {record.km_at_install.toLocaleString()} km
                          </p>
                        </div>
                        <div className={`text-[11px] font-black px-3 py-1.5 rounded-xl border ${isCritical ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {wearPercentage}%
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`} 
                            style={{ width: `${wearPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">
                          <span>Nuovo</span>
                          <span>Limite {record.lifespan_limit.toLocaleString()}km</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-1">
                        <button 
                          onClick={() => handleReset(record)} 
                          className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                          <i className="fa-solid fa-rotate text-[10px]"></i>
                          <span className="text-[10px] font-black uppercase tracking-widest">Sostituito</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteCurrent(record.id)} 
                          className="h-12 w-12 bg-slate-900 text-slate-600 hover:text-red-500 rounded-2xl border border-slate-750 flex items-center justify-center transition-all active:scale-95"
                          title="Elimina"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-20 opacity-30">
                    <i className="fa-solid fa-box-open text-4xl mb-4 text-slate-700"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">Nessun componente tracciato</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              {!isAddingManualHistory && !editingHistory && (
                <button 
                  onClick={() => setIsAddingManualHistory(true)}
                  className="w-full py-4 bg-purple-600/10 border border-dashed border-purple-600/40 rounded-2xl flex items-center justify-center gap-3 text-purple-400 hover:bg-purple-600/20 transition-all"
                >
                  <i className="fa-solid fa-calendar-plus text-xs"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Nuovo intervento storico</span>
                </button>
              )}

              {(isAddingManualHistory || editingHistory) && (
                <form onSubmit={handleSaveHistory} className="p-6 bg-slate-800 border border-purple-500/30 rounded-3xl space-y-4 shadow-xl">
                  <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">
                    {editingHistory ? 'Modifica Intervento' : 'Intervento Passato'}
                  </h3>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Parte Sostituita</label>
                    <input name="h_name" defaultValue={editingHistory?.component_name || ''} required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Data Cambio</label>
                      <input name="h_date" type="date" defaultValue={editingHistory?.replacement_date.split('T')[0] || new Date().toISOString().split('T')[0]} required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Km Bici al cambio</label>
                      <input name="h_km" type="number" step="0.1" defaultValue={editingHistory?.replaced_at_km || bike.total_km} required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Km Percorsi (Uso)</label>
                      <input name="h_dist" type="number" step="0.1" defaultValue={editingHistory?.distance_covered || 0} required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Note / Brand</label>
                      <input name="h_notes" defaultValue={editingHistory?.notes || ''} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm" placeholder="Es: Shimano Ultegra..." />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setEditingHistory(null); setIsAddingManualHistory(false); }} className="flex-1 py-3 text-xs font-bold text-slate-400 uppercase">Annulla</button>
                    <button type="submit" disabled={isSaving} className="flex-[2] py-3 bg-purple-600 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg">
                      {isSaving ? 'Salvataggio...' : 'Salva Storico'}
                    </button>
                  </div>
                </form>
              )}

              {isLoadingHistory ? (
                <div className="py-20 text-center"><i className="fa-solid fa-spinner fa-spin text-2xl text-purple-500"></i></div>
              ) : history.length > 0 ? (
                <div className="space-y-4 pb-10">
                  {history.map((item) => (
                    <div key={item.id} className="p-6 bg-slate-800/20 border border-slate-700/30 rounded-3xl relative group hover:border-purple-500/20 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-black text-white leading-none mb-1">{item.component_name}</h4>
                          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                            {new Date(item.replacement_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setEditingHistory(item)} className="h-9 w-9 bg-slate-800 text-slate-400 hover:text-blue-400 rounded-xl border border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <i className="fa-solid fa-pen text-[10px]"></i>
                          </button>
                          <button onClick={() => handleDeleteHistory(item.id)} className="h-9 w-9 bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl border border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <i className="fa-solid fa-trash text-[10px]"></i>
                          </button>
                          <div className="text-right">
                            <p className="text-xl font-black text-white leading-none">+{item.distance_covered.toLocaleString()} <span className="text-[9px] text-slate-500">km</span></p>
                          </div>
                        </div>
                      </div>
                      {item.notes && <p className="text-xs text-slate-400 italic bg-black/20 p-3 rounded-xl border border-white/5">{item.notes}</p>}
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-3 flex items-center gap-2">
                        <i className="fa-solid fa-gauge-high opacity-50"></i>
                        Sostituito a {item.replaced_at_km.toLocaleString()} km totali della bici
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 opacity-30"><p className="text-[10px] font-black uppercase tracking-widest">Nessuno storico</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
