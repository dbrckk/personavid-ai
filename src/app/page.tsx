"use client";

import React, { useEffect, useRef, useState } from "react";
import { getPredictiveHeatmap } from "../lib/retention-agent";
import { renderManifest } from "../lib/video-core";

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
  audioUrl?: string;
  subtitles?: SubtitleSegment[];
  error?: string;
  help?: string;
};

type ScriptPreviewResponse = {
  ok?: boolean;
  prompt?: string;
  style?: ViralStyle;
  script?: string;
  subtitles?: SubtitleSegment[];
  error?: string;
};

type TtsHealth = {
  ok: boolean;
  status: string;
  voice_ready?: boolean;
  ref_text_ready?: boolean;
  message?: string;
};

const styles: { id: ViralStyle; label: string; desc: string }[] = [
  { id: "dominant", label: "Dominant", desc: "direct, intense" },
  { id: "seductive", label: "Seductive", desc: "soft, confident" },
  { id: "motivational", label: "Motivation", desc: "energy, discipline" },
  { id: "mysterious", label: "Mysterious", desc: "dark, cinematic" },
  { id: "luxury", label: "Luxury", desc: "premium, status" },
];

const examples = [
  "How to become impossible to ignore",
  "Why discipline beats motivation",
  "The money mistake keeping people broke",
  "AI tools that make you 10x faster",
];

export default function NeuralRapturePage() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState<ViralStyle>("dominant");

  const [isRendering, setIsRendering] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState("");

  const [status, setStatus] = useState("SYSTEM_READY");
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [helpMessage, setHelpMessage] = useState<string | null>(null);

  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState("");

  const [ttsHealth, setTtsHealth] = useState<TtsHealth | null>(null);
  const [isCheckingTts, setIsCheckingTts] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previousObjectUrlRef = useRef<string | null>(null);

  const checkTtsHealth = async () => {
    setIsCheckingTts(true);

    try {
      const response = await fetch("/api/tts-health", {
        method: "GET",
        cache: "no-store",
      });

      const data: TtsHealth = await response.json();
      setTtsHealth(data);
    } catch (error: any) {
      setTtsHealth({
        ok: false,
        status: "offline",
        message: error?.message || "TTS unreachable",
      });
    } finally {
      setIsCheckingTts(false);
    }
  };

  useEffect(() => {
    checkTtsHealth();

    const interval = window.setInterval(checkTtsHealth, 30000);

    return () => {
      window.clearInterval(interval);

      if (previousObjectUrlRef.current) {
        URL.revokeObjectURL(previousObjectUrlRef.current);
      }
    };
  }, []);

  const resetErrors = () => {
    setDebugMessage(null);
    setHelpMessage(null);
  };

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current?.currentTime || 0;

    const currentSubtitle = subtitles.find(
      (segment) => currentTime >= segment.start && currentTime <= segment.end
    );

    setActiveSubtitle(currentSubtitle?.text || "");
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

  const handleScriptPreview = async () => {
    if (!input.trim() || isGeneratingScript) return;

    setIsGeneratingScript(true);
    resetErrors();
    setStatus("GENERATING_SCRIPT_PREVIEW...");

    try {
      const response = await fetch("/api/script-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input.trim(),
          style,
        }),
      });

      const data: ScriptPreviewResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data?.error || "SCRIPT_PREVIEW_FAILED");
      }

      setGeneratedScript(data.script || "");
      setSubtitles(Array.isArray(data.subtitles) ? data.subtitles : []);
      setStatus("SCRIPT_READY");
    } catch (error: any) {
      setDebugMessage(error?.message || "SCRIPT_PREVIEW_FAILED");
      setStatus("ERROR_IN_SCRIPT_ENGINE");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleVoiceTest = async () => {
    if (isTestingVoice) return;

    setIsTestingVoice(true);
    resetErrors();
    setTestAudioUrl(null);

    try {
      const text =
        generatedScript.trim() ||
        (style === "seductive"
          ? "Listen closely... you already know what you want. Now act like it."
          : "Stop scrolling... this is the part most people ignore.");

      const response = await fetch("/api/tts-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data?.error || "VOICE_TEST_FAILED");
      }

      setTestAudioUrl(data.audioUrl);
      setStatus("VOICE_TEST_READY");
      checkTtsHealth();
    } catch (error: any) {
      const raw = error?.message || "VOICE_TEST_FAILED";

      if (raw.includes("COLAB_OFFLINE")) {
        setDebugMessage("COLAB_OFFLINE_OR_VOICE_NOT_READY");
        setHelpMessage(
          "Lance le notebook Colab, upload ta voix de référence, puis clique sur Refresh."
        );
      } else {
        setDebugMessage(raw);
      }

      setStatus("ERROR_IN_VOICE_TEST");
      checkTtsHealth();
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleManifest = async () => {
    if ((!input.trim() && !generatedScript.trim()) || isRendering) return;

    setIsRendering(true);
    resetErrors();
    setSubtitles([]);
    setActiveSubtitle("");
    setTestAudioUrl(null);
    setStatus("GENERATING_VOICE_AND_VIDEO...");

    try {
      if (previousObjectUrlRef.current) {
        URL.revokeObjectURL(previousObjectUrlRef.current);
        previousObjectUrlRef.current = null;
      }

      setVideoResult(null);

      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input.trim(),
          style,
          script: generatedScript.trim(),
        }),
      });

      const assets: RenderApiResponse = await response.json();

      if (!response.ok || !assets.ok) {
        throw new Error(
          `${assets?.error || `Render API failed with status ${response.status}`}${
            assets?.help ? `\n\n${assets.help}` : ""
          }`
        );
      }

      if (!assets.videoUrl) throw new Error("Missing videoUrl in render response");
      if (!assets.audioUrl) throw new Error("Missing audioUrl in render response");

      setGeneratedScript(assets.script || "");
      setSubtitles(Array.isArray(assets.subtitles) ? assets.subtitles : []);
      setStatus("RENDERING_TIKTOK_MP4...");

      const blob = await renderManifest({
        videoUrl: assets.videoUrl,
        audioUrl: assets.audioUrl,
      });

      const objectUrl = URL.createObjectURL(blob);
      previousObjectUrlRef.current = objectUrl;

      setVideoResult(objectUrl);
      setStatus("MP4_READY");
      checkTtsHealth();
    } catch (err: any) {
      console.error("SYSTEM_FAILURE:", err);

      const raw = err?.message || "Unknown error";

      if (raw.includes("COLAB_OFFLINE_OR_VOICE_NOT_READY")) {
        setDebugMessage("COLAB_OFFLINE_OR_VOICE_NOT_READY");
        setHelpMessage(
          "Ouvre ton notebook Colab, lance la cellule complète, upload ton audio, puis attends que le serveur affiche PUBLIC URL et /health online."
        );
      } else {
        setDebugMessage(raw);
      }

      setStatus("ERROR_IN_NEURAL_LINK");
      checkTtsHealth();
    } finally {
      setIsRendering(false);
    }
  };

  const healthLabel = !ttsHealth
    ? "CHECKING"
    : ttsHealth.ok
      ? "ONLINE"
      : ttsHealth.status.toUpperCase();

  const healthClass = !ttsHealth
    ? "border-zinc-700 bg-zinc-900/60 text-zinc-300"
    : ttsHealth.ok
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : "border-red-400/30 bg-red-400/10 text-red-300";

  const canCreateVideo = Boolean(input.trim() || generatedScript.trim());

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#010101] p-5 text-zinc-100">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.18),transparent_45%)]" />
      <div className="absolute left-0 top-0 h-[2px] w-full bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 py-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-400">
              PersonaVid AI
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              TikTok Voice Clone Engine
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
              Status
            </p>
            <p className={isRendering ? "text-amber-400" : "text-emerald-400"}>
              {status}
            </p>
          </div>
        </header>

        <div className={`rounded-3xl border px-5 py-4 ${healthClass}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                Colab Voice Engine
              </p>
              <p className="mt-1 text-lg font-black">
                {isCheckingTts ? "Checking..." : healthLabel}
              </p>

              {ttsHealth && !ttsHealth.ok && (
                <p className="mt-2 max-w-2xl text-sm opacity-90">
                  Lance Colab, upload la voix de référence, attends que{" "}
                  <strong>voice_ready</strong> et <strong>ref_text_ready</strong>{" "}
                  soient actifs.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={checkTtsHealth}
                disabled={isCheckingTts}
                className="rounded-2xl border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-white/80 hover:bg-white/10 disabled:opacity-40"
              >
                Refresh
              </button>

              <button
                onClick={handleVoiceTest}
                disabled={isTestingVoice}
                className="rounded-2xl bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-black hover:bg-cyan-300 disabled:opacity-40"
              >
                {isTestingVoice ? "Testing..." : "Test Voice"}
              </button>
            </div>
          </div>

          {testAudioUrl && (
            <audio src={testAudioUrl} controls className="mt-4 w-full" />
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-900/40 p-1 shadow-2xl backdrop-blur-3xl">
            <div className="rounded-[1.7rem] bg-black/40 p-5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-40 w-full resize-none border-none bg-transparent p-0 text-xl font-light leading-relaxed text-white placeholder-zinc-700 focus:outline-none focus:ring-0"
                placeholder="Écris seulement ton idée. Exemple : how to become impossible to ignore..."
              />

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setInput(example)}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-xs font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  >
                    {example}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                  Voice Style
                </p>

                <div className="grid gap-2 sm:grid-cols-5">
                  {styles.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setStyle(item.id)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        style === item.id
                          ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100"
                          : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <p className="text-xs font-black uppercase">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[10px] opacity-70">
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex h-1.5 w-full gap-[1px] overflow-hidden rounded-full bg-white/5">
                {getPredictiveHeatmap(input || generatedScript || " ").map((v, i) => (
                  <div
                    key={i}
                    style={{ width: `${100 / 20}%`, opacity: v / 100 + 0.2 }}
                    className="bg-cyan-400"
                  />
                ))}
              </div>

              {debugMessage && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-red-400">
                    Diagnostic
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-red-200">
                    {debugMessage}
                  </p>

                  {helpMessage && (
                    <p className="mt-3 text-sm text-zinc-200">{helpMessage}</p>
                  )}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={handleScriptPreview}
                  disabled={isGeneratingScript || !input.trim()}
                  className={`rounded-2xl py-5 text-xs font-black uppercase tracking-[0.3em] transition-all ${
                    isGeneratingScript || !input.trim()
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      : "bg-cyan-400 text-black hover:bg-white active:scale-95"
                  }`}
                >
                  {isGeneratingScript ? "Script..." : "Generate Script"}
                </button>

                <button
                  onClick={handleManifest}
                  disabled={isRendering || !canCreateVideo}
                  className={`rounded-2xl py-5 text-xs font-black uppercase tracking-[0.3em] transition-all ${
                    isRendering || !canCreateVideo
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      : "bg-white text-black hover:bg-cyan-400 active:scale-95"
                  }`}
                >
                  {isRendering ? "Création..." : "Create Video"}
                </button>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-black/30 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                Editable Script
              </p>

              <p className="text-[10px] text-zinc-600">
                {generatedScript.length}/1000
              </p>
            </div>

            <textarea
              value={generatedScript}
              onChange={(e) => setGeneratedScript(e.target.value.slice(0, 1000))}
              className="mt-4 min-h-[220px] w-full resize-none rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-200 placeholder-zinc-700 focus:border-cyan-400/50 focus:outline-none"
              placeholder="Clique Generate Script, puis modifie le texte ici avant la voix et la vidéo."
            />

            {videoResult && (
              <div className="mt-6 animate-in zoom-in-95 duration-500">
                <div className="relative mx-auto aspect-[9/16] max-h-[68vh] max-w-[360px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-black shadow-2xl">
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
                </div>

                <button
                  onClick={handleDownload}
                  className="mt-5 w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-xs font-black uppercase tracking-[0.35em] text-cyan-200 transition hover:bg-cyan-400 hover:text-black active:scale-95"
                >
                  Télécharger le MP4
                </button>
              </div>
            )}
          </aside>
        </div>

        <footer className="text-center opacity-30">
          <p className="text-[9px] uppercase tracking-[1em]">
            PersonaVid AI // Private Mode
          </p>
        </footer>
      </section>
    </main>
  );
        }
