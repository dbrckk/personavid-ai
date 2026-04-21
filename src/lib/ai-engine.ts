import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY!);

export async function generateScript(subject: string, persona: string, duration: number) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Agis comme une femme avec une personnalité ${persona}. 
    Sujet : ${subject}. 
    Durée cible : ${duration} secondes.
    Instructions cruciales : 
    1. Écris un monologue à la première personne.
    2. Incorpore des hésitations, des soupirs et des pauses naturelles en utilisant "..." ou des sauts de ligne.
    3. Le ton doit être ultra-réaliste. 
    4. Ne génère QUE le texte parlé, sans commentaires.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
    }
