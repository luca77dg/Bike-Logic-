
import React, { useState, useRef } from 'react';
import { Bike, MaintenanceRecord, MaintenanceHistory } from '../types.ts';
import { analyzeBikePart } from '../services/gemini.ts';
import { supabaseService } from '../services/supabase.ts';

interface AIVisionProps {
  bike: Bike;
  records: MaintenanceRecord[];
  onUpdate: () => void;
  onClose: () => void;
}

const ANALYZABLE_COMPONENTS = [
  { name: 'Catena', desc: 'Verifica allungamento e sporcizia', icon: 'fa-link' },
  { name: 'Pacco Pignoni', desc: 'Stato dei denti e usura', icon: 'fa-gear' },
  { name: 'Pasticche', desc: 'Residuo materiale frenante', icon: 'fa-circle-stop' },
  { name: 'Copertoni', desc: 'Battistrada e crepe laterali', icon: 'fa-ring' },
  { name: 'Dischi', desc: 'Segni di surriscaldamento o solchi', icon: 'fa-compact-disc' },
];

export const AIVision: React.FC<AIVisionProps> = ({ bike, records, onUpdate, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
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

  const handleUpdateComponent = async () => {
    const record = records.find(r => r.id === selectedRecordId);
    if (!record) return;

    const customKm = window.prompt(
      `Confermi la sostituzione di: ${record.component_name} basandoti sull'analisi IA?\nInserisci i km della bici al momento della sostituzione:`,
      bike.total_km.toString()
    );
    
    if (customKm !== null) {
      const resetKm = parseFloat(customKm);
      if (isNaN(resetKm)) {
        alert("Inserisci un valore numerico valido.");
        return;
      }

      // 1. Salva nello storico
      const kmPercorsi = Math.max(0, resetKm - record.km_at_install);
      const historyRecord: MaintenanceHistory = {
        id: crypto.randomUUID(),
        bike_id: bike.id,
        component_name: record.component_name,
        replaced_at_km: resetKm,
        distance_covered: kmPercorsi,
        notes: `Sostituzione guidata da analisi IA. ${record.notes || ''}`,
        replacement_date: new Date().toISOString()
      };
      await supabaseService.addHistoryRecord(historyRecord);

      // 2. Aggiorna record attuale
      const updated = { 
        ...record, 
        km_at_install: resetKm,
        last_check_km: resetKm 
      };
      await supabaseService.saveMaintenance(updated);
      onUpdate();
      alert("Manutenzione registrata e salvata nello storico!");
      onClose();
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
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-blue-600/5 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white">Vision AI Check-up</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{bike.name}</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {!image && !result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2rem]">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-circle-info"></i>
                  Cosa posso analizzare?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ANALYZABLE_COMPONENTS.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-700">
                        <i className={`fa-solid ${comp.icon} text-blue-400 text-xs`}></i>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white uppercase leading-none mb-1">{comp.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-none">{comp.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {records.length > 0 && (
                <div className="space-y-3">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Componente da monitorare</label>
                   <select 
                    value={selectedRecordId}
                    onChange={(e) => setSelectedRecordId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:ring-2 ring-blue-600/30 transition-all appearance-none cursor-pointer"
                   >
                     <option value="">-- Seleziona (Opzionale) --</option>
                     {records.map(r => (
                       <option key={r.id} value={r.id}>{r.component_name}</option>
                     ))}
                   </select>
                </div>
              )}
            </div>
          )}

          <div 
            onClick={() => !analyzing && fileInputRef.current?.click()}
            className={`relative aspect-square sm:aspect-video w-full bg-slate-800 rounded-[2rem] flex items-center justify-center border-2 border-dashed transition-all overflow-hidden ${image ? 'border-blue-500' : 'border-slate-700 cursor-pointer hover:border-blue-500/50'}`}
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover" alt="Bike Part" />
            ) : (
              <div className="text-center p-10 group">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl border border-slate-700 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                  <i className="fa-solid fa-camera text-3xl text-slate-700 group-hover:text-white"></i>
                </div>
                <p className="text-white font-black text-sm uppercase tracking-widest mb-2">Carica o Scatta Foto</p>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter">Inquadra da vicino la catena o le pasticche</p>
              </div>
            )}
            {analyzing && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                  <i className="fa-solid fa-wand-magic-sparkles absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 animate-pulse"></i>
                </div>
                <p className="mt-4 text-white font-black text-xs uppercase tracking-[0.2em] animate-pulse">Analisi IA in corso...</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

          {image && !result && !analyzing && (
            <div className="flex flex-col gap-4">
              {records.length > 0 && (
                <div className="space-y-3 px-1">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cosa stai analizzando?</label>
                   <select 
                    value={selectedRecordId}
                    onChange={(e) => setSelectedRecordId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:ring-2 ring-blue-600/30 transition-all appearance-none cursor-pointer"
                   >
                     <option value="">-- Scegli componente tracciato --</option>
                     {records.map(r => (
                       <option key={r.id} value={r.id}>{r.component_name}</option>
                     ))}
                   </select>
                </div>
              )}
              <div className="flex gap-4">
                <button 
                  onClick={() => setImage(null)}
                  className="flex-1 py-5 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleAnalyze} 
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  Analizza con Gemini
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-slate-800/80 p-8 rounded-[2.5rem] border border-blue-600/30 animate-in zoom-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
                  <i className="fa-solid fa-brain text-blue-400"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">Responso Tecnico</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mt-1 italic">Analisi visiva avanzata</p>
                </div>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed font-medium">{result}</p>
              
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                <button 
                  onClick={() => { setImage(null); setResult(null); }} 
                  className="bg-slate-900 border border-slate-700 px-6 py-4 rounded-2xl text-[10px] font-black text-slate-400 hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest"
                >
                  <i className="fa-solid fa-rotate-left mr-2"></i>
                  Nuova Analisi
                </button>
                {selectedRecordId && (
                  <button 
                    onClick={handleUpdateComponent}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-rotate"></i>
                    Aggiorna {records.find(r => r.id === selectedRecordId)?.component_name}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
