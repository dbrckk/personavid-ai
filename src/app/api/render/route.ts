import { NextRequest, NextResponse } from "next/server";
import { generateNeuralScript, ViralStyle } from "@/lib/ai-engine";
import {
  estimateDurationFromScript,
  generateSubtitleSegments,
} from "@/lib/subtitle-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 60;

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
  return String(prompt || "").trim().slice(0, 900);
}

function cleanScript(script: unknown) {
  return String(script || "").trim().slice(0, 1700);
}

function cleanStyle(style: unknown): ViralStyle {
  const value = String(style || "").trim() as ViralStyle;
  return allowedStyles.includes(value) ? value : "seductive";
}

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

async function readTextSafely(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

async function checkColabOnline(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    const raw = await response.text();

    if (!response.ok) return false;

    const data = JSON.parse(raw);

    return Boolean(data?.ok && data?.render_ready);
  } catch {
    return false;
  }
}

function buildVoiceScript(prompt: string, config: any, userScript?: string) {
  const manualScript = cleanScript(userScript);

  if (manualScript) return manualScript;

  const rewritten = String(config?.rewrittenPrompt || "").trim();

  if (rewritten) return rewritten.slice(0, 1700);

  return [
    "Stop scrolling.",
    "",
    "Most people think the problem is motivation.",
    "",
    "It is not.",
    "",
    prompt,
    "",
    "The real problem is that their environment keeps rewarding the weakest version of them.",
    "",
    "So stop waiting to feel ready.",
    "",
    "Remove one excuse. Build one rule. Repeat it until your identity has no choice but to change.",
  ].join("\n");
}

function getPexelsSearchQuery(prompt: string, config?: any, style?: ViralStyle) {
  const angle = String(config?.angle || "").toLowerCase();
  const text = `${prompt} ${angle} ${style || ""}`.toLowerCase();

  if (text.includes("money") || text.includes("business") || text.includes("wealth")) {
    return "luxury business woman city vertical";
  }

  if (text.includes("ai") || text.includes("technology") || text.includes("tech")) {
    return "futuristic technology neon vertical";
  }

  if (text.includes("discipline") || text.includes("motivation") || text.includes("success")) {
    return "success motivation cinematic vertical";
  }

  if (text.includes("fitness") || text.includes("gym") || text.includes("body")) {
    return "fitness woman cinematic vertical";
  }

  if (text.includes("love") || text.includes("relationship") || text.includes("dating")) {
    return "confident woman night cinematic vertical";
  }

  if (style === "seductive") return "confident woman cinematic portrait";
  if (style === "dominant") return "powerful woman city cinematic";
  if (style === "luxury") return "luxury lifestyle woman vertical";
  if (style === "mysterious") return "dark cinematic woman silhouette";
  if (style === "motivational") return "success discipline cinematic vertical";

  return "cinematic woman lifestyle vertical";
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
    (file) =>
      file.height >= file.width &&
      file.height >= 1280 &&
      file.width >= 720
  );

  const goodDurationFiles = verticalFiles.filter(
    (file) => file.duration >= 5 && file.duration <= 60
  );

  const candidates =
    goodDurationFiles.length > 0
      ? goodDurationFiles
      : verticalFiles.length > 0
        ? verticalFiles
        : mp4Files;

  const sorted = candidates.sort((a, b) => {
    const aRatio = a.height / Math.max(a.width, 1);
    const bRatio = b.height / Math.max(b.width, 1);

    const aSize = a.width * a.height;
    const bSize = b.width * b.height;

    const aQualityScore =
      (a.quality === "hd" ? 100000000 : 0) + aRatio * 1000000 + aSize;
    const bQualityScore =
      (b.quality === "hd" ? 100000000 : 0) + bRatio * 1000000 + bSize;

    return bQualityScore - aQualityScore;
  });

  return sorted[0]?.link || null;
}

async function searchPexelsVideo(
  prompt: string,
  config?: any,
  style?: ViralStyle
) {
  const apiKey = process.env.PEXELS_API_KEY || "";

  if (!apiKey) return "/demo.mp4";

  try {
    const url = new URL("https://api.pexels.com/videos/search");

    url.searchParams.set("query", getPexelsSearchQuery(prompt, config, style));
    url.searchParams.set("orientation", "portrait");
    url.searchParams.set("size", "large");
    url.searchParams.set("per_page", "20");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) return "/demo.mp4";

    const data = await response.json();
    const videos = Array.isArray(data?.videos) ? data.videos : [];

    return pickBestVerticalVideo(videos) || "/demo.mp4";
  } catch {
    return "/demo.mp4";
  }
}

async function startRenderInColab(script: string, videoUrl: string) {
  const baseUrl = getColabBaseUrl();

  if (!baseUrl) {
    throw new Error("COLAB_TTS_URL missing in Vercel environment variables");
  }

  const online = await checkColabOnline(baseUrl);

  if (!online) {
    throw new Error("COLAB_OFFLINE_OR_VOICE_NOT_READY");
  }

  const response = await fetch(`${baseUrl}/render-start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json
