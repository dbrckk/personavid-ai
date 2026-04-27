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

    const response = await fetch(`${baseUrl}/render-status/${safeJobId}`, {
      cache: "no-store",
      headers: {
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "PersonaVidAI/1.0",
      },
    });

    const text = await response.text();

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { ok: false, error: "NON_JSON_STATUS", raw: text.slice(0, 500) },
        { status: 502 }
      );
    }

    if (!response.ok || !data?.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({
      ok: true,
      job_id: safeJobId,
      status: data.status,
      finalVideoUrl:
        data.status === "done" && data.final_id
          ? `/api/video/${data.final_id}`
          : null,
      error: data.error || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "STATUS_FAILED" },
      { status: 500 }
    );
  }
      }
