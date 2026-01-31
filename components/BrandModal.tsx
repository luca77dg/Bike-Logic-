
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface BrandModalProps {
  onClose: () => void;
}

export const BrandModal: React.FC<BrandModalProps> = ({ onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateIcon = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("Chiave API mancante");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: "A sleek, professional, minimalist app icon for a cycling maintenance app called 'BikeLogic AI'. Modern flat design, featuring a stylized bicycle chain link combined with a glowing circuit/brain symbol. Colors: deep navy blue, slate, and vibrant electric blue accents. Dark professional background. High contrast, symmetrical, centered composition. No text, just the icon symbol.",
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          setGeneratedIcon(`data:image/png;base64,${base64Data}`);
          break;
        }
      }
    } catch (err: any) {
      setError(err.message || "Errore nella generazione");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadIcon = () => {
    if (!generatedIcon) return;
    const link = document.createElement('a');
    link.href = generatedIcon;
    link.download = 'bikelogic-ai-strava-icon.png';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
      <div className="bg-[#0f1421] border border-slate-800 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-[#13192a]">
          <div>
            <h2 className="text-2xl font-black text-white">Brand Assets</h2>
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Generatore Icona Strava</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-10 space-y-8 flex flex-col items-center">
          <div className="w-48 h-48 bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden relative group">
            {generatedIcon ? (
              <img src={generatedIcon} className="w-full h-full object-cover" alt="Generated App Icon" />
            ) : isGenerating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-blue-400 uppercase animate-pulse">Creazione...</p>
              </div>
            ) : (
              <i className="fa-solid fa-palette text-4xl text-slate-800"></i>
            )}
          </div>

          <div className="text-center space-y-4">
            <p className="text-slate-400 text-sm font-medium px-4">
              Genera un'icona professionale per la tua applicazione Strava utilizzando l'intelligenza artificiale visiva di Gemini.
            </p>
            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
          </div>

          <div className="w-full grid grid-cols-1 gap-4">
            {!generatedIcon ? (
              <button 
                onClick={generateIcon}
                disabled={isGenerating}
