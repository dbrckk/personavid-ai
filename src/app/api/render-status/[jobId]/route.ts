import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const baseUrl = getColabBaseUrl();
    const jobId = params.jobId;

    const res = await fetch(`${baseUrl}/render-status/${jobId}`, {
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true"
      }
    });

    const text = await res.text();

    try {
      return NextResponse.json(JSON.parse(text));
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
      error: e?.message || "STATUS_FAILED"
    });
  }
}
