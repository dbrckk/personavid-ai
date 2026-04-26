"use client";

import React, { useEffect, useRef, useState } from "react";
import { getPredictiveHeatmap } from "../lib/retention-agent";
import { renderManifest } from "../lib/video-core";

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
  script?: string;
  videoUrl?: string;
  audioUrl?: string;
  subtitles?: SubtitleSegment[];
  error?: string;
  help?: string;
};

export default function NeuralRapturePage() {
  const [input, setInput] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [status, setStatus] = useState("SYSTEM_READY");
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [helpMessage, setHelpMessage] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previousObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previousObjectUrlRef.current) {
        URL.revokeObjectURL(previousObjectUrlRef.current);
      }
    };
  }, []);

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

  const handleManifest = async () => {
    if (!input.trim() || isRendering) return;

    setIsRendering(true);
    setDebugMessage(null);
    setHelpMessage(null);
    setSubtitles([]);
    setActiveSubtitle("");
    setStatus("GENERATING_SCRIPT_AND_VOICE...");

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
        body: JSON.stringify({ prompt: input.trim() }),
      });

      const assets: RenderApiResponse = await response.json();

      if (!response.ok || !assets.ok) {
        throw new Error(
          `${assets?.error || `Render API failed with status ${response.status}`}${
            assets?.help ? `\n\n${assets.help}` : ""
          }`
        );
      }

      if (!assets.videoUrl) {
        throw new Error("Missing videoUrl in render response");
      }

      if (!assets.audioUrl) {
        throw new Error("Missing audioUrl in render response");
      }

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
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-[#010101] text-zinc-100 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.16),transparent_45%)]" />
      <div className="absolute top-0 w-full h-[2px] bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex justify-between items-end mb-4 px-2 gap-4">
          <span className="text-[10px] font-bold text-cyan-400 tracking-[0.5em] uppercase">
            v33.0_F5_Clone
          </span>

          <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-widest uppercase text-right">
            Status //{" "}
            <span className={isRendering ? "text-amber-500" : "text-emerald-500"}>
              {status}
            </span>
          </span>
        </div>

        <div className="relative bg-zinc-900/40 border border-white/10 backdrop-blur-3xl rounded-3xl p-1 shadow-2xl">
          <div className="bg-black/40 rounded-[1.4rem] p-6">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-48 bg-transparent border-none text-white text-xl font-light placeholder-zinc-700 focus:ring-0 focus:outline-none resize-none p-0 leading-relaxed"
              placeholder="Écris seulement ton idée. Le site génère le script, la voix clonée et la vidéo."
            />

            <div className="flex gap-[1px] h-1.5 w-full bg-white/5 mt-6 rounded-full overflow-hidden">
              {getPredictiveHeatmap(input || " ").map((v, i) => (
                <div
                  key={i}
                  style={{ width: `${100 / 20}%`, opacity: v / 100 + 0.2 }}
                  className="bg-cyan-400"
                />
              ))}
            </div>

            {debugMessage && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-red-400">
                  Diagnostic
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-red-200">
                  {debugMessage}
                </p>

                {helpMessage && (
                  <p className="mt-3 text-sm text-zinc-200">
                    {helpMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="p-4">
            <button
              onClick={handleManifest}
              disabled={isRendering || !input.trim()}
              className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all
                ${
                  isRendering || !input.trim()
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-white text-black hover:bg-cyan-400 active:scale-95"
                }`}
            >
              {isRendering ? "Création en cours..." : "Créer la vidéo"}
            </button>
          </div>
        </div>

        {videoResult && (
          <div className="mt-8 animate-in zoom-in-95 duration-500">
            <div className="relative mx-auto aspect-[9/16] max-h-[78vh] max-w-[430px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-black shadow-2xl">
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
      </div>

      <footer className="relative z-10 mt-12 opacity-30">
        <p className="text-[9px] tracking-[1em] uppercase">
          PersonaVid AI // Private Mode
        </p>
      </footer>
    </main>
  );
  }
