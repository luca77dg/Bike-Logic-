
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { supabaseService } from './services/supabase.ts';
import { extractBikeData } from './services/gemini.ts';
import { Bike, MaintenanceRecord, BikeType } from './types.ts';

const App: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [maintenance, setMaintenance] = useState<Record<string, MaintenanceRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<Bike | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  const checkKey = useCallback(async () => {
    // @ts-ignore
    if (window.aistudio?.hasSelectedApiKey) {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected || !!process.env.API_KEY);
    } else {
      setHasApiKey(!!process.env.API_KEY);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const bikeData = await supabaseService.getBikes();
    setBikes(bikeData);
    const maintData: Record<string, MaintenanceRecord[]> = {};
    for (const b of bikeData) {
      maintData[b.id] = await supabaseService.getMaintenance(b.id);
    }
    setMaintenance(maintData);
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchData();
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, [fetchData, checkKey]);

  const handleOpenKeySelector = async () => {
    try {
      // @ts-ignore
      if (window.aistudio?.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
        setErrorMessage(null);
      } else {
        alert("Configura la variabile API_KEY nelle impostazioni del tuo progetto Vercel.");
      }
    } catch (e) {
      console.error("Errore selettore:", e);
    }
  };

  const handleAddBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const query = (formData.get('query') as string).trim();
    if (!query) return;

    setIsExtracting(true);
    setExtractionStatus("Interrogazione AI...");

    try {
      const aiResult = await extractBikeData(query, setExtractionStatus);
      
      const newBike: Bike = {
        id: crypto.randomUUID(),
        user_id: 'user',
        name: aiResult?.extractedName || query,
        type: (aiResult?.extractedType as BikeType) || (formData.get('type') as BikeType),
        strava_gear_id: null,
        total_km: parseFloat(formData.get('km') as string) || 0,
        specs: aiResult?.specs
      };
      
      await supabaseService.saveBike(newBike);
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      if (err.message === "ENTITY_NOT_FOUND") {
        setHasApiKey(false);
        setErrorMessage("Chiave API non valida o non trovata. Riconnetti il profilo.");
        handleOpenKeySelector();
      } else {
        setErrorMessage(err.message || "Errore durante la ricerca.");
      }
    } finally {
      setIsExtracting(false);
      setExtractionStatus(null);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-white">Il Tuo Garage</h2>
          {!hasApiKey && (
            <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full w-fit">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">AI non connessa</span>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          {!hasApiKey && (
            <button onClick={handleOpenKeySelector} className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-slate-700 hover:bg-slate-700 transition-all">
              <i className="fa-solid fa-key"></i> Collega API
            </button>
          )}
          <button onClick={() => { setErrorMessage(null); setShowAddForm(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all">
            <i className="fa-solid fa-plus"></i> Aggiungi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><i className="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i></div>
      ) : bikes.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800">
           <i className="fa-solid fa-bicycle text-6xl text-slate-800 mb-6 block"></i>
           <p className="text-slate-400 font-medium">Inizia aggiungendo la tua prima bicicletta.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bikes.map(bike => (
            <BikeCard 
              key={bike.id} 
              bike={bike} 
              maintenance={maintenance[bike.id] || []} 
              onAnalyze={setActiveAnalysis} 
              onUpdateKm={() => {}} 
              onDelete={async (b) => {
                if(confirm("Eliminare questa bici?")) {
                  await supabaseService.deleteBike(b.id);
                  fetchData();
                }
              }} 
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-3xl font-black text-white">Nuova Bici</h2>
              <button onClick={() => setShowAddForm(false)} className="bg-slate-800 h-12 w-12 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddBike} className="p-10 space-y-8">
              {errorMessage && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-sm font-bold flex gap-4 items-center">
                  <i className="fa-solid fa-circle-exclamation text-xl"></i>
                  <span className="flex-1">{errorMessage}</span>
                  {!hasApiKey && <button type="button" onClick={handleOpenKeySelector} className="underline">Configura</button>}
                </div>
              )}

              <div className="space-y-6">
                <div className="p-8 bg-blue-600/5 rounded-[2.5rem] border border-blue-600/10">
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Modello per Ricerca AI</label>
                  <input 
                    name="query" 
                    autoFocus 
                    required 
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-5 text-white text-xl outline-none focus:ring-4 ring-blue-600/20" 
                    placeholder="Es: Canyon Grizl CF SL 8" 
                  />
                  {isExtracting && (
                    <div className="mt-4 flex items-center gap-3 text-blue-400 text-xs font-black">
                       <i className="fa-solid fa-spinner fa-spin"></i>
                       {extractionStatus}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Km Attuali</label>
                    <input type="number" name="km" className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Fallback Categoria</label>
                    <select name="type" className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none">
                      <option value="MTB">MTB</option>
                      <option value="Corsa">Corsa</option>
                      <option value="Gravel">Gravel</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isExtracting} 
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-6 rounded-[2rem] shadow-xl shadow-blue-900/40 flex items-center justify-center gap-4 transition-all text-xl"
              >
                {isExtracting ? 'Elaborazione...' : 'Ricerca e Salva'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeAnalysis && (
        <AIVision bikeName={activeAnalysis.name} onClose={() => setActiveAnalysis(null)} />
      )}
    </Layout>
  );
};

export default App;
