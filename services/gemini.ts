
import { GoogleGenAI } from "@google/genai";

const VISION_MODEL = 'gemini-2.5-flash-image';
const SEARCH_MODEL = 'gemini-3-pro-preview';

const VISION_PROMPT = "Analizza questa parte di bicicletta (es. catena, pignoni, pastiglie). Valuta lo stato di usura su una scala da 1 a 10 e scrivi un breve consiglio tecnico in italiano.";

export const testAiConnection = async (): Promise<{success: boolean, message: string}> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { success: false, message: "ERRORE: Variabile API_KEY non trovata. Controlla Vercel." };
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Test connessione. Rispondi 'OK'.",
    });
    return { success: true, message: `Connesso! Risposta: ${response.text}` };
  } catch (error: any) {
    return { success: false, message: `ERRORE API: ${error.message}` };
  }
};

export const analyzeBikePart = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Chiave mancante.";
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
    return response.text || "Nessun risultato.";
  } catch (error: any) {
    return `Errore Vision: ${error.message}`;
  }
};

export const extractBikeData = async (query: string, onStatusUpdate?: (status: string) => void) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY missing");
    return null;
  }

  try {
    onStatusUpdate?.("Ricerca specifica in corso...");
    const ai = new GoogleGenAI({ apiKey });
    
    // Prompt super-strutturato per evitare errori di parsing
    const prompt = `Trova i dettagli tecnici per la bicicletta: ${query}. 
    Rispondi esclusivamente con un oggetto JSON valido (senza markdown) che contenga:
    {
      "extractedName": "Nome Modello",
      "extractedType": "MTB" | "Corsa" | "Gravel",
      "specs": {
        "telaio": "descrizione",
        "gruppo": "descrizione",
        "freni": "descrizione",
        "ruote": "descrizione",
        "peso": "kg"
      }
    }`;

    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }] 
      },
    });

    onStatusUpdate?.("Parsing dati...");
    const rawText = response.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Risposta AI non valida");
    
    const data = JSON.parse(jsonMatch[0]);
    
    // Aggiungiamo le fonti per verifica
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Dati tecnici'
      })).filter((s: any) => s.uri) || [];
    
    if (data.specs) data.specs.sources = sources;
    return data;
  } catch (error: any) {
    console.error("Search error:", error);
    onStatusUpdate?.(`Errore: ${error.message}`);
    return null;
  }
};
