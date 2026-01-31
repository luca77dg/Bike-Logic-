
import { GoogleGenAI } from "@google/genai";

const VISION_MODEL = 'gemini-2.5-flash-image';
const SEARCH_MODEL = 'gemini-3-pro-preview';

const VISION_PROMPT = "Analizza questa parte di bicicletta (es. catena, pignoni, pastiglie). Valuta lo stato di usura su una scala da 1 a 10 e scrivi un breve consiglio tecnico in italiano.";

export const extractBikeData = async (query: string, onStatusUpdate?: (status: string) => void) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key non trovata. Per favore clicca su 'Collega API' in alto.");
  }

  try {
    onStatusUpdate?.("Ricerca specifica avanzata...");
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Trova i dettagli tecnici ufficiali per la bicicletta: "${query}".
    
    DEVI rispondere esclusivamente con un oggetto JSON. 
    Cerca con estrema attenzione:
    1. Il modello di pneumatici di serie montati dal produttore.
    2. Il "tire clearance" (passaggio ruota) massimo supportato dal telaio (es. "fino a 700x45c" o "fino a 2.4 pollici").
    3. Un URL di un'immagine ufficiale (JPG/PNG) del modello se disponibile nei risultati di ricerca.

    Struttura JSON:
    {
      "extractedName": "Marca Modello Anno",
      "extractedType": "Corsa" | "Gravel" | "MTB",
      "specs": {
        "telaio": "...",
        "gruppo": "...",
        "freni": "...",
        "ruote": "...",
        "pneumatici": "Modello e misura di serie",
        "clearance_max": "Misura massima supportata",
        "peso": "...",
        "imageUrl": "URL immagine trovata"
      }
    }`;

    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    onStatusUpdate?.("Elaborazione dati tecnici...");
    const rawText = response.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("L'IA non ha trovato dati validi per questo modello.");
    
    const data = JSON.parse(jsonMatch[0]);
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Scheda Tecnica'
      })).filter((s: any) => s.uri) || [];
    
    if (data.specs) data.specs.sources = sources;
    return data;
  } catch (error: any) {
    if (error.message?.includes("entity was not found")) {
      throw new Error("Errore progetto: La chiave API non è collegata a un progetto con fatturazione attiva o Google Search abilitato.");
    }
    throw error;
  }
};

export const analyzeBikePart = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Chiave API mancante.";
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: VISION_PROMPT }
        ]
      }
    });
    return response.text || "Nessun risultato dall'analisi visiva.";
  } catch (error: any) {
    return `Errore Vision: ${error.message}`;
  }
};
