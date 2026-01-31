
import { GoogleGenAI } from "@google/genai";

const PROMPT_VISION = "Analizza questa foto di una trasmissione o freno di una bicicletta. Valuta accuratamente il livello di sporco (grasso secco, fango, residui) e l'usura visibile (denti della corona consumati, maglie della catena lucide, ossidazione). Fornisci un consiglio tecnico immediato per la manutenzione. Sii professionale e sintetico in lingua italiana.";

const extractJsonFromText = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("✅ JSON estratto con successo:", parsed);
      return parsed;
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("❌ Errore parsing JSON nella risposta AI:", e);
    console.log("Contenuto grezzo che ha causato l'errore:", text);
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

export const extractSpecsFromUrl = async (url: string, onStatusUpdate?: (status: string) => void) => {
  try {
    onStatusUpdate?.("Inizializzazione AI...");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    onStatusUpdate?.("Consultando Google Search per dati tecnici...");
    console.log(`🔍 Avvio ricerca per URL: ${url}`);

    const prompt = `AZIONE: Usa lo strumento Google Search per trovare la scheda tecnica ufficiale della bici in questo link: ${url}.
    
    REGOLE MANDATORIE:
    1. NON inventare dati. Se non trovi il modello esatto, cerca il nome del modello contenuto nell'URL.
    2. Identifica: Nome esatto, Categoria (Corsa, Gravel, MTB) e componenti (telaio, forcella, gruppo, cambio, freni, ruote, pneumatici, sella, peso).
    3. Restituisci i dati SOLO in questo formato JSON:
    {
      "extractedName": "Nome Modello",
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
      },
    });

    onStatusUpdate?.("Analisi dei risultati della ricerca...");
    const textResponse = response.text || '';
    console.log("📝 Risposta testuale grezza dall'AI:", textResponse);

    const parsed = extractJsonFromText(textResponse);
    
    if (!parsed) {
      console.warn("⚠️ L'AI non ha restituito JSON valido. Risposta ricevuta:", textResponse);
      return null;
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Fonte Web'
      }))
      .filter((s: any) => s.uri) || [];

    console.log(`🔗 Fonti trovate: ${sources.length}`);

    if (parsed.specs) {
      parsed.specs.sources = sources;
    }

    onStatusUpdate?.("Completato!");
    return parsed;
  } catch (error: any) {
    console.error("🚨 Errore fatale durante l'estrazione:", error);
    onStatusUpdate?.(`Errore: ${error.message || 'Sconosciuto'}`);
    return null;
  }
};
