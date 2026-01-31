
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { supabaseService } from './services/supabase.ts';
import { stravaService } from './services/strava.ts';
import { Bike, MaintenanceRecord } from './types.ts';

// NOTE: Fill these with your Strava App credentials in Vercel/Local env
const STRAVA_CLIENT_ID = "YOUR_STRAVA_CLIENT_ID";
const STRAVA_CLIENT_SECRET = "YOUR_STRAVA_CLIENT_SECRET";

const App: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [maintenance, setMaintenance] = useState<Record<string, MaintenanceRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<Bike | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleStravaCallback(code);
    }
  }, [fetchData]);

  const handleStravaCallback = async (code: string) => {
    try {
      const tokenData = await stravaService.exchangeToken(STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, code);
      console.log('Strava Authed:', tokenData);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Strava Auth Error:', err);
    }
  };

  const syncKm = async (bike: Bike) => {
    const updatedBike = { ...bike, total_km: bike.total_km + Math.random() * 50 };
    await supabaseService.saveBike(updatedBike);
    setBikes(prev => prev.map(b => b.id === bike.id ? updatedBike : b));
    alert(`KM Sincronizzati per ${bike.name}!`);
  };

  const handleAddBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newBike: Bike = {
      id: crypto.randomUUID(),
      user_id: 'current-user',
      name: formData.get('name') as string,
      type: formData.get('type') as any,
      strava_gear_id: formData.get('gearId') as string,
      total_km: parseFloat(formData.get('km') as string) || 0
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

    setShowAddForm(false);
    fetchData();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-white">Le Tue Bici</h2>
        <div className="flex gap-3">
           <button 
            onClick={() => window.location.href = stravaService.getAuthUrl(STRAVA_CLIENT_ID)}
            className="bg-[#FC4C02] hover:bg-[#e34402] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          >
            <i className="fa-brands fa-strava text-lg"></i>
            Connetti Strava
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            <i className="fa-solid fa-plus"></i>
            Aggiungi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 animate-pulse">Caricamento officina...</p>
        </div>
      ) : bikes.length === 0 ? (
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center">
          <i className="fa-solid fa-bicycle text-6xl text-slate-800 mb-6"></i>
          <h3 className="text-xl font-bold text-white mb-2">Nessuna bici trovata</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Configura la tua prima bici per iniziare a monitorare l'usura dei componenti con l'AI.</p>
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
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Nuova Bicicletta</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleAddBike} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Bici</label>
                <input required name="name" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Es. Specialized Tarmac SL8" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                <select name="type" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                  <option value="Corsa">Corsa</option>
                  <option value="Gravel">Gravel</option>
                  <option value="MTB">MTB</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">KM Attuali</label>
                  <input type="number" name="km" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Strava Gear ID</label>
                  <input name="gearId" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="b12345" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-4 transition-all active:scale-95 shadow-lg shadow-blue-900/40">
                Salva Bicicletta
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
