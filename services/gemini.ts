
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

export const extractSpecsFromUrl = async (url: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const prompt = `Utilizza Google Search per trovare le specifiche tecniche ufficiali della bicicletta descritta in questo link: ${url}.
    
    DEVI IDENTIFICARE:
    1. Nome commerciale esatto (es. Specialized Tarmac SL7 Comp 2023).
    2. Categoria (Corsa, Gravel o MTB).
    3. Componenti: telaio, forcella, gruppo, cambio, freni, ruote, pneumatici, sella e peso.

    Rispondi RIGOROSAMENTE in formato JSON con questo schema:
    {
      "extractedName": "Nome Bici",
      "extractedType": "Corsa | Gravel | MTB",
      "specs": {
        "telaio": "...",
        "forcella": "...",
        "gruppo": "...",
        "cambio": "...",
        "freni": "...",
        "ruote": "...",
        "pneumatici": "...",
        "sella": "...",
        "peso": "..."
      }
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
            extractedName: { type: Type.STRING },
            extractedType: { type: Type.STRING },
            specs: {
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
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    
    // Estrazione delle fonti dai groundingChunks
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Fonte Web'
      }))
      .filter((s: any) => s.uri) || [];

    if (parsed.specs) {
      parsed.specs.sources = sources;
    }

    return parsed;
  } catch (error) {
    console.error("Gemini Search/Extraction error:", error);
    return null;
  }
};
