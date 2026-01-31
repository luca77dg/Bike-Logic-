
import { GoogleGenAI } from "@google/genai";

const PROMPT_VISION = "Analizza questa foto di una trasmissione o freno di una bicicletta. Valuta accuratamente il livello di sporco e l'usura visibile. Fornisci un consiglio tecnico in italiano.";

export const testAiConnection = async (): Promise<{success: boolean, message: string}> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { success: false, message: "Chiave API non trovata nel sistema (process.env.API_KEY è vuoto)." };
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Rispondi solo con la parola 'OK' se mi senti.",
    });
    return { success: true, message: `Connessione riuscita! Risposta AI: ${response.text}` };
  } catch (error: any) {
    return { success: false, message: `Errore API: ${error.message}` };
  }
};

const extractJsonFromText = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

export const analyzeBikePart = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Errore: API Key non configurata.";
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
    return response.text || "Nessun responso.";
  } catch (error: any) {
    return `Errore: ${error.message}`;
  }
};

export const extractSpecsFromUrl = async (url: string, onStatusUpdate?: (status: string) => void) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  try {
    onStatusUpdate?.("Ricerca specifica...");
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Usa Google Search per trovare i dati tecnici di questa bici: ${url}. Restituisci SOLO un JSON con: extractedName, extractedType (Corsa/Gravel/MTB), specs (oggetto con telaio, gruppo, freni, ruote, peso).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    return extractJsonFromText(response.text || '');
  } catch (error) {
    return null;
  }
};
