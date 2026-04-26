import { NextRequest, NextResponse } from "next/server";

function getColabBaseUrl() {
  const raw = process.env.COLAB_TTS_URL || "";
  return raw.replace(/\/$/, "");
}

async function checkColabOnline(baseUrl: string) {
  const response = await fetch(`${baseUrl}/health`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) return false;

  const data = await response.json();
  return Boolean(data?.ok && data?.voice_ready && data?.ref_text_ready);
}

export async function POST(req: NextRequest) {
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

    const online = await checkColabOnline(baseUrl);

    if (!online) {
      return NextResponse.json(
        {
          ok: false,
          error: "COLAB_OFFLINE_OR_VOICE_NOT_READY",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const text =
      typeof body?.text === "string" && body.text.trim()
        ? body.text.trim().slice(0, 300)
        : "Stop scrolling... You need to hear this carefully.";

    const response = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          ok: false,
          error: `COLAB_TTS_FAILED: ${response.status} ${errorText}`,
        },
        { status: 500 }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      ok: true,
      audioUrl: `data:audio/wav;base64,${base64}`,
      text,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "TTS_TEST_FAILED",
      },
      { status: 500 }
    );
  }
        }
