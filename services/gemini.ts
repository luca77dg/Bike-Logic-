
import { GoogleGenAI } from "@google/genai";

const VISION_MODEL = 'gemini-2.5-flash-image';
const SEARCH_MODEL = 'gemini-3-pro-preview';

const VISION_PROMPT = "Analizza questa parte di bicicletta (es. catena, pignoni, pastiglie). Valuta lo stato di usura su una scala da 1 a 10 e scrivi un breve consiglio tecnico in italiano.";

export const extractBikeData = async (query: string, onStatusUpdate?: (status: string) => void) => {
  // Verifichiamo la chiave ad ogni chiamata come richiesto dalle linee guida
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key non trovata. Collega la chiave tramite il pulsante in alto.");
  }

  try {
    onStatusUpdate?.("Ricerca specifica avanzata...");
    // Istanza creata subito prima dell'uso
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Trova i dettagli tecnici ufficiali per la bicicletta: "${query}".
    DEVI rispondere esclusivamente con un oggetto JSON. 
    Includi modello pneumatici di serie, tire clearance massimo e URL immagine ufficiale.

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
    if (!jsonMatch) throw new Error("L'IA non ha trovato dati validi.");
    
    const data = JSON.parse(jsonMatch[0]);
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Scheda Tecnica'
      })).filter((s: any) => s.uri) || [];
    
    if (data.specs) data.specs.sources = sources;
    return data;
  } catch (error: any) {
    console.error("Gemini Search Error:", error);
    // Se l'entità non viene trovata, è un problema di configurazione della chiave
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("ENTITY_NOT_FOUND");
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
    if (error.message?.includes("Requested entity was not found")) {
      return "ERROR:ENTITY_NOT_FOUND";
    }
    return `Errore Vision: ${error.message}`;
  }
};
