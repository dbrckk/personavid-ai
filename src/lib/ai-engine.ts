import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI ENGINE v31.4 - RAPTURE (Ultra-Compatible Version)
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateNeuralScript(prompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("CRITICAL_FAILURE: GEMINI_API_KEY_MISSING");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const systemPrompt = `
    Analyse ce texte et réponds UNIQUEMENT avec un objet JSON.
    Format: {"rythme": 80, "intensite": "High", "ruptures": [10, 20]}
    Texte: ${prompt}
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    // MÉTHODE ULTRA-COMPATIBLE : Pas de RegEx, pas de flags ES2018
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1) {
      const jsonString = text.substring(start, end + 1);
      return JSON.parse(jsonString);
    }

    throw new Error("JSON_NOT_FOUND");

  } catch (error) {
    console.error("NEURAL_ENGINE_CRASH:", error);
    
    // Fallback de sécurité
    return {
      rythme: 50,
      intensite: "Medium",
      ruptures: [5, 10],
      mood: "Safety_Protocol_Active"
    };
  }
}
