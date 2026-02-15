
import { GoogleGenAI } from "@google/genai";

// Use gemini-3-flash-preview for multimodal vision analysis and search tasks
const VISION_MODEL = 'gemini-3-flash-preview';
const SEARCH_MODEL = 'gemini-3-flash-preview';

const VISION_PROMPT = "Analizza questa parte di bicicletta (es. catena, pignoni, pastiglie). Valuta lo stato di usura su una scala da 1 a 10 e scrivi un breve consiglio tecnico in italiano.";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === 'undefined' || key === 'null' || key.trim() === '') {
    return null;
  }
  return key;
};

export const extractBikeData = async (query: string, onStatusUpdate?: (status: string) => void) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  try {
    onStatusUpdate?.("Ricerca specifica avanzata...");
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Trova i dettagli tecnici ufficiali per la bicicletta: "${query}".
    DEVI rispondere esclusivamente con un oggetto JSON. 
    Includi modello forcella, modello pneumatici di serie, passaggio ruota (clearance) massimo e URL immagine ufficiale.

    Struttura JSON:
    {
      "extractedName": "Marca Modello Anno",
      "extractedType": "Corsa" | "Gravel" | "MTB",
      "specs": {
        "telaio": "...",
        "forcella": "...",
        "gruppo": "...",
        "freni": "...",
        "ruote": "...",
        "pneumatici": "Modello e misura di serie",
        "clearance_max": "Misura massima supportata (es. 45mm o 2.4\")",
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
    console.error("Gemini Search Error:", error);
    
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("ENTITY_NOT_FOUND");
    }
    
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    
    throw error;
  }
};

export const searchProductDeals = async (productName: string) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Trova il prezzo migliore attuale online e i negozi consigliati per il prodotto ciclistico: "${productName}". 
    Includi il prezzo medio e dove conviene acquistarlo oggi (es. Amazon, Deporvillage, Probikeshop, Mantel, Lordgun). 
    Sii sintetico e professionale in italiano.`;

    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.5,
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Vedi Offerta'
      })).filter((s: any) => s.uri) || [];

    return {
      text: response.text,
      sources
    };
  } catch (error: any) {
    console.error("Deal Search Error:", error);
    throw error;
  }
};

export const analyzeBikePart = async (base64Image: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Chiave API mancante. Per favore, collegala in alto.";
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: 'image/jpeg', 
              data: base64Image.split(',')[1] 
            } 
          },
          { text: VISION_PROMPT }
        ]
      }
    });
    return response.text || "Nessun risultato dall'analisi visiva.";
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      return "ERROR:ENTITY_NOT_FOUND";
    }
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return "ERRORE: Quota API esaurita. Riprova tra un minuto.";
    }
    return `Errore Vision: ${error.message}`;
  }
};
