
import { GoogleGenAI } from "@google/genai";

const PROMPT_VISION = "Analizza questa foto di una trasmissione o freno di una bicicletta. Valuta accuratamente il livello di sporco (grasso secco, fango, residui) e l'usura visibile (denti della corona consumati, maglie della catena lucide, ossidazione). Fornisci un consiglio tecnico immediato per la manutenzione. Sii professionale e sintetico in lingua italiana.";

/**
 * Funzione helper per estrarre un oggetto JSON da una stringa che potrebbe contenere testo extra
 */
const extractJsonFromText = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON from AI response", e);
    return null;
  }
};

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
    
    // Prompt più aggressivo per forzare l'uso di Google Search
    const prompt = `Esegui una ricerca approfondita sul web per trovare le specifiche tecniche della bicicletta indicata in questo link: ${url}.
    
    Se il link non è direttamente accessibile, usa il nome del modello che trovi nell'URL per cercare la scheda tecnica ufficiale su siti come 99spokes, BikeRadar o il sito del produttore.
    
    DEVI IDENTIFICARE:
    1. Nome commerciale esatto.
    2. Categoria (Corsa, Gravel o MTB).
    3. Specifiche: telaio, forcella, gruppo, cambio, freni, ruote, pneumatici, sella e peso.

    RISPONDI ESCLUSIVAMENTE con un blocco JSON valido con questa struttura:
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
        // Non forziamo responseMimeType qui perché il grounding di Search potrebbe iniettare citazioni nel testo
        // che rompono la validità del JSON se non gestite dal modello perfettamente.
      },
    });

    const textResponse = response.text || '';
    const parsed = extractJsonFromText(textResponse);
    
    if (!parsed) {
      throw new Error("AI non ha restituito un formato dati valido.");
    }

    // Estrazione delle fonti dai groundingChunks (Fondamentale per il grounding)
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
