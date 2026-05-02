import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 60;

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

export async function POST(req: NextRequest) {
  try {
    const baseUrl = getColabBaseUrl();

    if (!baseUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "COLAB_TTS_URL missing",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const text =
      typeof body?.text === "string" && body.text.trim()
        ? body.text.trim().slice(0, 700)
        : "Stop scrolling. This is the part most people ignore.";

    const health = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    const healthRaw = await readTextSafely(health);

    if (!health.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "COLAB_HEALTH_FAILED",
          details: healthRaw.slice(0, 600),
        },
        { status: 503 }
      );
    }

    const response = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
      body: JSON.stringify({
        text,
        video_url: "",
      }),
    });

    const raw = await readTextSafely(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `COLAB_GENERATE_FAILED_${response.status}`,
          details: raw.slice(0, 1000),
        },
        { status: 500 }
      );
    }

    const audioBuffer = Buffer.from(raw, "binary");

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
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
