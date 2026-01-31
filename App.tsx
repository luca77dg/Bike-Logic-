
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
  const [extractionError, setExtractionError] = useState<string | null>(null);

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
    if (window.confirm(`Sei sicuro di voler eliminare la bici "${bike.name}"? Tutti i dati di manutenzione andranno persi.`)) {
      await supabaseService.deleteBike(bike.id);
      setBikes(prev => prev.filter(b => b.id !== bike.id));
      const newMaint = { ...maintenance };
      delete newMaint[bike.id];
      setMaintenance(newMaint);
    }
  };

  const handleAddBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setExtractionError(null);
    const formData = new FormData(e.currentTarget);
    const manualName = formData.get('name') as string;
    const url = formData.get('url') as string;
    const manualType = formData.get('type') as BikeType;
    
    setIsExtracting(true);
    
    let aiResult = null;
    if (url) {
      try {
        aiResult = await extractSpecsFromUrl(url);
        if (!aiResult) {
          setExtractionError("L'AI non è riuscita a trovare informazioni per questo link. Verranno usati i dati manuali.");
        }
      } catch (err) {
        setExtractionError("Errore durante la ricerca AI. Verifica la connessione o il link.");
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
      { name: 'Pasticche Freni', limit: 1500 },
      { name: 'Pneumatico Posteriore', limit: 4000 }
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
    // Se non c'è stato un errore critico, chiudiamo il form
    if (!url || aiResult) {
      setShowAddForm(false);
      fetchData();
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Le Tue Bici</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => { setExtractionError(null); setShowAddForm(true); }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            <i className="fa-solid fa-plus"></i>
            Nuova Bici
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 animate-pulse">Consultando il database...</p>
        </div>
      ) : bikes.length === 0 ? (
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center">
          <i className="fa-solid fa-bicycle text-6xl text-slate-800 mb-6"></i>
          <h3 className="text-xl font-bold text-white mb-2">Nessuna bici trovata</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Aggiungi la tua bici per iniziare il monitoraggio AI.</p>
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
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white">Configura Bicicletta</h2>
              {!isExtracting && (
                <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              )}
            </div>
            <form onSubmit={handleAddBike} className="p-6 space-y-4">
              {extractionError && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in duration-200">
                  <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5"></i>
                  <p className="text-xs text-amber-200 leading-tight">{extractionError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-widest">Link Prodotto AI</label>
                <div className="relative">
                  <input name="url" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors pl-10" placeholder="https://www.trekbikes.com/..." disabled={isExtracting} />
                  <i className="fa-solid fa-link absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"></i>
                </div>
                <p className="text-[10px] text-blue-400 mt-1 italic font-medium">✨ Gemini cercherà le specifiche ufficiali tramite Google Search.</p>
              </div>

              <div className={`border-t border-slate-800 pt-4 transition-opacity duration-300 ${isExtracting ? 'opacity-30' : 'opacity-70'}`}>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-widest">Informazioni Base</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-widest">Nome Modello</label>
                    <input name="name" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Es. Trek Emonda" disabled={isExtracting} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-widest">Tipo</label>
                      <select name="type" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none" disabled={isExtracting}>
                        <option value="Corsa">Corsa</option>
                        <option value="Gravel">Gravel</option>
                        <option value="MTB">MTB</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-widest">KM Attuali</label>
                      <input type="number" name="km" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="0" disabled={isExtracting} />
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isExtracting}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl mt-4 transition-all active:scale-95 shadow-lg shadow-blue-900/40 flex flex-col items-center justify-center"
              >
                {isExtracting ? (
                  <>
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-magnifying-glass fa-spin text-blue-200"></i>
                      <span>Ricerca Web in corso...</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-tighter opacity-70 mt-1">L'AI sta consultando i siti tecnici</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bicycle mb-1"></i>
                    Aggiungi Bicicletta
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeAnalysis && (
        <AIVision 
          bikeName={activeAnalysis.name} 
          onClose={() => setActiveAnalysis(null)} 
        />
      )}
    </Layout>
  );
};

export default App;
