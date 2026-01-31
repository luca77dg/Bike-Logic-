
import { GoogleGenAI } from "@google/genai";

const PROMPT_VISION = "Analizza questa foto di una parte meccanica di bicicletta. Descrivi lo stato di pulizia e usura. Fornisci un consiglio di manutenzione breve in italiano.";

/**
 * Funzione di utilità per pulire e parsare il JSON restituito dal modello
 */
const cleanAndParseJson = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const target = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(target);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Original text:", text);
    return null;
  }
};

export const testAiConnection = async (): Promise<{success: boolean, message: string}> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { success: false, message: "Chiave API non trovata (process.env.API_KEY è undefined)." };
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Saluta in italiano.",
    });
    return { success: true, message: `Connesso! Risposta: ${response.text}` };
  } catch (error: any) {
    return { success: false, message: `Errore API: ${error.message}` };
  }
};

export const analyzeBikePart = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Configurazione mancante.";
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: PROMPT_VISION }
        ]
      }
    });
    return response.text || "Nessun risultato.";
  } catch (error: any) {
    return `Errore: ${error.message}`;
  }
};

export const extractBikeData = async (query: string, onStatusUpdate?: (status: string) => void) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  try {
    onStatusUpdate?.("Ricerca informazioni con Google...");
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Trova i dati tecnici ufficiali per questa bici: "${query}". 
    Restituisci ESCLUSIVAMENTE un oggetto JSON con queste chiavi:
    extractedName (Nome completo), 
    extractedType (Corsa, Gravel o MTB), 
    specs (oggetto con: telaio, gruppo, freni, ruote, peso). 
    Sii preciso e usa l'italiano per le descrizioni.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }] 
      },
    });

    onStatusUpdate?.("Elaborazione specifiche...");
    const data = cleanAndParseJson(response.text || '');
    
    if (data) {
      // Estraiamo i link dalle fonti di ricerca per trasparenza
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
          uri: chunk.web?.uri || '',
          title: chunk.web?.title || 'Scheda tecnica'
        }))
        .filter((s: any) => s.uri) || [];
      
      if (data.specs) data.specs.sources = sources;
      return data;
    }
    return null;
  } catch (error) {
    console.error("Extraction error:", error);
    return null;
  }
};
