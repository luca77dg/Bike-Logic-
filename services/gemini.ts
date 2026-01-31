
import { GoogleGenAI } from "@google/genai";

const PROMPT = "Analizza questa foto di una trasmissione o freno di una bicicletta. Valuta accuratamente il livello di sporco (grasso secco, fango, residui) e l'usura visibile (denti della corona consumati, maglie della catena lucide, ossidazione). Fornisci un consiglio tecnico immediato per la manutenzione. Sii professionale e sintetico in lingua italiana.";

export const analyzeBikePart = async (base64Image: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Using gemini-3-flash-preview for speed and efficiency in vision tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: PROMPT }
        ]
      }
    });

    return response.text || "Impossibile analizzare l'immagine al momento.";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Errore nella comunicazione con l'AI. Riprova più tardi.";
  }
};
