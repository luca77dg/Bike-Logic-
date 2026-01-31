
import { GoogleGenAI, Type } from "@google/genai";

const PROMPT_VISION = "Analizza questa foto di una trasmissione o freno di una bicicletta. Valuta accuratamente il livello di sporco (grasso secco, fango, residui) e l'usura visibile (denti della corona consumati, maglie della catena lucide, ossidazione). Fornisci un consiglio tecnico immediato per la manutenzione. Sii professionale e sintetico in lingua italiana.";

export const analyzeBikePart = async (base64Image: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: PROMPT_VISION }
        ]
      }
    });
    return response.text || "Impossibile analizzare l'immagine.";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Errore nella comunicazione con l'AI.";
  }
};

export const extractSpecsFromUrl = async (url: string, bikeName: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `Analizza il seguente link: ${url}. Estrai la scheda tecnica dettagliata per la bicicletta "${bikeName}". 
    Se il link non è accessibile direttamente, usa Google Search per trovare le specifiche ufficiali di questo modello. 
    Restituisci i dati in formato JSON seguendo rigorosamente questo schema:
    {
      "telaio": "descrizione",
      "forcella": "descrizione",
      "gruppo": "nome gruppo (es. Shimano Ultegra Di2)",
      "cambio": "dettaglio deragliatore",
      "freni": "tipo e modello freni",
      "ruote": "modello ruote",
      "pneumatici": "modello pneumatici",
      "sella": "modello sella",
      "peso": "peso dichiarato se disponibile"
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            telaio: { type: Type.STRING },
            forcella: { type: Type.STRING },
            gruppo: { type: Type.STRING },
            cambio: { type: Type.STRING },
            freni: { type: Type.STRING },
            ruote: { type: Type.STRING },
            pneumatici: { type: Type.STRING },
            sella: { type: Type.STRING },
            peso: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Specs Extraction error:", error);
    return null;
  }
};
