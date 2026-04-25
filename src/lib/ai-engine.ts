import { GoogleGenerativeAI } from "@google/generative-ai";

export type NeuralScriptConfig = {
  rythme: number;
  intensite: "Low" | "Medium" | "High" | "Ultra";
  ruptures: number[];
  hook: string;
  angle: string;
  mood: string;
};

function fallbackConfig(prompt: string): NeuralScriptConfig {
  const clean = prompt.toLowerCase();

  let angle = "cinematic_lifestyle";
  let mood = "confident";

  if (clean.includes("money") || clean.includes("argent") || clean.includes("business")) {
    angle = "money_growth";
    mood = "ambitious";
  }

  if (clean.includes("fitness") || clean.includes("sport") || clean.includes("muscle")) {
    angle = "discipline_body";
    mood = "intense";
  }

  if (clean.includes("ai") || clean.includes("ia") || clean.includes("tech")) {
    angle = "future_technology";
    mood = "futuristic";
  }

  if (clean.includes("motivation") || clean.includes("discipline")) {
    angle = "self_improvement";
    mood = "powerful";
  }

  return {
    rythme: 82,
    intensite: "High",
    ruptures: [4, 9, 14],
    hook: "Stop scrolling.",
    angle,
    mood,
  };
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON_NOT_FOUND");
  }

  return JSON.parse(text.slice(start, end + 1));
}

function normalizeConfig(data: any, prompt: string): NeuralScriptConfig {
  const fallback = fallbackConfig(prompt);

  return {
    rythme:
      typeof data?.rythme === "number"
        ? Math.min(100, Math.max(30, data.rythme))
        : fallback.rythme,

    intensite:
      data?.intensite === "Low" ||
      data?.intensite === "Medium" ||
      data?.intensite === "High" ||
      data?.intensite === "Ultra"
        ? data.intensite
        : fallback.intensite,

    ruptures: Array.isArray(data?.ruptures)
      ? data.ruptures
          .filter((n: unknown) => typeof n === "number")
          .slice(0, 5)
      : fallback.ruptures,

    hook: typeof data?.hook === "string" ? data.hook.slice(0, 120) : fallback.hook,

    angle:
      typeof data?.angle === "string"
        ? data.angle.slice(0, 80)
        : fallback.angle,

    mood:
      typeof data?.mood === "string"
        ? data.mood.slice(0, 80)
        : fallback.mood,
  };
}

export async function generateNeuralScript(prompt: string): Promise<NeuralScriptConfig> {
  const cleanPrompt = String(prompt || "").trim().slice(0, 800);

  if (!cleanPrompt) {
    return fallbackConfig("");
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackConfig(cleanPrompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(`
Tu es un expert en vidéos TikTok courtes, rétention, rythme et storytelling.

Réponds UNIQUEMENT avec un objet JSON valide.

Format exact :
{
  "rythme": 85,
  "intensite": "High",
  "ruptures": [4, 9, 14],
  "hook": "Stop scrolling.",
  "angle": "self_improvement",
  "mood": "cinematic"
}

Prompt utilisateur :
${cleanPrompt}
`);

    const text = result.response.text();
    const parsed = extractJson(text);

    return normalizeConfig(parsed, cleanPrompt);
  } catch (error) {
    console.error("NEURAL_ENGINE_FALLBACK:", error);
    return fallbackConfig(cleanPrompt);
  }
  }
