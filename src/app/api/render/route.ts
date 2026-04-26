import { NextRequest, NextResponse } from "next/server";
import { generateNeuralScript } from "@/lib/ai-engine";
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

function cleanPrompt(prompt: unknown) {
  return String(prompt || "").trim().slice(0, 700);
}

function buildVoiceScript(prompt: string, config: any) {
  const hook = config?.hook || "Stop scrolling...";

  return [
    hook,
    "",
    "You think you're doing enough?",
    "",
    "You're not.",
    "",
    prompt,
    "",
    "But here's the truth...",
    "",
    "You're missing the part that actually matters.",
    "",
    "And once you understand it...",
    "",
    "everything changes.",
    "",
    "Save this.",
  ].join("\n");
}

function getPexelsSearchQuery(prompt: string) {
  const text = prompt.toLowerCase();

  if (text.includes("money") || text.includes("business") || text.includes("argent")) {
    return "business success";
  }

  if (text.includes("fitness") || text.includes("sport") || text.includes("muscle")) {
    return "fitness motivation";
  }

  if (text.includes("ai") || text.includes("ia") || text.includes("tech")) {
    return "technology futuristic";
  }

  if (text.includes("motivation") || text.includes("discipline")) {
    return "discipline motivation";
  }

  return "cinematic lifestyle";
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

async function searchPexelsVideo(prompt: string) {
  const apiKey = process.env.PEXELS_API_KEY || "";

  if (!apiKey) {
    return "/demo.mp4";
  }

  const url = new URL("https://api.pexels.com/videos/search");

  url.searchParams.set("query", getPexelsSearchQuery(prompt));
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

    if (!prompt) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing prompt",
        },
        { status: 400 }
      );
    }

    const config = await generateNeuralScript(prompt);
    const script = buildVoiceScript(prompt, config);
    const subtitles = generateSubtitleSegments(script, 18);

    const [audioUrl, videoUrl] = await Promise.all([
      generateColabAudio(script),
      searchPexelsVideo(prompt),
    ]);

    return NextResponse.json({
      ok: true,
      provider: "F5-TTS-Colab",
      prompt,
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
