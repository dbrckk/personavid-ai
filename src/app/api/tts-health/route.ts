import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

export async function GET() {
  try {
    const baseUrl = getColabBaseUrl();

    if (!baseUrl) {
      return NextResponse.json({ ok: false, error: "NO_COLAB_URL" });
    }

    const res = await fetch(`${baseUrl}/health`, {
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true"
      }
    });

    const text = await res.text();

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({
        ok: false,
        error: "INVALID_JSON",
        raw: text.slice(0, 300)
      });
    }
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || "HEALTH_FAILED"
    });
  }
}
