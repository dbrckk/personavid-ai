import { GoogleGenerativeAI } from "@google/generative-ai";

export type NeuralScriptConfig = {
  rythme: number;
  intensite: "Low" | "Medium" | "High" | "Ultra";
  ruptures: number[];
  hook: string;
  angle: string;
  mood: string;
  rewrittenPrompt: string;
};

function fallbackConfig(prompt: string): NeuralScriptConfig {
  return {
    rythme: 86,
    intensite: "High",
    ruptures: [3, 7, 12],
    hook: "Stop scrolling...",
    angle: "self_improvement",
    mood: "confident_seductive",
    rewrittenPrompt: prompt,
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

    hook:
      typeof data?.hook === "string"
        ? data.hook.slice(0, 120)
        : fallback.hook,

    angle:
      typeof data?.angle === "string"
        ? data.angle.slice(0, 80)
        : fallback.angle,

    mood:
      typeof data?.mood === "string"
        ? data.mood.slice(0, 80)
        : fallback.mood,

    rewrittenPrompt:
      typeof data?.rewrittenPrompt === "string"
        ? data.rewrittenPrompt.slice(0, 900)
        : fallback.rewrittenPrompt,
  };
}

export async function generateNeuralScript(
  prompt: string
): Promise<NeuralScriptConfig> {
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
You are an expert TikTok script strategist.

Goal:
Transform the user's raw idea into a short, intense, English USA TikTok narration.

Voice style:
young woman, confident, seductive, slightly dominant, direct, not cringe.

Rules:
- Reply only with valid JSON.
- No markdown.
- No explanation.
- The rewrittenPrompt must be in English.
- Short sentences.
- Strong hook.
- 18 to 30 seconds max.
- Avoid unsafe, hateful, sexual explicit or illegal content.

Exact JSON format:
{
  "rythme": 86,
  "intensite": "High",
  "ruptures": [3, 7, 12],
  "hook": "Stop scrolling...",
  "angle": "self_improvement",
  "mood": "confident_seductive",
  "rewrittenPrompt": "Your final TikTok narration text here."
}

User idea:
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
