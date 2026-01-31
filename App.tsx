
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { supabaseService } from './services/supabase.ts';
import { stravaService } from './services/strava.ts';
import { extractSpecsFromUrl } from './services/gemini.ts';
import { Bike, MaintenanceRecord, BikeType } from './types.ts';

const App: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [maintenance, setMaintenance] = useState<Record<string, MaintenanceRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<Bike | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const apiKeyExists = !!process.env.API_KEY;

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
  }, [fetchData]);

  const syncKm = async (bike: Bike) => {
    const updatedBike = { ...bike, total_km: bike.total_km + Math.random() * 50 };
    await supabaseService.saveBike(updatedBike);
    setBikes(prev => prev.map(b => b.id === bike.id ? updatedBike : b));
  };

  const handleDeleteBike = async (bike: Bike) => {
    if (window.confirm(`Sei sicuro di voler eliminare la bici "${bike.name}"?`)) {
      await supabaseService.deleteBike(bike.id);
      setBikes(prev => prev.filter(b => b.id !== bike.id));
    }
  };

  const handleAddBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setExtractionError(null);
    setExtractionStatus("Avvio processo...");
    const formData = new FormData(e.currentTarget);
    const manualName = formData.get('name') as string;
    const url = formData.get('url') as string;
    const manualType = formData.get('type') as BikeType;
    
    setIsExtracting(true);
    
    let aiResult = null;
    if (url) {
      try {
        aiResult = await extractSpecsFromUrl(url, (status) => setExtractionStatus(status));
        if (!aiResult) {
          setExtractionError("L'AI non ha restituito dati validi. Controlla la console (F12) per i dettagli.");
        }
      } catch (err: any) {
        setExtractionError(`Errore API: ${err.message}`);
      }
    }

    const finalName = (aiResult?.extractedName && aiResult.extractedName !== "unknown" && aiResult.extractedName !== "Nome Bici") 
      ? aiResult.extractedName 
      : (manualName || "Bici senza nome");
      
    const finalType = (aiResult?.extractedType && ['Corsa', 'Gravel', 'MTB'].includes(aiResult.extractedType)) 
      ? aiResult.extractedType as BikeType 
      : manualType;

    const newBike: Bike = {
      id: crypto.randomUUID(),
      user_id: 'current-user',
      name: finalName,
      type: finalType,
      strava_gear_id: null,
      total_km: parseFloat(formData.get('km') as string) || 0,
      product_url: url,
      specs: aiResult?.specs || undefined
    };
    
    await supabaseService.saveBike(newBike);
    
    const defaultParts = [
      { name: 'Catena', limit: 3000 },
      { name: 'Pasticche Freni', limit: 1500 }
    ];

    for (const part of defaultParts) {
      await supabaseService.saveMaintenance({
        id: crypto.randomUUID(),
        bike_id: newBike.id,
        component_name: part.name,
        km_at_install: newBike.total_km,
        last_check_km: newBike.total_km,
        lifespan_limit: part.limit
      });
    }

    setIsExtracting(false);
    setExtractionStatus(null);
    if (!url || aiResult) {
      setShowAddForm(false);
      fetchData();
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Le Tue Bici</h2>
        <button 
          onClick={() => { setExtractionError(null); setExtractionStatus(null); setShowAddForm(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
        >
          <i className="fa-solid fa-plus"></i>
          Nuova Bici
        </button>
      </div>

      {!apiKeyExists && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl"></i>
          <div>
            <p className="text-sm font-bold text-red-200">Chiave API Mancante</p>
            <p className="text-xs text-red-400/80">L'estrazione AI non funzionerà senza una chiave API valida in process.env.API_KEY.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Caricamento...</p>
        </div>
      ) : bikes.length === 0 ? (
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center">
          <i className="fa-solid fa-bicycle text-6xl text-slate-800 mb-6"></i>
          <h3 className="text-xl font-bold text-white mb-2">Nessuna bici</h3>
          <button onClick={() => setShowAddForm(true)} className="text-blue-500 hover:underline text-sm font-bold">Aggiungine una ora</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bikes.map(bike => (
            <BikeCard 
              key={bike.id} 
              bike={bike} 
              maintenance={maintenance[bike.id] || []}
              onAnalyze={(b) => setActiveAnalysis(b)}
              onUpdateKm={syncKm}
              onDelete={handleDeleteBike}
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white">Configura Bici</h2>
              {!isExtracting && (
                <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              )}
            </div>
            <form onSubmit={handleAddBike} className="p-6 space-y-4">
              {extractionError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3">
                  <i className="fa-solid fa-circle-xmark text-red-500 mt-0.5"></i>
                  <p className="text-xs text-red-200">{extractionError}</p>
                </div>
              )}

              {extractionStatus && isExtracting && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                  <i className="fa-solid fa-spinner fa-spin text-blue-500"></i>
                  <p className="text-xs text-blue-200 font-medium">{extractionStatus}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Scheda Tecnica</label>
                <input name="url" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="https://..." disabled={isExtracting} />
              </div>

              <div className={isExtracting ? 'opacity-30 pointer-events-none' : ''}>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-3">Oppure manuale</p>
                <div className="space-y-4">
                  <input name="name" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="Nome Modello" />
                  <div className="grid grid-cols-2 gap-4">
                    <select name="type" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none">
                      <option value="Corsa">Corsa</option>
                      <option value="Gravel">Gravel</option>
                      <option value="MTB">MTB</option>
                    </select>
                    <input type="number" name="km" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="KM" />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isExtracting}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-3"
              >
                {isExtracting ? 'Elaborazione AI...' : 'Aggiungi Bici'}
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
