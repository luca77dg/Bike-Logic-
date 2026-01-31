
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { supabaseService } from './services/supabase.ts';
import { stravaService } from './services/strava.ts';
import { extractSpecsFromUrl } from './services/gemini.ts';
import { Bike, MaintenanceRecord } from './types.ts';

const STRAVA_CLIENT_ID = "YOUR_STRAVA_CLIENT_ID";
const STRAVA_CLIENT_SECRET = "YOUR_STRAVA_CLIENT_SECRET";

const App: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [maintenance, setMaintenance] = useState<Record<string, MaintenanceRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<Bike | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

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

  const handleAddBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    
    setIsExtracting(true);
    
    let specs = undefined;
    if (url) {
      specs = await extractSpecsFromUrl(url, name);
    }

    const newBike: Bike = {
      id: crypto.randomUUID(),
      user_id: 'current-user',
      name,
      type: formData.get('type') as any,
      strava_gear_id: formData.get('gearId') as string,
      total_km: parseFloat(formData.get('km') as string) || 0,
      product_url: url,
      specs: specs || undefined
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
    setShowAddForm(false);
    fetchData();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Le Tue Bici</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddForm(true)}
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
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white">Configura Bicicletta</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white" disabled={isExtracting}>
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleAddBike} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-widest">Modello Bici</label>
                <input required name="name" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Es. Trek Domane AL 4" disabled={isExtracting} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-widest">Link Prodotto (Opzionale)</label>
                <div className="relative">
                  <input name="url" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors pl-10" placeholder="https://www.trekbikes.com/..." disabled={isExtracting} />
                  <i className="fa-solid fa-link absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"></i>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 italic">L'AI estrapolerà telaio, gruppo e ruote dal link fornito.</p>
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
              
              <button 
                type="submit" 
                disabled={isExtracting}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl mt-4 transition-all active:scale-95 shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3"
              >
                {isExtracting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    AI sta estraendo i dati...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i>
                    Salva e Genera Scheda
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
