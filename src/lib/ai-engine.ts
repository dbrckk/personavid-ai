import { GoogleGenerativeAI } from "@google/generative-ai";

// On utilise la clé sans le préfixe PUBLIC pour la sécurité côté serveur
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateNeuralScript(prompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Clé API manquante dans les variables d'environnement.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const systemPrompt = `
    Tu es l'agent central de la v31.4 RAPTURE. 
    Analyse le texte suivant et génère un JSON de configuration de montage :
    1. Rythme (0-100)
    2. Intensité des ondes (Low, Medium, High)
    3. Points de rupture (timestamp en secondes)
    
    Texte à analyser : ${prompt}
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    // On nettoie la réponse pour n'avoir que le JSON
    return JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch (error) {
    console.error("Erreur AI Engine:", error);
    return { rythme: 50, intensite: "Medium", ruptures: [5, 10] }; // Fallback
  }
}
