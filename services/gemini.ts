import { GoogleGenAI } from "@google/genai";

const VISION_MODEL = 'gemini-2.5-flash-image';
const SEARCH_MODEL = 'gemini-3-pro-preview';

const VISION_PROMPT = "Analizza questa parte di bicicletta (es. catena, pignoni, pastiglie). Valuta lo stato di usura su una scala da 1 a 10 e scrivi un breve consiglio tecnico in italiano.";

// Updated to use process.env.API_KEY directly and ensure correct SDK usage
export const testAiConnection = async (): Promise<{success: boolean, message: string}> => {
  if (!process.env.API_KEY) return { success: false, message: "ERRORE: Variabile API_KEY non trovata." };
  
  try {
    // Initializing directly with the environment variable as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Test connessione. Rispondi 'OK'.",
    });
    // Accessing .text as a property
    return { success: true, message: `Connesso! Risposta: ${response.text}` };
  } catch (error: any) {
    return { success: false, message: `ERRORE API: ${error.message}` };
  }
};

// Updated to use process.env.API_KEY directly
export const analyzeBikePart = async (base64Image: string): Promise<string> => {
  if (!process.env.API_KEY) return "Chiave API mancante.";
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: VISION_PROMPT }
        ]
      }
    });
    // Accessing .text as a property
    return response.text || "Nessun risultato dall'analisi visiva.";
  } catch (error: any) {
    return `Errore Vision: ${error.message}`;
  }
};

// Updated to use process.env.API_KEY directly and follow SDK rules
export const extractBikeData = async (query: string, onStatusUpdate?: (status: string) => void) => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY non configurata correttamente nel sistema.");
  }

  try {
    onStatusUpdate?.("Interrogando Google Search...");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Sei un database esperto di biciclette. Cerca online le specifiche tecniche ufficiali per: "${query}".
    
    DEVI rispondere esclusivamente con un oggetto JSON puro. NON aggiungere spiegazioni, NON aggiungere testo prima o dopo.
    
    Struttura richiesta:
    {
      "extractedName": "Marca e Modello Completo (es. Specialized S-Works Tarmac SL8 2024)",
      "extractedType": "Corsa", "Gravel" o "MTB",
      "specs": {
        "telaio": "Materiale e dettagli del telaio",
        "gruppo": "Modello del cambio e trasmissione",
        "freni": "Tipo e modello dei freni",
        "ruote": "Marca e modello ruote",
        "peso": "Peso approssimativo in kg"
      }
    }
    
    Se non trovi dati precisi, prova a dedurli dai modelli simili di quell'anno.`;

    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    onStatusUpdate?.("Analisi risultati tecnici...");
    // Accessing .text as a property
    const rawText = response.text || '';
    
    console.log("BikeLogic Debug - Raw AI Response:", rawText);

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("BikeLogic Error - No JSON found in response");
      throw new Error("L'intelligenza artificiale non ha restituito un formato dati valido.");
    }
    
    let data;
    try {
      data = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("BikeLogic Error - JSON Parse Fail:", jsonMatch[0]);
      throw new Error("Errore durante la lettura dei dati tecnici forniti dall'IA.");
    }
    
    // Extracting citations for sources
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        web: chunk.web ? {
          uri: chunk.web.uri || '',
          title: chunk.web.title || 'Scheda Tecnica Ufficiale'
        } : null
      }))
      .filter((chunk: any) => chunk?.web?.uri)
      .map((chunk: any) => chunk.web) || [];
    
    if (data.specs) data.specs.sources = sources;
    
    onStatusUpdate?.("Dati pronti!");
    return data;
  } catch (error: any) {
    console.error("Search error:", error);
    throw error;
  }
};