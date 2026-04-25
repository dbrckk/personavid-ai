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

  if (text.includes("money") || text.includes("business")) return "business success";
  if (text.includes("fitness") || text.includes("sport")) return "fitness motivation";
  if (text.includes("ai") || text.includes("tech")) return "technology futuristic";
  if (text.includes("motivation")) return "discipline motivation";

  return "cinematic lifestyle";
}

function pickBestVerticalVideo(videos: PexelsVideo[]) {
  const files = videos.flatMap(v =>
    v.video_files.map(f => ({ ...f, duration: v.duration }))
  );

  const mp4 = files.filter(f => f.file_type === "video/mp4");

  const sorted = mp4.sort((a, b) => {
    const va = a.height / Math.max(a.width, 1);
    const vb = b.height / Math.max(b.width, 1);
    return vb - va || b.width * b.height - a.width * a.height;
  });

  return sorted[0]?.link || null;
}

async function searchPexelsVideo(prompt: string) {
  const apiKey = process.env.PEXELS_API_KEY || "";
  if (!apiKey) return "/demo.mp4";

  const url = new URL("https://api.pexels.com/videos/search");
  url.searchParams.set("query", getPexelsSearchQuery(prompt));
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("per_page", "12");

  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
    cache: "no-store",
  });

  if (!res.ok) return "/demo.mp4";

  const data = await res.json();
  return pickBestVerticalVideo(data?.videos || []) || "/demo.mp4";
}

/* ---------- TTS ---------- */

async function checkColabOnline(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

async function generateColabAudio(script: string) {
  const baseUrl = process.env.COLAB_TTS_URL;
  if (!baseUrl) throw new Error("COLAB_TTS_URL missing");

  const isOnline = await checkColabOnline(baseUrl);
  if (!isOnline) {
    throw new Error("COLAB_OFFLINE");
  }

  const res = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: script }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`TTS_FAILED: ${txt}`);
  }

  const audioBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(audioBuffer).toString("base64");

  return `data:audio/wav;base64,${base64}`;
}

/* ---------- ROUTE ---------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = cleanPrompt(body?.prompt);

    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Missing prompt" }, { status: 400 });
    }

    const config = await generateNeuralScript(prompt);
    const script = buildVoiceScript(prompt, config);
    const subtitles = generateSubtitleSegments(script, 18);

    let audioUrl: string;

    try {
      audioUrl = await generateColabAudio(script);
    } catch (e: any) {
      if (e.message === "COLAB_OFFLINE") {
        return NextResponse.json({
          ok: false,
          error: "COLAB_OFFLINE",
          message: "Lance ton notebook Colab pour activer la voix"
        });
      }

      throw e;
    }

    const videoUrl = await searchPexelsVideo(prompt);

    return NextResponse.json({
      ok: true,
      provider: "F5-TTS-Colab",
      prompt,
      script,
      subtitles,
      videoUrl,
      audioUrl,
    });
  } catch (error: any) {
    console.error("RENDER_API_CRASH:", error);

    return NextResponse.json({
      ok: false,
      error: error?.message || "API_CRASH",
    }, { status: 500 });
  }
          }
