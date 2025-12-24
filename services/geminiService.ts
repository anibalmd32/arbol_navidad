
import { GoogleGenAI } from "@google/genai";

export const generateChristmasBlessing = async (name: string, userContext?: string): Promise<string> => {
  try {
    // Initializing GoogleGenAI inside the function call ensures the most up-to-date API key is always used
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Construct Prompt
    let prompt = `Escribe una bendición navideña emotiva para ${name}, enfocada en el amor de pareja, el cumplimiento de sueños anhelados, la reconciliación y la unidad profunda.`;

    if (userContext) {
      prompt += ` Úsalo como inspiración este mensaje personal escrito por el remitente, pero no lo copies textualmente, sino amplifica su sentimiento: "${userContext}".`;
    }

    prompt += ` Que sea un mensaje inspirador, poético y mágico, máximo 3 líneas.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Access response.text directly as a property
    return response.text || "¡Que la luz de la Navidad ilumine cada rincón de tu corazón!";
  } catch (error) {
    console.error("Error generating blessing:", error);
    return "¡Feliz Navidad! Que este día esté lleno de magia y amor.";
  }
};
