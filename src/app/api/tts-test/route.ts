import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const baseUrl = getColabBaseUrl();

    if (!baseUrl) {
      return NextResponse.json(
        { ok: false, error: "COLAB_TTS_URL missing" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const text =
      typeof body?.text === "string" && body.text.trim()
        ? body.text.trim().slice(0, 1700)
        : "Stop scrolling... this is the part most people ignore.";

    const healthRes = await fetch(`${baseUrl}/health`, {
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    const healthText = await healthRes.text();

    if (!healthRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "COLAB_HEALTH_FAILED",
          details: healthText,
        },
        { status: 503 }
      );
    }

    const voiceRes = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
      body: JSON.stringify({ text }),
    });

    if (!voiceRes.ok) {
      const err = await voiceRes.text();

      return NextResponse.json(
        {
          ok: false,
          error: "COLAB_GENERATE_FAILED",
          details: err,
        },
        { status: 500 }
      );
    }

    const audioBuffer = await voiceRes.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      ok: true,
      text,
      audioUrl: `data:audio/wav;base64,${base64}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "TTS_TEST_FAILED",
      },
      { status: 500 }
    );
  }
}
