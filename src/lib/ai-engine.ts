import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI ENGINE v31.4 - RAPTURE
 * Responsable de la transformation du texte brut en instructions de montage.
 */

// Initialisation avec la clé API sécurisée (Server-side uniquement)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateNeuralScript(prompt: string) {
  // 1. Vérification de la présence de la clé
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("CRITICAL_FAILURE: GEMINI_API_KEY_MISSING");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // 2. Prompt système strict pour forcer un format JSON pur
  const systemPrompt = `
    Tu es l'agent cognitif de l'interface RAPTURE v31.4.
    Ta mission est d'analyser le script fourni et de générer des métadonnées de montage vidéo.
    
    RÈGLES STRICTES :
    - Réponds UNIQUEMENT avec un objet JSON valide.
    - Pas de texte avant, pas de texte après.
    
    FORMAT ATTENDU :
    {
      "rythme": number (0-100),
      "intensite": "Low" | "Medium" | "High",
      "ruptures": number[] (timestamps en secondes),
      "mood": string
    }

    SCRIPT À ANALYSER :
    ${prompt}
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    /**
     * CORRECTION DE COMPATIBILITÉ (Fix Build 12:44)
     * On utilise [^] au lieu du flag /s pour capturer le JSON sur plusieurs lignes
     * de manière compatible avec les anciennes cibles ES (ECMAScript).
     */
    const jsonMatch = text.match(/\{[^]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("JSON_PARSING_FAILED");

  } catch (error) {
    // 3. Fallback de sécurité (Mode dégradé)
    // Permet à l'application de ne pas crasher si l'IA est indisponible
    console.error("NEURAL_ENGINE_CRASH:", error);
    
    return {
      rythme: 50,
      intensite: "Medium",
      ruptures: [5, 10],
      mood: "Neutral/Safety_Protocol"
    };
  }
}
