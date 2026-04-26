"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getPredictiveHeatmap } from "../lib/retention-agent";

type ViralStyle =
  | "dominant"
  | "seductive"
  | "motivational"
  | "mysterious"
  | "luxury";

type SubtitleSegment = {
  id: string;
  text: string;
  start: number;
  end: number;
};

type RenderApiResponse = {
  ok?: boolean;
  provider?: string;
  prompt?: string;
  style?: ViralStyle;
  script?: string;
  videoUrl?: string;
  finalVideoUrl?: string;
  subtitles?: SubtitleSegment[];
  estimatedDuration?: number;
  error?: string;
  help?: string;
};

type ScriptPreviewResponse = {
  ok?: boolean;
  script?: string;
  subtitles?: SubtitleSegment[];
  estimatedDuration?: number;
  error?: string;
};

type TtsHealth = {
  ok: boolean;
  status: string;
  voice_ready?: boolean;
  ref_text_ready?: boolean;
  render_ready?: boolean;
  message?: string;
  colab_url?: string;
};

const styles: { id: ViralStyle; label: string; desc: string }[] = [
  { id: "dominant", label: "Dominant", desc: "Direct, intense, controlled" },
  { id: "seductive", label: "Seductive", desc: "Smooth, confident, magnetic" },
  { id: "motivational", label: "Motivation", desc: "Energy, discipline, action" },
  { id: "mysterious", label: "Mysterious", desc: "Dark, cinematic, intriguing" },
  { id: "luxury", label: "Luxury", desc: "Premium, status, high-value" },
];

const examples = [
  "How to become impossible to ignore",
  "Why discipline beats motivation",
  "The money mistake keeping people broke",
  "AI tools that make you 10x faster",
];

export default function Page() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState<ViralStyle>("dominant");
  const [generatedScript, setGeneratedScript] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);

  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);

  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState("");

  const [status, setStatus] = useState("SYSTEM_READY");
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [helpMessage, setHelpMessage] = useState<string | null>(null);

  const [isRendering, setIsRendering] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isCheckingTts, setIsCheckingTts] = useState(false);

  const [ttsHealth, setTtsHealth] = useState<TtsHealth | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const wordCount = useMemo(() => {
    return generatedScript.trim().split(/\s+/).filter(Boolean).length;
  }, [generatedScript]);

  const resetErrors = () => {
    setDebugMessage(null);
    setHelpMessage(null);
  };

  const checkTtsHealth = async () => {
    setIsCheckingTts(true);

    try {
      const res = await fetch("/api/tts-health", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();
      setTtsHealth(data);
    } catch {
      setTtsHealth({
        ok: false,
        status: "offline",
      });
    } finally {
      setIsCheckingTts(false);
    }
  };

  useEffect(() => {
    checkTtsHealth();
    const interval = window.setInterval(checkTtsHealth, 20000);
    return () => window.clearInterval(interval);
  }, []);

  const handleScriptPreview = async () => {
    if (!input.trim() || isGeneratingScript) return;

    setIsGeneratingScript(true);
    resetErrors();
    setStatus("GENERATING_25_40S_SCRIPT...");

    try {
      const res = await fetch("/api/script-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ prompt: input.trim(), style }),
      });

      const data: ScriptPreviewResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "SCRIPT_PREVIEW_FAILED");
      }

      setGeneratedScript(data.script || "");
      setSubtitles(data.subtitles || []);
      setEstimatedDuration(data.estimatedDuration || null);
      setStatus("SCRIPT_READY");
    } catch (error: any) {
      setDebugMessage(error?.message || "SCRIPT_PREVIEW_FAILED");
      setStatus("ERROR_SCRIPT");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleVoiceTest = async () => {
    if (isTestingVoice) return;

    setIsTestingVoice(true);
    resetErrors();
    setTestAudioUrl(null);
    setStatus("TESTING_CLONED_VOICE...");

    try {
      const text =
        generatedScript.trim() ||
        "Stop scrolling... this is the part most people ignore. You do not need more motivation. You need a system that makes action automatic.";

      const res = await fetch("/api/tts-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "VOICE_TEST_FAILED");
      }

      setTestAudioUrl(data.audioUrl);
      setStatus("VOICE_READY");
      checkTtsHealth();
    } catch (error: any) {
      setDebugMessage(error?.message || "VOICE_TEST_FAILED");
      setHelpMessage("Si Colab est offline, relance le notebook puis clique Refresh.");
      setStatus("ERROR_VOICE");
      checkTtsHealth();
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleGenerate = async () => {
    if ((!generatedScript.trim() && !input.trim()) || isRendering) return;

    setIsRendering(true);
    resetErrors();
    setVideoResult(null);
    setActiveSubtitle("");
    setStatus("RENDERING_FULL_MP4_IN_COLAB...");

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          prompt: input.trim(),
          script: generatedScript.trim(),
          style,
        }),
      });

      const data: RenderApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(
          `${data.error || "RENDER_FAILED"}${data.help ? `\n\n${data.help}` : ""}`
        );
      }

      if (!data.finalVideoUrl) {
        throw new Error("Missing finalVideoUrl");
      }

      setVideoResult(data.finalVideoUrl);
      setGeneratedScript(data.script || generatedScript);
      setSubtitles(data.subtitles || []);
      setEstimatedDuration(data.estimatedDuration || null);
      setStatus("MP4_READY");
      checkTtsHealth();
    } catch (error: any) {
      setDebugMessage(error?.message || "ERROR_RENDER");
      setHelpMessage("Vérifie que Colab est ONLINE et que ton domaine ngrok est bien dans COLAB_TTS_URL.");
      setStatus("ERROR_RENDER");
      checkTtsHealth();
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!videoResult) return;

    const link = document.createElement("a");
    link.href = videoResult;
    link.download = `personavid-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current?.currentTime || 0;

    const currentSubtitle = subtitles.find(
      (segment) => currentTime >= segment.start && currentTime <= segment.end
    );

    setActiveSubtitle(currentSubtitle?.text || "");
  };

  const healthLabel = !ttsHealth
    ? "CHECKING"
    : ttsHealth.ok
      ? "ONLINE"
      : ttsHealth.status.toUpperCase();

  const healthClass = !ttsHealth
    ? "border-zinc-700/60 bg-zinc-900/70 text-zinc-300"
    : ttsHealth.ok
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : "border-red-400/30 bg-red-400/10 text-red-300";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030306] px-4 py-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.24),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(to_bottom,#030306,#07070c_55%,#020203)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.8)]" />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.55em] text-cyan-300">
              PersonaVid AI
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.07em] text-white md:text-6xl">
              Viral TikTok Generator
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Prompt → script 25–40s → cloned voice → cinematic video → burned subtitles.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
              System
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-300">{status}</p>
          </div>
        </header>

        <div className={`rounded-[1.7rem] border px-5 py-4 backdrop-blur-xl ${healthClass}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em]">
                Colab Full Render Engine
              </p>
              <p className="mt-1 text-2xl font-black">{isCheckingTts ? "CHECKING..." : healthLabel}</p>
              <p className="mt-2 text-xs opacity-80">
                voice: {String(Boolean(ttsHealth?.voice_ready))} · ref:{" "}
                {String(Boolean(ttsHealth?.ref_text_ready))} · render:{" "}
                {String(Boolean(ttsHealth?.render_ready))}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={checkTtsHealth}
                disabled={isCheckingTts}
                className="rounded-2xl border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-white/80 transition hover:bg-white/10 disabled:opacity-40"
              >
                Refresh
              </button>

              <button
                onClick={handleVoiceTest}
                disabled={isTestingVoice}
                className="rounded-2xl bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-black transition hover:bg-cyan-300 disabled:opacity-40"
              >
                {isTestingVoice ? "Testing..." : "Test Voice"}
              </button>
            </div>
          </div>

          {!ttsHealth?.ok && (
            <p className="mt-4 text-sm leading-relaxed opacity-90">
              Si Colab est lancé mais détecté offline, vérifie que ton notebook affiche bien{" "}
              <strong>render_ready=true</strong> dans <strong>/health</strong> et que{" "}
              <strong>COLAB_TTS_URL</strong> pointe vers le domaine ngrok fixe.
            </p>
          )}

          {testAudioUrl && <audio src={testAudioUrl} controls className="mt-4 w-full" />}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                Step 1 — Idea
              </p>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="mt-4 h-40 w-full resize-none rounded-3xl border border-white/10 bg-black/40 p-5 text-xl font-light leading-relaxed text-white placeholder-zinc-700 outline-none transition focus:border-cyan-400/50"
                placeholder="Write your idea here. Example: how to become impossible to ignore..."
              />

              <div className="mt-4 grid gap-2 md:grid-cols-4">
                {examples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setInput(example)}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-xs font-bold text-zinc-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                Step 2 — Voice Style
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-5">
                {styles.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStyle(item.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      style === item.id
                        ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.12)]"
                        : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className="text-sm font-black uppercase">{item.label}</p>
                    <p className="mt-1 text-xs opacity-70">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                  Step 3 — Editable Script
                </p>

                <div className="text-right text-xs text-zinc-500">
                  <p>{wordCount} words</p>
                  <p>{estimatedDuration ? `${estimatedDuration}s estimated` : "25–40s target"}</p>
                </div>
              </div>

              <textarea
                value={generatedScript}
                onChange={(e) => setGeneratedScript(e.target.value.slice(0, 1700))}
                className="mt-4 min-h-[300px] w-full resize-none rounded-3xl border border-white/10 bg-black/40 p-5 text-base leading-relaxed text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-cyan-400/50"
                placeholder="Click Generate Script. Then edit the narration before voice and video render."
              />

              <div className="mt-4 flex h-1.5 w-full gap-[1px] overflow-hidden rounded-full bg-white/5">
                {getPredictiveHeatmap(input || generatedScript || " ").map((v, i) => (
                  <div
                    key={i}
                    style={{ width: `${100 / 20}%`, opacity: v / 100 + 0.2 }}
                    className="bg-cyan-400"
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button
                  onClick={handleScriptPreview}
                  disabled={isGeneratingScript || !input.trim()}
                  className={`rounded-2xl py-5 text-xs font-black uppercase tracking-[0.35em] transition ${
                    isGeneratingScript || !input.trim()
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      : "bg-cyan-300 text-black hover:bg-white active:scale-95"
                  }`}
                >
                  {isGeneratingScript ? "Writing..." : "Generate Script"}
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={isRendering || (!generatedScript.trim() && !input.trim())}
                  className={`rounded-2xl py-5 text-xs font-black uppercase tracking-[0.35em] transition ${
                    isRendering || (!generatedScript.trim() && !input.trim())
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      : "bg-white text-black hover:bg-cyan-300 active:scale-95"
                  }`}
                >
                  {isRendering ? "Rendering..." : "Render Full MP4"}
                </button>
              </div>

              {debugMessage && (
                <div className="mt-5 rounded-3xl border border-red-400/20 bg-red-400/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-300">
                    Diagnostic
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-red-100">
                    {debugMessage}
                  </p>
                  {helpMessage && (
                    <p className="mt-3 text-sm text-zinc-200">{helpMessage}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
              Final TikTok Preview
            </p>

            <div className="mt-5 flex justify-center">
              <div className="relative aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl">
                {videoResult ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoResult}
                      controls
                      className="h-full w-full object-cover"
                      playsInline
                      onTimeUpdate={handleTimeUpdate}
                    />

                    {activeSubtitle && (
                      <div className="pointer-events-none absolute left-1/2 bottom-[13%] w-[88%] -translate-x-1/2 text-center">
                        <p className="text-[clamp(24px,7vw,44px)] font-black uppercase leading-[0.95] tracking-[-0.04em] text-white [text-shadow:_0_3px_0_#000,_0_-3px_0_#000,_3px_0_0_#000,_-3px_0_0_#000,_0_0_18px_rgba(0,0,0,0.9)]">
                          {activeSubtitle}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <div className="mb-5 h-16 w-16 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_40px_rgba(34,211,238,0.12)]" />
                    <p className="text-sm font-bold text-zinc-300">
                      Your rendered TikTok video appears here.
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                      Full MP4 is generated in Colab with cloned voice and burned subtitles.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {videoResult && (
              <button
                onClick={handleDownload}
                className="mt-5 w-full rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-4 text-xs font-black uppercase tracking-[0.35em] text-cyan-100 transition hover:bg-cyan-300 hover:text-black active:scale-95"
              >
                Download MP4
              </button>
            )}
          </aside>
        </div>

        <footer className="pb-4 text-center opacity-30">
          <p className="text-[9px] uppercase tracking-[1em]">
            PersonaVid AI // Private Mode
          </p>
        </footer>
      </section>
    </main>
  );
}
