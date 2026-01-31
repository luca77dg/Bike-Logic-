
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { ImageCropper } from './components/ImageCropper.tsx';
import { supabaseService } from './services/supabase.ts';
import { stravaService } from './services/strava.ts';
import { extractBikeData } from './services/gemini.ts';
import { Bike, MaintenanceRecord, BikeType, BikeSpecs } from './types.ts';

const App: React.FC = () => {
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
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    setIsCloudEnabled(supabaseService.isConfigured());
    setIsStravaConfigured(stravaService.isConfigured());
    
    // Check Strava Auth
    const token = await stravaService.getValidToken();
    if (token && !stravaAthlete) {
      const data = await stravaService.getAthleteData();
      setStravaAthlete(data);
    }

    const envKey = process.env.API_KEY;
    const isEnvKeyValid = !!(envKey && envKey !== 'undefined' && envKey !== 'null' && envKey.trim() !== '');
    
    // @ts-ignore
    if (window.aistudio?.hasSelectedApiKey) {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected || isEnvKeyValid);
    } else {
      setHasApiKey(isEnvKeyValid);
    }
  }, [stravaAthlete]);

  useEffect(() => {
    // Handle Strava OAuth Redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      stravaService.exchangeToken(code).then(() => {
        checkStatus();
      });
    }

    fetchData();
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchData, checkStatus]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const query = (formData.get('query') as string).trim();
    const stravaId = formData.get('strava_id') as string || null;
    if (!query) return;

    const isNew = !editingBike;
    
    try {
      if (isNew) {
        setIsExtracting(true);
        setExtractionStatus("Interrogazione AI...");
        
        let aiResult = null;
        try {
          aiResult = await extractBikeData(query, setExtractionStatus);
        } catch (err: any) {
          console.warn("AI extraction failed, manual entry mode", err);
        }
        
        const newBike: Bike = {
          id: crypto.randomUUID(),
          user_id: '', 
          name: aiResult?.extractedName || query,
          type: (aiResult?.extractedType as BikeType) || (formData.get('type') as BikeType),
          strava_gear_id: stravaId,
          total_km: parseFloat(formData.get('km') as string) || 0,
          product_url: formData.get('product_url') as string || "",
          specs: {
            ...(aiResult?.specs || {}),
            telaio: (formData.get('specs_telaio') as string) || aiResult?.specs?.telaio,
            forcella: (formData.get('specs_forcella') as string) || aiResult?.specs?.forcella,
            gruppo: (formData.get('specs_gruppo') as string) || aiResult?.specs?.gruppo,
            cambio: (formData.get('specs_cambio') as string) || aiResult?.specs?.cambio,
            freni: (formData.get('specs_freni') as string) || aiResult?.specs?.freni,
            ruote: (formData.get('specs_ruote') as string) || aiResult?.specs?.ruote,
            pneumatici: (formData.get('specs_pneumatici') as string) || aiResult?.specs?.pneumatici,
            clearance_max: (formData.get('specs_clearance') as string) || aiResult?.specs?.clearance_max,
            sella: (formData.get('specs_sella') as string) || aiResult?.specs?.sella,
            peso: (formData.get('specs_peso') as string) || aiResult?.specs?.peso,
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
          strava_gear_id: stravaId,
          total_km: parseFloat(formData.get('km') as string) || 0,
          product_url: formData.get('product_url') as string || "",
          specs: {
            ...editingBike!.specs,
            telaio: formData.get('specs_telaio') as string,
            forcella: formData.get('specs_forcella') as string,
            gruppo: formData.get('specs_gruppo') as string,
            cambio: formData.get('specs_cambio') as string,
            freni: formData.get('specs_freni') as string,
            ruote: formData.get('specs_ruote') as string,
            pneumatici: formData.get('specs_pneumatici') as string,
            clearance_max: formData.get('specs_clearance') as string,
            sella: formData.get('specs_sella') as string,
            peso: formData.get('specs_peso') as string,
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
      setErrorMessage(err.message || "Errore nel salvataggio");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleStravaSync = async (bike: Bike) => {
    if (!bike.strava_gear_id) return;
    try {
      const gear = await stravaService.getGearDetails(bike.strava_gear_id);
      if (gear && gear.distance) {
        const km = Math.round(gear.distance / 1000);
        const updated = { ...bike, total_km: km };
        await supabaseService.saveBike(updated);
        fetchData();
        alert(`Sincronizzati ${km} km da Strava per ${bike.name}`);
      }
    } catch (err) {
      alert("Errore durante la sincronizzazione Strava");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white">Il Tuo Garage</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {isCloudEnabled ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Cloud Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Sync Error</span>
              </div>
            )}
            
            {isStravaConfigured && (
              stravaAthlete ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                  <i className="fa-brands fa-strava text-[10px] text-orange-500"></i>
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">{stravaAthlete.firstname} Linked</span>
                </div>
              ) : (
                <button 
                  onClick={() => window.location.href = stravaService.getAuthUrl()}
                  className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-orange-500/30 rounded-full hover:bg-orange-600 transition-colors group"
                >
                  <i className="fa-brands fa-strava text-[10px] text-orange-500 group-hover:text-white"></i>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-tighter">Link Strava</span>
                </button>
              )
            )}
          </div>
        </div>
        <button onClick={() => { setErrorMessage(null); setEditingBike(null); setCoverPhoto(null); setShowForm(true); }} className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95">
          <i className="fa-solid fa-plus"></i> AGGIUNGI BICI
        </button>
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
              onEdit={(b) => { setEditingBike(b); setCoverPhoto(b.specs?.imageUrl || null); setShowForm(true); }}
              onUpdateKm={() => {
                if (bike.strava_gear_id) {
                  handleStravaSync(bike);
                } else {
                  const newKm = prompt("Inserisci i km attuali:", bike.total_km.toString());
                  if (newKm !== null) {
                    const updated = { ...bike, total_km: parseFloat(newKm) || 0 };
                    supabaseService.saveBike(updated).then(fetchData);
                  }
                }
              }} 
              onDelete={async (b) => {
                if(confirm("Eliminare questa bici?")) {
                  await supabaseService.deleteBike(b.id);
                  fetchData();
                }
              }} 
              onRefresh={fetchData}
            />
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <div className="bg-[#0f1421] border border-slate-800 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300 my-8">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-[#13192a]">
              <h2 className="text-2xl font-black text-white">{editingBike ? 'Modifica Bici' : 'Nuova Bici'}</h2>
              <button onClick={() => setShowForm(false)} className="bg-slate-800/50 h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-700">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveBike} className="p-8 space-y-10 custom-scrollbar max-h-[75vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex gap-3">
                  <i className="fa-solid fa-triangle-exclamation mt-1"></i>
                  <p>{errorMessage}</p>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Foto Copertina</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video w-full bg-[#161c2d] border-2 border-dashed border-slate-800 rounded-3xl overflow-hidden flex flex-col items-center justify-center group cursor-pointer hover:border-blue-500/50 transition-all relative"
                  >
                    {coverPhoto ? (
                      <img src={coverPhoto} className="w-full h-full object-cover" alt="Cover Preview" />
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <i className="fa-solid fa-camera text-slate-700 group-hover:text-blue-500"></i>
                        </div>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Seleziona Immagine</p>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Modello / Nome</label>
                  <input name="query" defaultValue={editingBike?.name || ''} required className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white outline-none focus:ring-2 ring-blue-600/50 transition-all" placeholder="Es: Specialized Tarmac SL7" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Km Totali</label>
                    <input type="number" name="km" defaultValue={editingBike?.total_km || 0} className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white outline-none focus:ring-2 ring-blue-600/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Categoria</label>
                    <select name="type" defaultValue={editingBike?.type || 'MTB'} className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white outline-none focus:ring-2 ring-blue-600/50 transition-all appearance-none">
                      <option value="MTB">MTB</option>
                      <option value="Corsa">Corsa</option>
                      <option value="Gravel">Gravel</option>
                    </select>
                  </div>
                </div>

                {/* Strava Gear Mapping */}
                {stravaAthlete && stravaAthlete.bikes && stravaAthlete.bikes.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Collega a Strava</label>
                    <select name="strava_id" defaultValue={editingBike?.strava_gear_id || ''} className="w-full bg-orange-500/5 border border-orange-500/20 rounded-xl px-5 py-4 text-white outline-none focus:ring-2 ring-orange-500/50 transition-all appearance-none">
                      <option value="">-- Non collegata --</option>
                      {stravaAthlete.bikes.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name} ({Math.round(b.distance/1000)} km)</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">URL Prodotto (Opzionale)</label>
                  <input name="product_url" defaultValue={editingBike?.product_url || ''} className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white outline-none focus:ring-2 ring-blue-600/50 transition-all" placeholder="https://www.specialized.com/..." />
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Dettagli Tecnici</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'telaio', label: 'Telaio' },
                      { id: 'forcella', label: 'Forcella' },
                      { id: 'gruppo', label: 'Gruppo' },
                      { id: 'cambio', label: 'Cambio' },
                      { id: 'freni', label: 'Freni' },
                      { id: 'ruote', label: 'Ruote' },
                      { id: 'pneumatici', label: 'Pneumatici' },
                      { id: 'clearance', label: 'Passaggio Ruota Max' },
                      { id: 'sella', label: 'Sella' },
                      { id: 'peso', label: 'Peso' }
                    ].map(field => (
                      <div key={field.id}>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2 ml-1">{field.label}</label>
                        <input 
                          name={`specs_${field.id}`} 
                          defaultValue={(editingBike?.specs as any)?.[field.id === 'clearance' ? 'clearance_max' : field.id] || ''} 
                          className="w-full bg-[#161c2d]/50 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-1 ring-blue-500/30 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 sticky bottom-0 bg-[#0f1421] py-4 border-t border-slate-800/50">
                <button type="submit" disabled={isExtracting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-4 transition-all uppercase tracking-widest">
                  {isExtracting ? <><i className="fa-solid fa-spinner fa-spin"></i><span>{extractionStatus}</span></> : <><i className="fa-solid fa-check"></i><span>Salva</span></>}
                </button>
              </div>
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
