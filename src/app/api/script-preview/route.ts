import { NextRequest, NextResponse } from "next/server";
import { generateNeuralScript, ViralStyle } from "@/lib/ai-engine";
import {
  estimateDurationFromScript,
  generateSubtitleSegments,
} from "@/lib/subtitle-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 60;

const allowedStyles: ViralStyle[] = [
  "dominant",
  "seductive",
  "motivational",
  "mysterious",
  "luxury",
];

function cleanPrompt(prompt: unknown) {
  return String(prompt || "").trim().slice(0, 900);
}

function cleanStyle(style: unknown): ViralStyle {
  const value = String(style || "").trim() as ViralStyle;
  return allowedStyles.includes(value) ? value : "seductive";
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

    const config = await generateNeuralScript(
      `${prompt}\n\nVariation seed: ${Date.now()}-${Math.random()}`,
      style
    );

    const script = String(config.rewrittenPrompt || "").trim();

    const estimatedDuration = estimateDurationFromScript(script);
    const subtitles = generateSubtitleSegments(script, estimatedDuration);

    return NextResponse.json({
      ok: true,
      prompt,
      style,
      script,
      estimatedDuration,
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
