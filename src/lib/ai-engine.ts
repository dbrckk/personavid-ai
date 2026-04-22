import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateNeuralScript(prompt: string) {
  if (!process.env.GEMINI_API_KEY) throw new Error("API_KEY_MISSING");

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const systemPrompt = `
    Tu es l'agent v31.4. Analyse ce texte et réponds UNIQUEMENT avec un objet JSON valide.
    Format: {"rythme": 80, "intensite": "High", "ruptures": [10, 20]}
    Texte: ${prompt}
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();
    
    // Nettoyage de sécurité pour extraire le JSON même si Gemini ajoute du texte
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("JSON_NOT_FOUND");
  } catch (error) {
    console.error("NEURAL_ENGINE_CRASH:", error);
    // Fallback de secours pour ne pas bloquer l'UI
    return { rythme: 50, intensite: "Medium", ruptures: [] };
  }
}
