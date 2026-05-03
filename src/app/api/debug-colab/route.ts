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
          error: "COLAB_TTS_URL missing",
        },
        { status: 500 }
      );
    }

    const healthRes = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    const healthRaw = await readTextSafely(healthRes);

    const debugRes = await fetch(`${baseUrl}/debug`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    const debugRaw = await readTextSafely(debugRes);

    return NextResponse.json({
      ok: healthRes.ok,
      colabUrl: baseUrl,
      status: healthRes.status,
      health: healthRaw.slice(0, 2000),
      debugStatus: debugRes.status,
      raw: debugRaw.slice(0, 3000),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "DEBUG_COLAB_FAILED",
      },
      { status: 500 }
    );
  }
}
