
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { supabaseService } from './services/supabase.ts';
import { testAiConnection, extractSpecsFromUrl } from './services/gemini.ts';
import { Bike, MaintenanceRecord, BikeType } from './types.ts';

const App: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [maintenance, setMaintenance] = useState<Record<string, MaintenanceRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<Bike | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

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

  const handleTestKey = async () => {
    setTestResult(null);
    const res = await testAiConnection();
    setTestResult(res);
  };

  const handleAddBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;
    
    setIsExtracting(true);
    let aiResult = url ? await extractSpecsFromUrl(url, setExtractionStatus) : null;

    const newBike: Bike = {
      id: crypto.randomUUID(),
      user_id: 'user',
      name: aiResult?.extractedName || (formData.get('name') as string) || "Nuova Bici",
      type: (aiResult?.extractedType as BikeType) || (formData.get('type') as BikeType),
      strava_gear_id: null,
      total_km: parseFloat(formData.get('km') as string) || 0,
      specs: aiResult?.specs
    };
    
    await supabaseService.saveBike(newBike);
    setIsExtracting(false);
    setShowAddForm(false);
    fetchData();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-white">Le Tue Bici</h2>
        <button onClick={() => { setTestResult(null); setShowAddForm(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg">
          <i className="fa-solid fa-plus mr-2"></i> Nuova Bici
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-slate-500">Caricamento garage...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bikes.map(bike => (
            <BikeCard key={bike.id} bike={bike} maintenance={maintenance[bike.id] || []} onAnalyze={setActiveAnalysis} onUpdateKm={() => {}} onDelete={() => {}} />
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Aggiungi Bici</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <form onSubmit={handleAddBike} className="p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Diagnostica API</label>
                <button type="button" onClick={handleTestKey} className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 py-2 rounded-lg font-bold border border-slate-700 transition-colors">
                  <i className="fa-solid fa-vial mr-2"></i> Verifica Chiave su Vercel
                </button>
                {testResult && (
                  <div className={`text-[10px] p-2 rounded-lg border ${testResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {testResult.message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Scheda Tecnica (AI)</label>
                <input name="url" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" placeholder="https://www.trekbikes.com/..." />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <input name="name" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="Nome Modello (opzionale)" />
                <div className="grid grid-cols-2 gap-4">
                  <select name="type" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none">
                    <option value="Corsa">Corsa</option>
                    <option value="Gravel">Gravel</option>
                    <option value="MTB">MTB</option>
                  </select>
                  <input type="number" name="km" className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="KM Iniziali" />
                </div>
              </div>
              
              <button type="submit" disabled={isExtracting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-3">
                {isExtracting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> {extractionStatus || 'Elaborazione...'}</>
                ) : 'Salva Bici'}
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
