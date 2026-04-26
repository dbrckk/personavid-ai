import { NextRequest, NextResponse } from "next/server";
import { generateNeuralScript, ViralStyle } from "@/lib/ai-engine";
import { generateSubtitleSegments } from "@/lib/subtitle-engine";

const allowedStyles: ViralStyle[] = [
  "dominant",
  "seductive",
  "motivational",
  "mysterious",
  "luxury",
];

function cleanPrompt(prompt: unknown) {
  return String(prompt || "").trim().slice(0, 700);
}

function cleanStyle(style: unknown): ViralStyle {
  const value = String(style || "").trim() as ViralStyle;
  return allowedStyles.includes(value) ? value : "dominant";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt = cleanPrompt(body?.prompt);
    const style = cleanStyle(body?.style);

    if (!prompt) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing prompt",
        },
        { status: 400 }
      );
    }

    const config = await generateNeuralScript(prompt, style);

    const script =
      String(config?.rewrittenPrompt || "").trim() ||
      [
        config?.hook || "Stop scrolling...",
        "",
        prompt,
        "",
        "But here's the truth...",
        "",
        "The part you ignore is the part that changes everything.",
        "",
        "Save this.",
      ].join("\n");

    const subtitles = generateSubtitleSegments(script, 24);

    return NextResponse.json({
      ok: true,
      prompt,
      style,
      script,
      config,
      subtitles,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "SCRIPT_PREVIEW_FAILED",
      },
      { status: 500 }
    );
  }
  }
