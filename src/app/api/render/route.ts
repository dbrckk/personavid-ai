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
  return String(prompt || "").trim().slice(0, 800);
}

function buildVoiceScript(prompt: string, config: any) {
  const hook = config?.hook || "Stop scrolling.";
  const intensity = config?.intensite || "High";

  return [
    hook,
    prompt,
    "This is the part most people ignore.",
    "But it changes everything when you understand it.",
    `Intensity level: ${intensity}.`,
    "Save this before you forget it.",
  ].join(" ");
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
  const allFiles = videos.flatMap((video) =>
    video.video_files.map((file) => ({
      ...file,
      duration: video.duration,
    }))
  );

  const mp4Files = allFiles.filter((file) => file.file_type === "video/mp4");

  const verticalFiles = mp4Files.filter(
    (file) => file.height >= file.width && file.height >= 1280
  );

  const candidates = verticalFiles.length > 0 ? verticalFiles : mp4Files;

  const sorted = candidates.sort((a, b) => {
    const aVerticalScore = a.height / Math.max(a.width, 1);
    const bVerticalScore = b.height / Math.max(b.width, 1);

    const aSizeScore = a.width * a.height;
    const bSizeScore = b.width * b.height;

    return bVerticalScore - aVerticalScore || bSizeScore - aSizeScore;
  });

  return sorted[0]?.link || null;
}

async function generateElevenLabsAudio(script: string) {
  const apiKey =
    process.env.ELEVENLABS_API_KEY ||
    process.env.ELEVEN_LABS_KEY ||
    "";

  const voiceId =
    process.env.ELEVENLABS_VOICE_ID ||
    process.env.ELEVEN_LABS_VOICE_ID ||
    "21m00Tcm4TlvDq8ikWAM";

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY missing in Vercel environment variables");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.34,
          similarity_boost: 0.88,
          style: 0.55,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs failed: ${response.status} ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString("base64");

  return `data:audio/mpeg;base64,${base64Audio}`;
}

async function searchPexelsVideo(prompt: string) {
  const apiKey = process.env.PEXELS_API_KEY || "";

  if (!apiKey) {
    return "/demo.mp4";
  }

  const query = getPexelsSearchQuery(prompt);
  const url = new URL("https://api.pexels.com/videos/search");

  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("per_page", "12");

  const response = await fetch(url.toString(), {
    method: "GET",
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
  const bestVideo = pickBestVerticalVideo(videos);

  return bestVideo || "/demo.mp4";
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
      generateElevenLabsAudio(script),
      searchPexelsVideo(prompt),
    ]);

    return NextResponse.json({
      ok: true,
      prompt,
      script,
      config,
      subtitles,
      videoUrl,
      audioUrl,
    });
  } catch (error: any) {
    console.error("RENDER_API_CRASH:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "API_CRASH",
      },
      { status: 500 }
    );
  }
      }
