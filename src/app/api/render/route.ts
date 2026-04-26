import { NextRequest, NextResponse } from "next/server";
import { generateNeuralScript, ViralStyle } from "@/lib/ai-engine";
import { generateSubtitleSegments } from "@/lib/subtitle-engine";

type PexelsVideoFile = {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  fps: number;
  link: string;
};

type PexelsVideo = {
  id: number;
  width: number;
  height: number;
  duration: number;
  image: string;
  video_files: PexelsVideoFile[];
};

const allowedStyles: ViralStyle[] = [
  "dominant",
  "seductive",
  "motivational",
  "mysterious",
  "luxury",
];

function cleanPrompt(prompt: unknown) {
  return String(prompt || "").trim().slice(0, 700);
}

function cleanScript(script: unknown) {
  return String(script || "").trim().slice(0, 1000);
}

function cleanStyle(style: unknown): ViralStyle {
  const value = String(style || "").trim() as ViralStyle;
  return allowedStyles.includes(value) ? value : "dominant";
}

function buildVoiceScript(prompt: string, config: any, userScript?: string) {
  const manualScript = cleanScript(userScript);

  if (manualScript) {
    return manualScript;
  }

  const rewritten = String(config?.rewrittenPrompt || "").trim();

  if (rewritten) {
    return rewritten.slice(0, 1000);
  }

  return [
    "Stop scrolling...",
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
  ].join("\n");
}

function getPexelsSearchQuery(prompt: string, config?: any, style?: ViralStyle) {
  const angle = String(config?.angle || "").toLowerCase();
  const text = `${prompt} ${angle} ${style || ""}`.toLowerCase();

  if (text.includes("money") || text.includes("business") || text.includes("argent")) {
    return "business success vertical";
  }

  if (text.includes("fitness") || text.includes("sport") || text.includes("muscle")) {
    return "fitness motivation vertical";
  }

  if (text.includes("ai") || text.includes("ia") || text.includes("tech")) {
    return "technology futuristic vertical";
  }

  if (text.includes("motivation") || text.includes("discipline")) {
    return "discipline motivation vertical";
  }

  if (style === "luxury") return "luxury lifestyle vertical";
  if (style === "mysterious") return "dark cinematic aesthetic";
  if (style === "seductive") return "confident woman cinematic";
  if (style === "dominant") return "powerful woman city";
  if (style === "motivational") return "success discipline motivation";

  return "cinematic lifestyle vertical";
}

function pickBestVerticalVideo(videos: PexelsVideo[]) {
  const files = videos.flatMap((video) =>
    video.video_files.map((file) => ({
      ...file,
      duration: video.duration,
    }))
  );

  const mp4Files = files.filter((file) => file.file_type === "video/mp4");

  const verticalFiles = mp4Files.filter(
    (file) => file.height >= file.width && file.height >= 1280
  );

  const candidates = verticalFiles.length > 0 ? verticalFiles : mp4Files;

  const sorted = candidates.sort((a, b) => {
    const aRatio = a.height / Math.max(a.width, 1);
    const bRatio = b.height / Math.max(b.width, 1);
    const aSize = a.width * a.height;
    const bSize = b.width * b.height;

    return bRatio - aRatio || bSize - aSize;
  });

  return sorted[0]?.link || null;
}

async function searchPexelsVideo(prompt: string, config?: any, style?: ViralStyle) {
  const apiKey = process.env.PEXELS_API_KEY || "";

  if (!apiKey) {
    return "/demo.mp4";
  }

  const url = new URL("https://api.pexels.com/videos/search");

  url.searchParams.set("query", getPexelsSearchQuery(prompt, config, style));
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("per_page", "12");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return "/demo.mp4";
  }

  const data = await response.json();
  const videos = Array.isArray(data?.videos) ? data.videos : [];

  return pickBestVerticalVideo(videos) || "/demo.mp4";
}

function getColabBaseUrl() {
  const raw = process.env.COLAB_TTS_URL || "";
  return raw.replace(/\/$/, "");
}

async function checkColabOnline(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) return false;

    const data = await response.json();

    return Boolean(data?.ok && data?.voice_ready && data?.ref_text_ready);
  } catch {
    return false;
  }
}

async function generateColabAudio(script: string) {
  const baseUrl = getColabBaseUrl();

  if (!baseUrl) {
    throw new Error("COLAB_TTS_URL missing in Vercel environment variables");
  }

  const online = await checkColabOnline(baseUrl);

  if (!online) {
    throw new Error("COLAB_OFFLINE_OR_VOICE_NOT_READY");
  }

  const response = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      text: script.slice(0, 1000),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`COLAB_TTS_FAILED: ${response.status} ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(audioBuffer).toString("base64");

  return `data:audio/wav;base64,${base64}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt = cleanPrompt(body?.prompt);
    const style = cleanStyle(body?.style);
    const manualScript = cleanScript(body?.script);

    if (!prompt && !manualScript) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing prompt or script",
        },
        { status: 400 }
      );
    }

    const config = prompt
      ? await generateNeuralScript(prompt, style)
      : {
          angle: style,
          mood: `confident_${style}`,
          rewrittenPrompt: manualScript,
        };

    const script = buildVoiceScript(prompt, config, manualScript);
    const subtitles = generateSubtitleSegments(script, 24);

    const [audioUrl, videoUrl] = await Promise.all([
      generateColabAudio(script),
      searchPexelsVideo(prompt || script, config, style),
    ]);

    return NextResponse.json({
      ok: true,
      provider: "F5-TTS-Colab",
      prompt,
      style,
      script,
      config,
      subtitles,
      videoUrl,
      audioUrl,
    });
  } catch (error: any) {
    console.error("RENDER_API_CRASH:", error);

    const message = error?.message || "API_CRASH";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        help:
          message === "COLAB_OFFLINE_OR_VOICE_NOT_READY"
            ? "Lance le notebook Colab, upload l'audio de référence, attends que /health affiche voice_ready=true et ref_text_ready=true."
            : undefined,
      },
      { status: 500 }
    );
  }
  }
