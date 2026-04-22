import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({
        error: "Missing prompt",
      });
    }

    // ⚠️ FAKE PIPELINE TEMPORAIRE (à remplacer ensuite)
    // ici on simule un rendu vidéo

    const videoUrl = "/demo.mp4";
    const audioUrl = "/demo.mp3";

    return NextResponse.json({
      videoUrl,
      audioUrl,
    });
  } catch (e) {
    return NextResponse.json({
      error: "Render failed",
    });
  }
}
