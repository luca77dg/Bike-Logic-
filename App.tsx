
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { ImageCropper } from './components/ImageCropper.tsx';
import { WishlistManager } from './components/WishlistManager.tsx';
import { supabaseService } from './services/supabase.ts';
import { stravaService } from './services/strava.ts';
import { extractBikeData } from './services/gemini.ts';
import { Bike, MaintenanceRecord, BikeType } from './types.ts';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'garage' | 'wishlist'>('garage');
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [maintenance, setMaintenance] = useState<Record<string, MaintenanceRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<Bike | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Strava States
  const [stravaAthlete, setStravaAthlete] = useState<any>(null);
  const [isStravaConfigured, setIsStravaConfigured] = useState(false);

  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const bikeData = await supabaseService.getBikes();
      setBikes(bikeData);
      const maintData: Record<string, MaintenanceRecord[]> = {};
      for (const b of bikeData) {
        maintData[b.id] = await supabaseService.getMaintenance(b.id);
      }
      setMaintenance(maintData);
      return bikeData;
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const syncBikesWithStrava = useCallback(async (currentBikes: Bike[], athlete: any) => {
    if (!athlete || !athlete.bikes) return;
    
    let hasChanged = false;
    const updatedBikes = [...currentBikes];

    for (let i = 0; i < updatedBikes.length; i++) {
      const bike = updatedBikes[i];
      if (bike.strava_gear_id) {
        const stravaBike = athlete.bikes.find((sb: any) => sb.id === bike.strava_gear_id);
        if (stravaBike) {
          const stravaKm = Math.round(stravaBike.distance / 1000);
          if (stravaKm !== bike.total_km) {
            updatedBikes[i] = { ...bike, total_km: stravaKm };
            await supabaseService.saveBike(updatedBikes[i]);
            hasChanged = true;
          }
        }
      }
    }

    if (hasChanged) {
      setBikes(updatedBikes);
    }
  }, []);

  const checkStatus = useCallback(async (shouldSync = false) => {
    setIsCloudEnabled(supabaseService.isConfigured());
    setIsStravaConfigured(stravaService.isConfigured());
    
    const token = await stravaService.getValidToken();
    if (token) {
      const data = await stravaService.getAthleteData();
      if (data) {
        setStravaAthlete(data);
        if (shouldSync) {
          setIsSyncing(true);
          const currentBikes = await supabaseService.getBikes();
          await syncBikesWithStrava(currentBikes, data);
          setIsSyncing(false);
        }
      }
    }

    const envKey = process.env.API_KEY;
    setHasApiKey(!!(envKey && envKey !== 'undefined' && envKey !== 'null' && envKey.trim() !== ''));
  }, [syncBikesWithStrava]);

  useEffect(() => {
    const init = async () => {
      await fetchData();
      await checkStatus(true);
    };

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      stravaService.exchangeToken(code).then(() => init());
    } else {
      init();
    }
  }, [fetchData, checkStatus]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageToCrop(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);
    const query = (formData.get('query') as string).trim();
    if (!query) return;

    const isNew = !editingBike;
    try {
      if (isNew) {
        setIsExtracting(true);
        setExtractionStatus("Interrogazione AI...");
        let aiResult = null;
        try {
          aiResult = await extractBikeData(query, setExtractionStatus);
        } catch (err: any) { console.warn("AI extraction failed"); }
        
        const newBike: Bike = {
          id: crypto.randomUUID(),
          user_id: '', 
          name: aiResult?.extractedName || query,
          type: (aiResult?.extractedType as BikeType) || (formData.get('type') as BikeType),
          strava_gear_id: formData.get('strava_id') as string || null,
          total_km: parseFloat(formData.get('km') as string) || 0,
          product_url: formData.get('product_url') as string || "",
          specs: {
            ...(aiResult?.specs || {}),
            imageUrl: coverPhoto || aiResult?.specs?.imageUrl || null,
            photos: [] 
          }
        };
        await supabaseService.saveBike(newBike);
      } else {
        const updatedBike: Bike = {
          ...editingBike!,
          name: query,
          type: formData.get('type') as BikeType,
          strava_gear_id: formData.get('strava_id') as string || null,
          total_km: parseFloat(formData.get('km') as string) || 0,
          product_url: formData.get('product_url') as string || "",
          specs: {
            ...editingBike!.specs,
            imageUrl: coverPhoto || editingBike!.specs?.imageUrl || null,
          }
        };
        await supabaseService.saveBike(updatedBike);
      }
      setShowForm(false);
      setCoverPhoto(null);
      setEditingBike(null);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || "Errore");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Layout>
      {activeView === 'garage' ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-black text-white">Il Tuo Garage</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {isCloudEnabled && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Cloud Sync</span>
                  </div>
                )}
                {isStravaConfigured && (
                  stravaAthlete ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                      <i className="fa-brands fa-strava text-[9px] text-orange-500"></i>
                      <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Linked</span>
                    </div>
                  ) : (
                    <button onClick={() => window.location.href = stravaService.getAuthUrl()} className="px-3 py-1 bg-slate-800 border border-orange-500/30 rounded-full hover:bg-orange-600 transition-all">
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Link Strava</span>
                    </button>
                  )
                )}
              </div>
            </div>
            <button onClick={() => { setShowForm(true); setEditingBike(null); setCoverPhoto(null); }} className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-500 transition-all active:scale-95 uppercase tracking-widest text-xs">
              AGGIUNGI BICI
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center"><i className="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i></div>
          ) : bikes.length === 0 ? (
            <div className="text-center py-24 bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800">
               <i className="fa-solid fa-bicycle text-6xl text-slate-800 mb-6 block"></i>
               <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Garage Vuoto</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
              {bikes.map(bike => (
                <BikeCard 
                  key={bike.id} bike={bike} maintenance={maintenance[bike.id] || []} 
                  onAnalyze={setActiveAnalysis} 
                  onEdit={(b) => { setEditingBike(b); setCoverPhoto(b.specs?.imageUrl || null); setShowForm(true); }}
                  onUpdateKm={fetchData} 
                  onDelete={async (b) => { if(confirm("Eliminare?")) { await supabaseService.deleteBike(b.id); fetchData(); } }} 
                  onRefresh={fetchData}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="pb-32">
          <WishlistManager />
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-[2.5rem] shadow-2xl flex gap-2 z-40">
        <button 
          onClick={() => setActiveView('garage')}
          className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all ${activeView === 'garage' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
        >
          <i className="fa-solid fa-bicycle"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Garage</span>
        </button>
        <button 
          onClick={() => setActiveView('wishlist')}
          className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all ${activeView === 'wishlist' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
        >
          <i className="fa-solid fa-basket-shopping"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Wishlist</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <div className="bg-[#0f1421] border border-slate-800 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 my-8">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-[#13192a]">
              <h2 className="text-2xl font-black text-white">{editingBike ? 'Modifica Bici' : 'Nuova Bici'}</h2>
              <button onClick={() => setShowForm(false)} className="bg-slate-800/50 h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white border border-slate-700">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveBike} className="p-8 space-y-10 custom-scrollbar max-h-[75vh] overflow-y-auto">
              {errorMessage && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold">{errorMessage}</div>}
              <div className="space-y-6">
                <div onClick={() => fileInputRef.current?.click()} className="aspect-video w-full bg-[#161c2d] border-2 border-dashed border-slate-800 rounded-3xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all">
                  {coverPhoto ? <img src={coverPhoto} className="w-full h-full object-cover" /> : <i className="fa-solid fa-camera text-slate-700 text-2xl"></i>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 ml-1">Modello / Nome</label>
                  <input name="query" defaultValue={editingBike?.name || ''} required className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white outline-none" placeholder="Specialized Tarmac..." />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 ml-1">Km</label>
                    <input type="number" name="km" defaultValue={editingBike?.total_km || 0} className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 ml-1">Tipo</label>
                    <select name="type" defaultValue={editingBike?.type || 'MTB'} className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white appearance-none">
                      <option value="MTB">MTB</option>
                      <option value="Corsa">Corsa</option>
                      <option value="Gravel">Gravel</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isExtracting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs">
                {isExtracting ? 'Elaborazione...' : 'Salva'}
              </button>
            </form>
          </div>
        </div>
      )}

      {imageToCrop && <ImageCropper image={imageToCrop} onCropComplete={(img) => { setCoverPhoto(img); setImageToCrop(null); }} onCancel={() => setImageToCrop(null)} />}
      {activeAnalysis && <AIVision bike={activeAnalysis} records={maintenance[activeAnalysis.id] || []} onUpdate={fetchData} onClose={() => setActiveAnalysis(null)} />}
    </Layout>
  );
};

export default App;
