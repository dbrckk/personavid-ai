import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

export async function GET() {
  const baseUrl = getColabBaseUrl();

  if (!baseUrl) {
    return NextResponse.json(
      {
        ok: false,
        status: "missing_url",
        message: "COLAB_TTS_URL missing",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    const rawText = await response.text();

    let data: any = null;

    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          status: "invalid_response",
          message: "Colab did not return JSON",
          raw: rawText.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const ready = Boolean(
      response.ok &&
        data?.ok &&
        data?.voice_ready &&
        data?.ref_text_ready &&
        data?.render_ready
    );

    return NextResponse.json(
      {
        ok: ready,
        status: ready ? "online" : "voice_not_ready",
        voice_ready: Boolean(data?.voice_ready),
        ref_text_ready: Boolean(data?.ref_text_ready),
        render_ready: Boolean(data?.render_ready),
        colab_url: baseUrl,
        colab: data,
      },
      {
        status: ready ? 200 : 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        status: "offline",
        message: error?.message || "Colab unreachable",
        colab_url: baseUrl,
      },
      { status: 503 }
    );
  }
      }
