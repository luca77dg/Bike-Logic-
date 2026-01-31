
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { supabaseService } from './services/supabase.ts';
import { testAiConnection, extractBikeData } from './services/gemini.ts';
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
    const query = formData.get('query') as string;
    const manualName = formData.get('name') as string;
    
    let aiResult = null;
    if (query && query.trim().length > 3) {
      setIsExtracting(true);
      aiResult = await extractBikeData(query, setExtractionStatus);
      setIsExtracting(false);
    }

    const newBike: Bike = {
      id: crypto.randomUUID(),
      user_id: 'user',
      name: aiResult?.extractedName || manualName || query || "Nuova Bici",
      type: (aiResult?.extractedType as BikeType) || (formData.get('type') as BikeType),
      strava_gear_id: null,
      total_km: parseFloat(formData.get('km') as string) || 0,
      specs: aiResult?.specs
    };
    
    await supabaseService.saveBike(newBike);
    setShowAddForm(false);
    setTestResult(null);
    fetchData();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-white">Il Tuo Garage</h2>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
        >
          <i className="fa-solid fa-plus mr-2"></i> Aggiungi Bici
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Sincronizzazione garage...</p>
        </div>
      ) : bikes.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
           <i className="fa-solid fa-bicycle text-5xl text-slate-800 mb-4 block"></i>
           <p className="text-slate-500">Il garage è vuoto. Aggiungi la tua prima bici!</p>
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
                if(confirm('Eliminare questa bici?')) {
                  await supabaseService.deleteBike(b.id);
                  fetchData();
                }
              }} 
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Nuova Bici</h2>
                <p className="text-slate-500 text-sm">L'AI troverà le specifiche per te</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="bg-slate-800 h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <form onSubmit={handleAddBike} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                  <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Ricerca Magica AI</label>
                  <input 
                    name="query" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 ring-blue-600/50" 
                    placeholder="Esempio: Trek X-Caliber 8 2023 oppure incolla link" 
                  />
                  <p className="mt-2 text-[10px] text-slate-500 italic">Inserisci modello e anno per i migliori risultati.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo</label>
                    <select name="type" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none">
                      <option value="MTB">MTB</option>
                      <option value="Corsa">Corsa</option>
                      <option value="Gravel">Gravel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Km Totali</label>
                    <input type="number" name="km" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="0" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={isExtracting} 
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3 transition-all"
                >
                  {isExtracting ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> {extractionStatus || 'Ricerca in corso...'}</>
                  ) : 'Aggiungi al Garage'}
                </button>

                <div className="flex flex-col gap-2 mt-4 border-t border-slate-800 pt-4">
                   <button type="button" onClick={handleTestKey} className="text-[10px] font-bold text-slate-500 hover:text-blue-400 flex items-center gap-2 justify-center">
                      <i className="fa-solid fa-shield-heart"></i> Verifica Stato API Gemini
                   </button>
                   {testResult && (
                     <p className={`text-[10px] text-center p-2 rounded-lg ${testResult.success ? 'text-green-400 bg-green-400/5' : 'text-red-400 bg-red-400/5'}`}>
                        {testResult.message}
                     </p>
                   )}
                </div>
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
