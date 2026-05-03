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

const styleHints: Record<ViralStyle, string[]> = {
  dominant: [
    "commanding, sharp, controlled",
    "confident, direct, no hesitation",
    "powerful, calm, authority-driven",
  ],
  seductive: [
    "smooth, magnetic, softly dominant",
    "confident, intimate, elegant",
    "slow tension, persuasive, feminine",
  ],
  motivational: [
    "energetic, clear, inspiring",
    "discipline-focused, intense, practical",
    "fast hook, strong payoff, action-oriented",
  ],
  mysterious: [
    "dark, cinematic, secretive",
    "quiet tension, curiosity-driven",
    "psychological, intriguing, atmospheric",
  ],
  luxury: [
    "premium, status-driven, elegant",
    "high-value, aspirational, polished",
    "exclusive, calm, expensive energy",
  ],
};

const hookBank = [
  "Stop scrolling.",
  "Listen closely.",
  "Most people will ignore this.",
  "This is where everything changes.",
  "You are not behind. You are distracted.",
  "The truth is uncomfortable.",
  "Nobody tells you this part.",
  "Here is the pattern nobody notices.",
  "If you understand this, you move differently.",
  "This is why they keep winning.",
];

const structureBank = [
  "hook → false belief → truth → practical shift → final punch",
  "hook → emotional tension → hidden mistake → correction → save line",
  "hook → direct challenge → example → reframe → powerful ending",
  "hook → contrast poor vs high-value behavior → lesson → final command",
  "hook → secret → consequence → solution → memorable closing",
];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function fallbackConfig(prompt: string, style: ViralStyle): NeuralScriptConfig {
  const hook = randomItem(hookBank);

  const scripts = [
    `${hook}

Most people think the problem is motivation.

It is not.

The real problem is that their environment keeps rewarding the weakest version of them.

${prompt}

If everything around you makes distraction easy, discipline will always feel impossible.

So stop waiting to feel ready.

Remove one excuse. Build one rule. Repeat it until your identity has no choice but to change.

Save this before you forget it.`,

    `${hook}

You do not need a perfect plan.

You need one action that you can repeat when your emotions are lying to you.

${prompt}

That is the difference between people who dream and people who become dangerous.

They do not negotiate with every mood.

They build systems that move even when motivation disappears.

Start there. Quietly. Consistently. Then let results speak.`,

    `${hook}

Here is the mistake almost everyone makes.

They try to become confident before they act.

But confidence is not the beginning.

It is the receipt.

${prompt}

You earn it after showing up when it was uncomfortable.

So take the step before you feel ready.

That is where your new identity starts.`,
  ];

  return {
    rythme: 88,
    intensite: "High",
    ruptures: [3, 8, 15, 23, 31],
    hook,
    angle: style,
    mood: randomItem(styleHints[style]),
    rewrittenPrompt: randomItem(scripts),
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

function normalizeConfig(data: any, prompt: string, style: ViralStyle): NeuralScriptConfig {
  const fallback = fallbackConfig(prompt, style);

  return {
    rythme:
      typeof data?.rythme === "number"
        ? Math.min(100, Math.max(50, data.rythme))
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
      typeof data?.hook === "string" && data.hook.trim()
        ? data.hook.slice(0, 140)
        : fallback.hook,

    angle:
      typeof data?.angle === "string" && data.angle.trim()
        ? data.angle.slice(0, 100)
        : fallback.angle,

    mood:
      typeof data?.mood === "string" && data.mood.trim()
        ? data.mood.slice(0, 120)
        : fallback.mood,

    rewrittenPrompt:
      typeof data?.rewrittenPrompt === "string" &&
      data.rewrittenPrompt.trim().split(/\s+/).length >= 75
        ? data.rewrittenPrompt.trim().slice(0, 1700)
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

  const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const hook = randomItem(hookBank);
  const structure = randomItem(structureBank);
  const styleHint = randomItem(styleHints[style]);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 1.15,
        topP: 0.95,
        topK: 40,
      },
    });

    const result = await model.generateContent(`
You are an elite TikTok short-form scriptwriter.

Create a NEW and UNIQUE English USA TikTok voiceover from the user idea.

Random seed:
${seed}

Style:
${style}

Style energy:
${styleHint}

Structure to use:
${structure}

Duration:
25 to 40 seconds.

Length:
90 to 135 words.

Voice:
young adult woman, ultra realistic, confident, slightly seductive, slightly dominant.

Rules:
- Reply only valid JSON.
- No markdown.
- No explanation.
- Do not reuse generic wording.
- Do not start every script the same way.
- Use short spoken lines.
- Add natural pauses with line breaks.
- Make the first 2 seconds strong.
- Avoid cringe.
- Avoid explicit sexual content.
- Make it sound like a real viral TikTok narration.
- Differentiate the script even if the prompt is similar.

Suggested opening, but do NOT copy if another hook is better:
${hook}

JSON format:
{
  "rythme": 90,
  "intensite": "High",
  "ruptures": [3, 8, 15, 23, 31],
  "hook": "Unique hook here",
  "angle": "Unique angle here",
  "mood": "Mood here",
  "rewrittenPrompt": "Final 25 to 40 second narration here."
}

User idea:
${cleanPrompt}
`);

    const parsed = extractJson(result.response.text());
    return normalizeConfig(parsed, cleanPrompt, style);
  } catch (error) {
    console.error("NEURAL_ENGINE_FALLBACK:", error);
    return fallbackConfig(cleanPrompt, style);
  }
  }
