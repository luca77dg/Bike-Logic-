import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { supabaseService } from './services/supabase.ts';
import { extractBikeData } from './services/gemini.ts';
import { Bike, MaintenanceRecord, BikeType } from './types.ts';

// Added missing React import to fix 'Cannot find namespace React' errors on lines 10 and 34
const App: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [maintenance, setMaintenance] = useState<Record<string, MaintenanceRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<Bike | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);
    const query = (formData.get('query') as string).trim();
    const manualKm = parseFloat(formData.get('km') as string) || 0;
    
    if (!query) {
      setErrorMessage("Per favore, inserisci almeno il nome del modello.");
      return;
    }

    setIsExtracting(true);
    setExtractionStatus("Inizializzazione AI...");

    try {
      const aiResult = await extractBikeData(query, setExtractionStatus);
      
      const newBike: Bike = {
        id: crypto.randomUUID(),
        user_id: 'user',
        name: aiResult?.extractedName || query,
        type: (aiResult?.extractedType as BikeType) || (formData.get('type') as BikeType),
        strava_gear_id: null,
        total_km: manualKm,
        specs: aiResult?.specs
      };
      
      await supabaseService.saveBike(newBike);
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      console.error("Errore aggiunta bici:", err);
      setErrorMessage(err.message || "Impossibile completare la ricerca. Riprova con un nome più semplice.");
    } finally {
      setIsExtracting(false);
      setExtractionStatus(null);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-white">Il Tuo Garage</h2>
        <button 
          onClick={() => { setErrorMessage(null); setShowAddForm(true); }} 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/40 active:scale-95"
        >
          <i className="fa-solid fa-plus mr-2"></i> Aggiungi Bici
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Accesso garage...</p>
        </div>
      ) : bikes.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800">
           <i className="fa-solid fa-bicycle text-6xl text-slate-800 mb-6 block"></i>
           <p className="text-slate-400 font-medium mb-6">Il tuo garage virtuale è pronto.</p>
           <button onClick={() => setShowAddForm(true)} className="text-blue-500 font-bold hover:underline">Inserisci la tua prima bici</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bikes.map(bike => (
            <BikeCard 
              key={bike.id} 
              bike={bike} 
              maintenance={maintenance[bike.id] || []} 
              onAnalyze={setActiveAnalysis} 
              onUpdateKm={() => {}} 
              onDelete={async (b) => {
                if(confirm(`Sei sicuro di voler eliminare la tua ${b.name}?`)) {
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
          <div className="bg-slate-900 border border-slate-800 w-full max-xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Crea Scheda AI</h2>
                <p className="text-slate-500 font-medium">Scrivi modello e anno per auto-compilazione</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="bg-slate-800 h-12 w-12 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddBike} className="p-10 space-y-8">
              {errorMessage && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium flex gap-3 items-center animate-pulse">
                  <i className="fa-solid fa-circle-exclamation text-lg"></i>
                  {errorMessage}
                </div>
              )}

              <div className="space-y-6">
                <div className="p-6 bg-blue-600/5 rounded-[2rem] border border-blue-600/10 relative">
                  <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Assistente di Ricerca AI</label>
                  <input 
                    name="query" 
                    autoFocus
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-white placeholder-slate-600 outline-none focus:ring-4 ring-blue-600/20 transition-all text-lg" 
                    placeholder="Esempio: Specialized Epic Expert 2023" 
                  />
                  {isExtracting && (
                    <div className="mt-4 flex items-center gap-3 text-blue-400 text-xs font-bold bg-blue-900/20 py-3 px-5 rounded-2xl border border-blue-600/30">
                       <i className="fa-solid fa-spinner fa-spin"></i>
                       {extractionStatus}
                    </div>
                  )}
                </div>

                {!isExtracting && (
                  <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Km Percorsi Attuali</label>
                      <input type="number" name="km" className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-colors" placeholder="0.0" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Fallback Categoria</label>
                      <select name="type" className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-colors">
                        <option value="MTB">Mountain Bike</option>
                        <option value="Corsa">Bici da Corsa</option>
                        <option value="Gravel">Gravel Bike</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <button 
                  type="submit" 
                  disabled={isExtracting} 
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-4 transition-all text-xl active:scale-95"
                >
                  {isExtracting ? (
                    'AI sta lavorando per te...'
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      Ricerca e Aggiungi
                    </>
                  )}
                </button>
                {!isExtracting && (
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-500 font-bold hover:text-slate-300 transition-colors text-sm">
                    Annulla
                  </button>
                )}
              </div>
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