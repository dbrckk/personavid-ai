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
  script?: string;
  subtitles?: SubtitleSegment[];
  estimatedDuration?: number;
  renderJobId?: string;
  error?: string;
  details?: string;
  help?: string;
};

type ScriptPreviewResponse = {
  ok?: boolean;
  script?: string;
  subtitles?: SubtitleSegment[];
  estimatedDuration?: number;
  error?: string;
};

type HealthResponse = {
  ok?: boolean;
  status?: string;
  engine?: string;
  voice_ready?: boolean;
  ref_text_ready?: boolean;
  render_ready?: boolean;
  cuda?: boolean;
  jobs?: number;
  error?: string;
};

type DebugColabResponse = {
  ok?: boolean;
  colabUrl?: string;
  status?: number;
  raw?: string;
  error?: string;
};

async function readJsonSafely<T>(response: Response): Promise<T> {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `API returned non-JSON response (${response.status}): ${text.slice(0, 600)}`
    );
  }
}

const styles: { id: ViralStyle; label: string; desc: string; emoji: string }[] = [
  {
    id: "dominant",
    label: "Dominant",
    desc: "Sharp, controlled, powerful",
    emoji: "⚡",
  },
  {
    id: "seductive",
    label: "Seductive",
    desc: "Smooth, magnetic, feminine",
    emoji: "🖤",
  },
  {
    id: "motivational",
    label: "Motivation",
    desc: "Energy, discipline, action",
    emoji: "🔥",
  },
  {
    id: "mysterious",
    label: "Mysterious",
    desc: "Dark, cinematic, secretive",
    emoji: "🌙",
  },
  {
    id: "luxury",
    label: "Luxury",
    desc: "Premium, status, high value",
    emoji: "💎",
  },
];

const examples = [
  "Why discipline beats motivation",
  "How to become impossible to ignore",
  "The money mistake keeping people broke",
  "AI tools that make you 10x faster",
];

export default function Page() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState<ViralStyle>("seductive");

  const [script, setScript] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [status, setStatus] = useState("READY");
  const [stage, setStage] = useState("Idle");
  const [progress, setProgress] = useState(0);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [debug, setDebug] = useState<DebugColabResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const [loadingScript, setLoadingScript] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [loadingRender, setLoadingRender] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingDebug, setLoadingDebug] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const wordCount = useMemo(() => {
    return script.trim().split(/\s+/).filter(Boolean).length;
  }, [script]);

  const canScript = Boolean(input.trim()) && !loadingScript;
  const canVoice = Boolean(script.trim() || input.trim()) && !loadingVoice;
  const canRender = Boolean(script.trim() || input.trim()) && !loadingRender;

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`${time} — ${message}`, ...prev].slice(0, 12));
  };

  const refreshHealth = async () => {
    setLoadingHealth(true);

    try {
      const res = await fetch("/api/tts-health", { cache: "no-store" });
      const data = await readJsonSafely<HealthResponse>(res);
      setHealth(data);

      if (data.ok) {
        addLog(`Engine online: ${data.engine || "unknown"}`);
      } else {
        addLog(`Engine offline: ${data.status || data.error || "unknown"}`);
      }
    } catch (error: any) {
      setHealth({ ok: false, status: "offline", error: error?.message });
      addLog("Health check failed");
    } finally {
      setLoadingHealth(false);
    }
  };

  const debugColab = async () => {
    setLoadingDebug(true);

    try {
      const res = await fetch("/api/debug-colab", { cache: "no-store" });
      const data = await readJsonSafely<DebugColabResponse>(res);
      setDebug(data);
      addLog(data.ok ? "Debug Colab OK" : "Debug Colab failed");
    } catch (error: any) {
      setDebug({ ok: false, error: error?.message || "DEBUG_FAILED" });
      addLog("Debug request failed");
    } finally {
      setLoadingDebug(false);
    }
  };

  useEffect(() => {
    refreshHealth();
    const interval = window.setInterval(refreshHealth, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const generateScript = async () => {
    if (!canScript) return;

    setLoadingScript(true);
    setStatus("WRITING");
    setStage("Generating viral script");
    setProgress(15);
    setVideoUrl(null);
    setAudioUrl(null);
    addLog("Generating script...");

    try {
      const res = await fetch("/api/script-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          prompt: input.trim(),
          style,
          randomize: true,
          seed: Date.now(),
        }),
      });

      const data = await readJsonSafely<ScriptPreviewResponse>(res);

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "SCRIPT_FAILED");
      }

      setScript(data.script || "");
      setSubtitles(data.subtitles || []);
      setDuration(data.estimatedDuration || null);
      setStatus("SCRIPT_READY");
      setStage("Script ready");
      setProgress(35);
      addLog("Script ready");
    } catch (error: any) {
      setStatus("ERROR");
      setStage("Script error");
      setProgress(0);
      addLog(error?.message || "Script failed");
    } finally {
      setLoadingScript(false);
    }
  };

  const testVoice = async () => {
    if (!canVoice) return;

    setLoadingVoice(true);
    setAudioUrl(null);
    setStatus("VOICE_TEST");
    setStage("Generating cloned voice test");
    setProgress(25);
    addLog("Testing voice...");

    try {
      const text =
        script.trim() ||
        input.trim() ||
        "Stop scrolling. This is the part most people ignore.";

      const res = await fetch("/api/tts-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          text: text.slice(0, 700),
        }),
      });

      const data = await readJsonSafely<any>(res);

      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.details || "VOICE_FAILED");
      }

      setAudioUrl(data.audioUrl);
      setStatus("VOICE_READY");
      setStage("Voice ready");
      setProgress(45);
      addLog("Voice test ready");
    } catch (error: any) {
      setStatus("ERROR");
      setStage("Voice error");
      setProgress(0);
      addLog(error?.message || "Voice failed");
    } finally {
      setLoadingVoice(false);
      refreshHealth();
    }
  };

  const pollRender = async (jobId: string) => {
    for (let i = 0; i < 240; i++) {
      const res = await fetch(`/api/render-status/${jobId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJsonSafely<any>(res);

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "RENDER_STATUS_FAILED");
      }

      const currentProgress =
        typeof data.progress === "number" ? data.progress : 0;
      const currentStage = data.stage || data.status || "rendering";

      setStage(currentStage);
      setProgress(currentProgress);
      setStatus("RENDERING");

      if (i % 3 === 0) {
        addLog(`${currentStage} (${currentProgress}%)`);
      }

      if (data.status === "done" && data.finalVideoUrl) {
        setVideoUrl(data.finalVideoUrl);
        setStatus("DONE");
        setStage("Video ready");
        setProgress(100);
        addLog("Final MP4 ready");
        return;
      }

      if (data.status === "done" && data.final_id) {
        setVideoUrl(`/api/video/${data.final_id}`);
        setStatus("DONE");
        setStage("Video ready");
        setProgress(100);
        addLog("Final MP4 ready");
        return;
      }

      if (data.status === "error") {
        throw new Error(data.error || "COLAB_RENDER_ERROR");
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error("RENDER_TIMEOUT_AFTER_20_MIN");
  };

  const renderVideo = async () => {
    if (!canRender) return;

    setLoadingRender(true);
    setVideoUrl(null);
    setStatus("STARTING_RENDER");
    setStage("Starting render job");
    setProgress(5);
    addLog("Starting async render...");

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          prompt: input.trim(),
          script: script.trim(),
          style,
        }),
      });

      const data = await readJsonSafely<RenderApiResponse>(res);

      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.details || data.help || "RENDER_FAILED");
      }

      if (!data.renderJobId) {
        throw new Error("No job id");
      }

      if (data.script) setScript(data.script);
      if (data.subtitles) setSubtitles(data.subtitles);
      if (data.estimatedDuration) setDuration(data.estimatedDuration);

      addLog(`Render job: ${data.renderJobId}`);
      await pollRender(data.renderJobId);
    } catch (error: any) {
      setStatus("ERROR");
      setStage("Render error");
      setProgress(0);
      addLog(error?.message || "Render failed");
    } finally {
      setLoadingRender(false);
      refreshHealth();
    }
  };

  const downloadVideo = () => {
    if (!videoUrl) return;

    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `personavid-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const healthOnline = Boolean(health?.ok);
  const selectedStyle = styles.find((s) => s.id === style);

  return (
    <main className="min-h-screen bg-[#050509] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_30%),linear-gradient(to_bottom,#060612,#020204)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-5">
        <header className="mb-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.55em] text-cyan-300">
                PersonaVid AI
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.07em] md:text-6xl">
                TikTok Video Studio
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Prompt → viral script → cloned voice → vertical MP4 → burned subtitles.
              </p>
            </div>

            <div
              className={`rounded-3xl border px-5 py-4 ${
                healthOnline
                  ? "border-emerald-400/30 bg-emerald-400/10"
                  : "border-red-400/30 bg-red-400/10"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">
                Engine
              </p>
              <p
                className={`mt-1 text-2xl font-black ${
                  healthOnline ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {healthOnline ? "ONLINE" : "OFFLINE"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {health?.engine || "unknown"} · CUDA {String(Boolean(health?.cuda))}
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-300 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-zinc-400">
            <span>Status: {status}</span>
            <span>Stage: {stage}</span>
            <span>{progress}%</span>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                  01 — Idea
                </p>
                <button
                  onClick={generateScript}
                  disabled={!canScript}
                  className="rounded-2xl bg-cyan-300 px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-black disabled:opacity-40"
                >
                  {loadingScript ? "Writing..." : "Generate"}
                </button>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write a TikTok idea..."
                className="min-h-[150px] w-full resize-none rounded-3xl border border-white/10 bg-black/40 p-5 text-lg leading-relaxed outline-none placeholder:text-zinc-700 focus:border-cyan-300/50"
              />

              <div className="mt-4 grid gap-2 md:grid-cols-4">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setInput(ex)}
                    className="rounded-2xl border border-white/10 bg-black/30 p-3 text-left text-xs font-bold text-zinc-300 hover:border-cyan-300/40"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                02 — Voice Energy
              </p>

              <div className="grid gap-3 md:grid-cols-5">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      style === s.id
                        ? "border-cyan-300/60 bg-cyan-300/15 text-white"
                        : "border-white/10 bg-black/30 text-zinc-400 hover:bg-white/5"
                    }`}
                  >
                    <p className="text-2xl">{s.emoji}</p>
                    <p className="mt-2 text-sm font-black uppercase">
                      {s.label}
                    </p>
                    <p className="mt-1 text-xs opacity-70">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                    03 — Script
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {wordCount} words · {duration ? `${duration}s` : "25–40s target"} ·{" "}
                    {selectedStyle?.label}
                  </p>
                </div>
              </div>

              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value.slice(0, 1700))}
                placeholder="Generated script appears here..."
                className="min-h-[310px] w-full resize-none rounded-3xl border border-white/10 bg-black/40 p-5 text-base leading-relaxed outline-none placeholder:text-zinc-700 focus:border-cyan-300/50"
              />

              <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-white/10">
                {getPredictiveHeatmap(input || script || " ").map((v, i) => (
                  <div
                    key={i}
                    className="bg-cyan-300"
                    style={{
                      width: "5%",
                      opacity: v / 100 + 0.15,
                    }}
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button
                  onClick={testVoice}
                  disabled={!canVoice}
                  className="rounded-2xl border border-white/10 bg-white px-4 py-5 text-xs font-black uppercase tracking-[0.3em] text-black disabled:opacity-40"
                >
                  {loadingVoice ? "Testing..." : "Test Voice"}
                </button>

                <button
                  onClick={renderVideo}
                  disabled={!canRender}
                  className="rounded-2xl bg-cyan-300 px-4 py-5 text-xs font-black uppercase tracking-[0.3em] text-black disabled:opacity-40"
                >
                  {loadingRender ? "Rendering..." : "Render MP4"}
                </button>
              </div>

              {audioUrl && (
                <audio className="mt-5 w-full" src={audioUrl} controls />
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-2xl">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                Preview
              </p>

              <div className="mx-auto aspect-[9/16] max-w-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl">
                {videoUrl ? (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <div className="mb-5 h-20 w-20 rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10" />
                    <p className="text-lg font-black">No video yet</p>
                    <p className="mt-2 text-sm text-zinc-600">
                      Your final TikTok MP4 appears here.
                    </p>
                  </div>
                )}
              </div>

              {videoUrl && (
                <button
                  onClick={downloadVideo}
                  className="mt-5 w-full rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-4 text-xs font-black uppercase tracking-[0.3em] text-cyan-100"
                >
                  Download MP4
                </button>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                  Diagnostics
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={refreshHealth}
                    disabled={loadingHealth}
                    className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase text-zinc-300"
                  >
                    Health
                  </button>
                  <button
                    onClick={debugColab}
                    disabled={loadingDebug}
                    className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase text-zinc-300"
                  >
                    Debug
                  </button>
                </div>
              </div>

              {debug && (
                <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-300">
                  <p>Debug: {String(debug.ok)}</p>
                  <p>Status: {String(debug.status || "none")}</p>
                  <p className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-words opacity-70">
                    {debug.raw || debug.error || ""}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-sm text-zinc-600">No logs yet.</p>
                ) : (
                  logs.map((log) => (
                    <p
                      key={log}
                      className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300"
                    >
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
