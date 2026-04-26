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
  const hooks: Record<ViralStyle, string> = {
    dominant: "Stop scrolling...",
    seductive: "Listen closely...",
    motivational: "You need to hear this...",
    mysterious: "Nobody talks about this...",
    luxury: "Here is what separates you from everyone else...",
  };

  const script = [
    hooks[style],
    "",
    "Most people think they need more motivation.",
    "",
    "They don't.",
    "",
    "They need a system that makes the right action impossible to avoid.",
    "",
    prompt,
    "",
    "Here is the truth.",
    "",
    "If your environment keeps rewarding distraction, your discipline will always feel weak.",
    "",
    "So stop trying to force yourself to become someone else.",
    "",
    "Design your day so the better version of you has fewer excuses.",
    "",
    "That is how change starts to feel automatic.",
    "",
    "Save this, because you will need it later.",
  ].join("\n");

  return {
    rythme: 88,
    intensite: "High",
    ruptures: [3, 8, 15, 23, 31],
    hook: hooks[style],
    angle: style,
    mood: `confident_${style}`,
    rewrittenPrompt: script,
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
      ? data.ruptures.filter((n: unknown) => typeof n === "number").slice(0, 8)
      : fallback.ruptures,

    hook:
      typeof data?.hook === "string"
        ? data.hook.slice(0, 140)
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
      typeof data?.rewrittenPrompt === "string" &&
      data.rewrittenPrompt.trim().length > 180
        ? data.rewrittenPrompt.slice(0, 1700)
        : fallback.rewrittenPrompt,
  };
}

export async function generateNeuralScript(
  prompt: string,
  style: ViralStyle = "dominant"
): Promise<NeuralScriptConfig> {
  const cleanPrompt = String(prompt || "").trim().slice(0, 900);

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
You are an elite TikTok script writer.

Transform the user's idea into a full English USA TikTok narration.

Voice identity:
young adult woman, realistic, confident, slightly seductive, slightly dominant.

Selected style:
${style}

Duration:
25 to 40 seconds.

Length:
90 to 135 words.

Rules:
- Reply only with valid JSON.
- No markdown.
- No explanation.
- Natural spoken English.
- Short punchy lines.
- Use line breaks for pauses.
- Strong first 2 seconds.
- Keep it intense but not cringe.
- No explicit sexual content.
- No illegal instructions.
- The narration must feel like a real TikTok voiceover.

Exact JSON:
{
  "rythme": 90,
  "intensite": "High",
  "ruptures": [3, 8, 15, 23, 31],
  "hook": "Stop scrolling...",
  "angle": "${style}",
  "mood": "confident_${style}",
  "rewrittenPrompt": "Final 25 to 40 second narration here."
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
