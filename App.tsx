
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout.tsx';
import { BikeCard } from './components/BikeCard.tsx';
import { AIVision } from './components/AIVision.tsx';
import { ImageCropper } from './components/ImageCropper.tsx';
import { supabaseService } from './services/supabase.ts';
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
  
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkKey = useCallback(async () => {
    const envKey = process.env.API_KEY;
    const isEnvKeyValid = envKey && envKey !== 'undefined' && envKey !== 'null' && envKey.trim() !== '';
    
    // @ts-ignore
    if (window.aistudio?.hasSelectedApiKey) {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected || isEnvKeyValid);
    } else {
      setHasApiKey(isEnvKeyValid);
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
    const interval = setInterval(checkKey, 2000);
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

  const handleCropComplete = (croppedImage: string) => {
    setCoverPhoto(croppedImage);
    setImageToCrop(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveBike = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const query = (formData.get('query') as string).trim();
    if (!query) return;

    const isNew = !editingBike;
    
    const bikeSpecs: BikeSpecs = {
      telaio: formData.get('specs_telaio') as string,
      forcella: formData.get('specs_forcella') as string,
      gruppo: formData.get('specs_gruppo') as string,
      freni: formData.get('specs_freni') as string,
      ruote: formData.get('specs_ruote') as string,
      pneumatici: formData.get('specs_pneumatici') as string,
      clearance_max: formData.get('specs_clearance') as string,
      peso: formData.get('specs_peso') as string,
      imageUrl: coverPhoto || null,
      photos: editingBike?.specs?.photos || [] 
    };

    if (isNew) {
      setIsExtracting(true);
      setExtractionStatus("Interrogazione AI...");
      try {
        let aiResult = null;
        try {
          aiResult = await extractBikeData(query, setExtractionStatus);
        } catch (err: any) {
          if (err.message === "API_KEY_MISSING" || err.message === "ENTITY_NOT_FOUND") {
            handleError(err);
            return;
          }
          console.warn("AI extraction failed, proceeding with manual entry", err);
        }
        
        const newBike: Bike = {
          id: crypto.randomUUID(),
          user_id: 'user',
          name: aiResult?.extractedName || query,
          type: (aiResult?.extractedType as BikeType) || (formData.get('type') as BikeType),
          strava_gear_id: null,
          total_km: parseFloat(formData.get('km') as string) || 0,
          product_url: formData.get('product_url') as string || "",
          specs: {
            ...(aiResult?.specs || {}),
            imageUrl: coverPhoto || aiResult?.specs?.imageUrl || null,
            photos: [] 
          }
        };
        await supabaseService.saveBike(newBike);
        setShowForm(false);
      } catch (err: any) {
         handleError(err);
      } finally {
        setIsExtracting(false);
      }
    } else {
      const updatedBike: Bike = {
        ...editingBike!,
        name: query,
        type: formData.get('type') as BikeType,
        total_km: parseFloat(formData.get('km') as string) || 0,
        product_url: formData.get('product_url') as string || "",
        specs: {
          ...editingBike!.specs,
          ...bikeSpecs
        }
      };
      await supabaseService.saveBike(updatedBike);
      setShowForm(false);
    }
    
    setCoverPhoto(null);
    setEditingBike(null);
    fetchData();
  };

  const handleError = (err: any) => {
    if (err.message === "ENTITY_NOT_FOUND" || err.message === "API_KEY_MISSING") {
      setHasApiKey(false);
      setErrorMessage("La chiave API è mancante o non valida.");
      handleOpenKeySelector();
    } else if (err.message === "QUOTA_EXCEEDED") {
      setErrorMessage("Limite di richieste raggiunto (Quota Esaurita).");
    } else {
      setErrorMessage(err.message || "Errore durante il salvataggio.");
    }
  };

  const openAddForm = () => {
    setErrorMessage(null);
    setEditingBike(null);
    setCoverPhoto(null);
    setShowForm(true);
  };

  const openEditForm = (bike: Bike) => {
    setErrorMessage(null);
    setEditingBike(bike);
    setCoverPhoto(bike.specs?.imageUrl || null);
    setShowForm(true);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-white">Il Tuo Garage</h2>
          {!hasApiKey ? (
            <button onClick={handleOpenKeySelector} className="flex items-center gap-2 mt-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full w-fit hover:bg-red-500/20 transition-all group">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter group-hover:underline">AI non connessa</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
              <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">AI Online</span>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <button onClick={openAddForm} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all">
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
              onEdit={openEditForm}
              onUpdateKm={() => {
                const newKm = prompt("Inserisci i km attuali:", bike.total_km.toString());
                if (newKm !== null) {
                  const updated = { ...bike, total_km: parseFloat(newKm) || 0 };
                  supabaseService.saveBike(updated).then(fetchData);
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
                <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em]">Informazioni Base</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Modello / Nome</label>
                    <input 
                      name="query" 
                      defaultValue={editingBike?.name || ''} 
                      required 
                      className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white outline-none focus:ring-2 ring-blue-600/50 transition-all placeholder:text-slate-600" 
                      placeholder="Es: Trek X-Caliber 8 2023" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Km Totali</label>
                      <input 
                        type="number" 
                        name="km" 
                        defaultValue={editingBike?.total_km || 0} 
                        className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white outline-none focus:ring-2 ring-blue-600/50 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Categoria</label>
                      <select 
                        name="type" 
                        defaultValue={editingBike?.type || 'MTB'} 
                        className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-4 text-white outline-none focus:ring-2 ring-blue-600/50 transition-all appearance-none"
                      >
                        <option value="MTB">MTB</option>
                        <option value="Corsa">Corsa</option>
                        <option value="Gravel">Gravel</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em]">Foto Copertina</h3>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video w-full bg-[#161c2d] rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-600/50 transition-all group"
                >
                  {coverPhoto ? (
                    <div className="relative w-full h-full">
                      <img src={coverPhoto} className="w-full h-full object-cover" alt="Cover Preview" />
                      {/* Overlay camera più visibile su iPhone */}
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 mb-2">
                           <i className="fa-solid fa-camera text-xl text-white"></i>
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-black/40 px-3 py-1 rounded-full">Cambia Foto</span>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Principale</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center group-hover:scale-105 transition-transform">
                      <div className="w-14 h-14 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                        <i className="fa-solid fa-camera text-xl text-slate-500 group-hover:text-white"></i>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Aggiungi Foto</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                  accept="image/*" 
                  capture="environment"
                />
                <p className="text-[9px] text-slate-500 italic font-bold text-center">L'album completo potrà essere gestito dalla card della bici dopo il salvataggio.</p>
              </div>

              <div className="space-y-6">
                <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em]">Dettagli Tecnici</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'telaio', label: 'Telaio' },
                    { id: 'forcella', label: 'Forcella' },
                    { id: 'gruppo', label: 'Gruppo' },
                    { id: 'freni', label: 'Freni' },
                    { id: 'ruote', label: 'Ruote' },
                    { id: 'pneumatici', label: 'Pneumatici' },
                    { id: 'clearance', label: 'Passaggio Ruota Max' },
                    { id: 'peso', label: 'Peso' },
                  ].map(spec => (
                    <div key={spec.id}>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{spec.label}</label>
                      <input 
                        name={`specs_${spec.id}`} 
                        defaultValue={(editingBike?.specs as any)?.[spec.id === 'clearance' ? 'clearance_max' : spec.id] || ''} 
                        className="w-full bg-[#161c2d] border border-slate-800 rounded-xl px-5 py-3 text-white text-sm outline-none focus:ring-2 ring-blue-600/50 transition-all" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 sticky bottom-0 bg-[#0f1421] py-4 border-t border-slate-800/50">
                <button type="submit" disabled={isExtracting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center justify-center gap-4 transition-all text-base uppercase tracking-[0.1em]">
                  {isExtracting ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i><span>{extractionStatus}</span></>
                  ) : (
                    <><i className="fa-solid fa-check"></i><span>{editingBike ? 'Salva Modifiche' : 'Crea Bici'}</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {imageToCrop && (
        <ImageCropper image={imageToCrop} onCropComplete={handleCropComplete} onCancel={() => setImageToCrop(null)} />
      )}

      {activeAnalysis && (
        <AIVision bike={activeAnalysis} records={maintenance[activeAnalysis.id] || []} onUpdate={fetchData} onClose={() => setActiveAnalysis(null)} />
      )}
    </Layout>
  );
};

export default App;
