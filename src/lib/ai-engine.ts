import { GoogleGenerativeAI } from "@google/generative-ai";

export type ViralStyle =
  | "dominant"
  | "seductive"
  | "motivational"
  | "mysterious"
  | "luxury";

export type NeuralScriptConfig = {
  rythme: number;
  intensite: "Low" | "Medium" | "High" | "Ultra";
  ruptures: number[];
  hook: string;
  angle: string;
  mood: string;
  rewrittenPrompt: string;
};

function fallbackConfig(prompt: string, style: ViralStyle): NeuralScriptConfig {
  const styleHook: Record<ViralStyle, string> = {
    dominant: "Stop scrolling...",
    seductive: "Listen closely...",
    motivational: "You need to hear this...",
    mysterious: "Nobody talks about this...",
    luxury: "Here is what separates you from them...",
  };

  return {
    rythme: 88,
    intensite: "High",
    ruptures: [3, 7, 12],
    hook: styleHook[style],
    angle: style,
    mood: `confident_${style}`,
    rewrittenPrompt: [
      styleHook[style],
      "",
      "You think you're doing enough?",
      "",
      "You're not.",
      "",
      prompt,
      "",
      "But here's the truth...",
      "",
      "The part you ignore is the part that changes everything.",
      "",
      "Save this.",
    ].join("\n"),
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

function normalizeConfig(
  data: any,
  prompt: string,
  style: ViralStyle
): NeuralScriptConfig {
  const fallback = fallbackConfig(prompt, style);

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
        ? data.rewrittenPrompt.slice(0, 1000)
        : fallback.rewrittenPrompt,
  };
}

export async function generateNeuralScript(
  prompt: string,
  style: ViralStyle = "dominant"
): Promise<NeuralScriptConfig> {
  const cleanPrompt = String(prompt || "").trim().slice(0, 800);

  if (!cleanPrompt) {
    return fallbackConfig("", style);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackConfig(cleanPrompt, style);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(`
You are an expert TikTok script strategist.

Transform the user's raw idea into a short English USA TikTok narration.

Voice identity:
young adult woman, realistic, confident, slightly seductive, slightly dominant.

Selected style:
${style}

Rules:
- Reply only with valid JSON.
- No markdown.
- No explanation.
- 18 to 30 seconds max.
- Short lines.
- Natural pauses.
- Strong first 2 seconds.
- No cringe.
- No explicit sexual content.
- No illegal instructions.
- The final narration must be in English.

Exact JSON:
{
  "rythme": 90,
  "intensite": "High",
  "ruptures": [3, 7, 12],
  "hook": "Stop scrolling...",
  "angle": "${style}",
  "mood": "confident_${style}",
  "rewrittenPrompt": "Final narration here."
}

User idea:
${cleanPrompt}
`);

    const text = result.response.text();
    const parsed = extractJson(text);

    return normalizeConfig(parsed, cleanPrompt, style);
  } catch (error) {
    console.error("NEURAL_ENGINE_FALLBACK:", error);
    return fallbackConfig(cleanPrompt, style);
  }
  }
