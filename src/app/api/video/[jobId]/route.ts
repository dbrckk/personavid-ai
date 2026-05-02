import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const baseUrl = getColabBaseUrl();
    const safeJobId = String(params.jobId || "").replace(/[^a-f0-9]/g, "");

    if (!baseUrl) {
      return NextResponse.json(
        { ok: false, error: "COLAB_TTS_URL missing" },
        { status: 500 }
      );
    }

    if (!safeJobId) {
      return NextResponse.json(
        { ok: false, error: "Invalid video id" },
        { status: 400 }
      );
    }

    const response = await fetch(`${baseUrl}/video/${safeJobId}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    if (!response.ok) {
      const text = await response.text();

      return NextResponse.json(
        {
          ok: false,
          error: `COLAB_VIDEO_FAILED_${response.status}`,
          raw: text.slice(0, 500),
        },
        { status: response.status }
      );
    }

    const videoBuffer = await response.arrayBuffer();

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="personavid-${safeJobId}.mp4"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "VIDEO_PROXY_FAILED",
      },
      { status: 500 }
    );
  }
}
