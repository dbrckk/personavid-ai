import { NextResponse } from "next/server";

function getColabBaseUrl() {
  const raw = process.env.COLAB_TTS_URL || "";
  return raw.replace(/\/$/, "");
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
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: "offline",
          message: `Colab returned ${response.status}`,
        },
        { status: 503 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      ok: Boolean(data?.ok && data?.voice_ready && data?.ref_text_ready),
      status:
        data?.ok && data?.voice_ready && data?.ref_text_ready
          ? "online"
          : "voice_not_ready",
      voice_ready: Boolean(data?.voice_ready),
      ref_text_ready: Boolean(data?.ref_text_ready),
      colab: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        status: "offline",
        message: error?.message || "Colab unreachable",
      },
      { status: 503 }
    );
  }
}
