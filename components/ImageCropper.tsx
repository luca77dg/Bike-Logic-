
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number, y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const base64Image = canvas.toDataURL('image/jpeg', 0.85);
      onCropComplete(base64Image);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black items-center justify-center p-4">
      <div className="relative w-full max-w-2xl aspect-[4/3] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaComplete}
          style={{
            containerStyle: { background: '#0f172a' },
            cropAreaStyle: { border: '2px solid #3b82f6' }
          }}
        />
      </div>

      <div className="w-full max-w-2xl mt-8 space-y-6">
        <div className="flex items-center gap-6 px-4">
          <i className="fa-solid fa-magnifying-glass-minus text-slate-500"></i>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <i className="fa-solid fa-magnifying-glass-plus text-slate-500"></i>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={getCroppedImg}
            className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-scissors"></i>
            Ritaglia e Salva
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          Sposta e zooma per centrare la bici
        </p>
      </div>
    </div>
  );
};
