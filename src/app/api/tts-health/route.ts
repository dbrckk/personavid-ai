import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

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

export async function GET() {
  try {
    const baseUrl = getColabBaseUrl();

    if (!baseUrl) {
      return NextResponse.json(
        {
          ok: false,
          status: "missing_env",
          error: "COLAB_TTS_URL not set",
        },
        { status: 500 }
      );
    }

    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    const raw = await readTextSafely(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: "colab_http_error",
          code: response.status,
          raw: raw.slice(0, 500),
        },
        { status: 502 }
      );
    }

    let data: any;

    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          status: "non_json_response",
          raw: raw.slice(0, 500),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "online",
      engine: data?.engine || "unknown",
      voice_ready: Boolean(data?.voice_ready),
      ref_text_ready: Boolean(data?.ref_text_ready),
      render_ready: Boolean(data?.render_ready),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        status: "network_error",
        error: error?.message || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
