import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function getColabBaseUrl() {
  return String(process.env.COLAB_TTS_URL || "").replace(/\/$/, "");
}

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const baseUrl = getColabBaseUrl();

  return fetch(`${baseUrl}/video/${params.jobId}`, {
    headers: {
      "ngrok-skip-browser-warning": "true"
    }
  });
}
