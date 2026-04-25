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

async function generateColabF5Audio(script: string) {
  const baseUrl = process.env.COLAB_TTS_URL;

  if (!baseUrl) {
    throw new Error("COLAB_TTS_URL missing in Vercel environment variables");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [
        null,
        "Reference voice sample",
        script.slice(0, 1000),
        false,
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Colab F5-TTS failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const audioPath =
    result?.data?.find((item: any) => typeof item === "string" && item.includes(".wav")) ||
    result?.data?.find((item: any) => item?.url)?.url;

  if (!audioPath) {
    throw new Error("Colab F5-TTS failed: audio output not found");
  }

  const audioUrl = audioPath.startsWith("http")
    ? audioPath
    : `${baseUrl.replace(/\/$/, "")}/file=${audioPath}`;

  const audioResponse = await fetch(audioUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (!audioResponse.ok) {
    const errorText = await audioResponse.text();
    throw new Error(`Colab audio download failed: ${audioResponse.status} ${errorText}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString("base64");

  return `data:audio/wav;base64,${base64Audio}`;
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
      generateColabF5Audio(script),
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

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "API_CRASH",
      },
      { status: 500 }
    );
  }
    }
