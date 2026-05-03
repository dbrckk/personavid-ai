import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    const baseUrl = getColabBaseUrl();

    const res = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/wav"
      }
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || "TTS_FAILED"
    });
  }
}
