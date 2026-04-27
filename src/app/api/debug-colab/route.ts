import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

export async function GET() {
  const baseUrl = getColabBaseUrl();

  if (!baseUrl) {
    return NextResponse.json({
      ok: false,
      step: "env",
      error: "COLAB_TTS_URL missing",
    });
  }

  try {
    const healthRes = await fetch(`${baseUrl}/health`, {
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    const healthText = await healthRes.text();

    return NextResponse.json({
      ok: healthRes.ok,
      colabUrl: baseUrl,
      status: healthRes.status,
      raw: healthText,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      colabUrl: baseUrl,
      error: error?.message || "DEBUG_FAILED",
    });
  }
}
