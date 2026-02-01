
import React, { useState, useRef } from 'react';
import { Bike } from '../types.ts';
import { supabaseService } from '../services/supabase.ts';

interface BikeAlbumModalProps {
  bike: Bike;
  onUpdate: () => void;
  onClose: () => void;
}

export const BikeAlbumModal: React.FC<BikeAlbumModalProps> = ({ bike, onUpdate, onClose }) => {
  const [activePhoto, setActivePhoto] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const photos = bike.specs?.photos || [];

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const updatedBike: Bike = {
          ...bike,
          specs: {
            ...bike.specs,
            photos: [...(bike.specs?.photos || []), base64]
          }
        };
        await supabaseService.saveBike(updatedBike);
        onUpdate();
        setActivePhoto((bike.specs?.photos?.length || 0));
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = async (index: number) => {
    if (!confirm("Vuoi eliminare questa foto dall'album?")) return;
    
    const newPhotos = photos.filter((_, i) => i !== index);
    const updatedBike: Bike = {
      ...bike,
      specs: {
        ...bike.specs,
        photos: newPhotos
      }
    };
    await supabaseService.saveBike(updatedBike);
    onUpdate();
    setActivePhoto(Math.max(0, index - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-[#0f1421] border border-slate-800 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
        
        {/* Header pulito senza pulsanti fotografici */}
        <div className="p-6 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-[#13192a] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center border border-purple-600/30">
              <i className="fa-solid fa-images text-purple-500 text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-none mb-1">Album Foto</h2>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{bike.name}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="bg-slate-800/50 h-12 w-12 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-10">
          <div className="flex-1 relative group bg-black/40 rounded-[2.5rem] overflow-hidden border border-slate-800 flex items-center justify-center min-h-[300px] shadow-inner">
            {photos.length > 0 ? (
              <>
                <img 
                  src={photos[activePhoto]} 
                  className="max-w-full max-h-full object-contain transition-all duration-700 ease-out" 
                  alt={`Bike Photo ${activePhoto + 1}`} 
                />
                
                <button 
                  onClick={() => removePhoto(activePhoto)}
                  className="absolute top-6 right-6 h-12 w-12 bg-red-600/90 backdrop-blur-md text-white rounded-full flex items-center justify-center sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-xl"
                >
                  <i className="fa-solid fa-trash-can text-base"></i>
                </button>

                {photos.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActivePhoto(prev => (prev > 0 ? prev - 1 : photos.length - 1))}
                      className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-black/60 backdrop-blur-md rounded-full text-white flex items-center justify-center sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 shadow-2xl border border-white/10"
                    >
                      <i className="fa-solid fa-chevron-left text-lg"></i>
                    </button>
                    <button 
                      onClick={() => setActivePhoto(prev => (prev < photos.length - 1 ? prev + 1 : 0))}
                      className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-black/60 backdrop-blur-md rounded-full text-white flex items-center justify-center sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 shadow-2xl border border-white/10"
                    >
                      <i className="fa-solid fa-chevron-right text-lg"></i>
                    </button>
                  </>
                )}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-10 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full text-[11px] font-black text-white/90 uppercase tracking-[0.2em] border border-white/10">
                  {activePhoto + 1} / {photos.length}
                </div>
              </>
            ) : (
              <div className="text-center p-12">
                <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-slate-800 flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <i className="fa-solid fa-images text-4xl text-slate-700"></i>
                </div>
                <h3 className="text-white font-black text-lg uppercase tracking-widest mb-3">Album ancora vuoto</h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                  Trascina qui i tuoi scatti o usa <br/> il tasto sotto per iniziare.
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-8 bg-purple-600 hover:bg-purple-500 text-white font-black px-10 py-5 rounded-2xl flex items-center gap-3 mx-auto transition-all shadow-xl shadow-purple-900/40 uppercase tracking-widest text-xs active:scale-95"
                >
                  <i className="fa-solid fa-camera"></i>
                  Aggiungi o Scatta
                </button>
              </div>
            )}
            
            {isUploading && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-10">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6"></div>
                <p className="text-white font-black text-xs uppercase tracking-[0.4em] animate-pulse">Salvataggio...</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-8 overflow-x-auto pb-4 scrollbar-hide px-2 items-center min-h-[100px]">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-28 sm:w-32 aspect-video bg-[#1e2538] rounded-2xl border-2 border-dashed border-purple-500/30 flex flex-col items-center justify-center hover:border-purple-500/60 hover:bg-purple-600/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center mb-1 group-hover:bg-purple-600 transition-all">
                <i className="fa-solid fa-plus text-purple-400 group-hover:text-white text-xs"></i>
              </div>
              <span className="text-[8px] font-black uppercase text-purple-400 tracking-widest">Aggiungi</span>
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAddPhoto} 
              className="hidden" 
              accept="image/*"
            />

            {photos.map((photo, idx) => (
              <button 
                key={idx}
                onClick={() => setActivePhoto(idx)}
                className={`shrink-0 w-28 sm:w-32 aspect-video rounded-2xl overflow-hidden border-2 transition-all ${activePhoto === idx ? 'border-purple-500 scale-105 shadow-xl shadow-purple-500/30' : 'border-slate-800 opacity-40 hover:opacity-100'}`}
              >
                <img src={photo} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
