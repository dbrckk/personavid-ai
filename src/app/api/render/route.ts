import { NextRequest, NextResponse } from "next/server";

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

function buildShortScript(prompt: string) {
  const clean = String(prompt || "").trim();

  if (!clean) {
    return "";
  }

  return [
    `Stop scrolling.`,
    `${clean}.`,
    `Here is the key idea in simple words.`,
    `Use this now if you want faster results.`,
  ].join(" ");
}

function pickBestVerticalVideo(videos: PexelsVideo[]): string | null {
  for (const video of videos) {
    const sorted = [...video.video_files].sort((a, b) => {
      const aScore = Math.abs((a.height / Math.max(a.width, 1)) - (16 / 9));
      const bScore = Math.abs((b.height / Math.max(b.width, 1)) - (16 / 9));
      return aScore - bScore;
    });

    const best = sorted.find(
      (file) =>
        file.file_type === "video/mp4" &&
        file.width >= 720 &&
        file.height >= 1280
    );

    if (best?.link) {
      return best.link;
    }

    const fallback = sorted.find((file) => file.file_type === "video/mp4");
    if (fallback?.link) {
      return fallback.link;
    }
  }

  return null;
}

async function generateElevenLabsAudio(text: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY missing");
  }

  if (!voiceId) {
    throw new Error("ELEVENLABS_VOICE_ID missing");
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
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.85,
          style: 0.55,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs error: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString("base64");

  return `data:audio/mpeg;base64,${base64Audio}`;
}

async function searchPexelsVideo(query: string) {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    return "/demo.mp4";
  }

  const url = new URL("https://api.pexels.com/videos/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "10");
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("size", "medium");

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
  const videos = Array.isArray(data?.videos) ? (data.videos as PexelsVideo[]) : [];
  const best = pickBestVerticalVideo(videos);

  return best || "/demo.mp4";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();

    if (!prompt) {
      return NextResponse.json(
        {
          error: "Missing prompt",
        },
        { status: 400 }
      );
    }

    const script = buildShortScript(prompt);

    if (!script) {
      return NextResponse.json(
        {
          error: "Invalid prompt",
        },
        { status: 400 }
      );
    }

    const [audioUrl, videoUrl] = await Promise.all([
      generateElevenLabsAudio(script),
      searchPexelsVideo(prompt),
    ]);

    return NextResponse.json({
      prompt,
      script,
      audioUrl,
      videoUrl,
    });
  } catch (error: any) {
    console.error("Render route failed:", error);

    return NextResponse.json(
      {
        error: error?.message || "Render failed",
      },
      { status: 500 }
    );
  }
}
