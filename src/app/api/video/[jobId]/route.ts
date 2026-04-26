import { NextRequest, NextResponse } from "next/server";

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    const safeJobId = String(params.jobId || "").replace(/[^a-f0-9]/g, "");

    if (!safeJobId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid job id",
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${baseUrl}/video/${safeJobId}`, {
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
          error: `Colab video failed: ${response.status}`,
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
