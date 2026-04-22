"use client";

import React, { useEffect, useRef, useState } from "react";
import { getPredictiveHeatmap } from "../lib/retention-agent";
import { renderManifest } from "../lib/video-core";

type RenderApiResponse = {
  prompt?: string;
  script?: string;
  videoUrl?: string;
  audioUrl?: string;
  error?: string;
};

export default function NeuralRapturePage() {
  const [input, setInput] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [status, setStatus] = useState("SYSTEM_READY");
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  const previousObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previousObjectUrlRef.current) {
        URL.revokeObjectURL(previousObjectUrlRef.current);
      }
    };
  }, []);

  const handleManifest = async () => {
    if (!input.trim() || isRendering) return;

    setIsRendering(true);
    setDebugMessage(null);
    setStatus("ANALYZING_NEURAL_FLUX...");

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

      let assets: RenderApiResponse;

      try {
        assets = await response.json();
      } catch {
        throw new Error("Invalid JSON response from /api/render");
      }

      if (!response.ok) {
        throw new Error(
          assets?.error || `Render API failed with status ${response.status}`
        );
      }

      if (!assets?.videoUrl) {
        throw new Error("Missing videoUrl in render response");
      }

      if (!assets?.audioUrl) {
        throw new Error("Missing audioUrl in render response");
      }

      setStatus("RENDERING_MANIFEST...");

      const blob = await renderManifest({
        videoUrl: assets.videoUrl,
        audioUrl: assets.audioUrl,
      });

      const objectUrl = URL.createObjectURL(blob);
      previousObjectUrlRef.current = objectUrl;

      setVideoResult(objectUrl);
      setStatus("MANIFEST_COMPLETED");
    } catch (err: any) {
      console.error("SYSTEM_FAILURE:", err);
      setDebugMessage(err?.message || "Unknown error");
      setStatus("ERROR_IN_NEURAL_LINK");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-[#010101] text-zinc-100">
      <div className="absolute top-0 w-full h-[2px] bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />

      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-end mb-4 px-2 gap-4">
          <span className="text-[10px] font-bold text-cyan-400 tracking-[0.5em] uppercase">
            v31.4_Rapture
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
              placeholder="Injecter le script d'influence ici..."
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
                <p className="mt-2 text-sm text-red-200 break-words">
                  {debugMessage}
                </p>
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
              {isRendering ? "Synchronisation..." : "Lancer Manifestation"}
            </button>
          </div>
        </div>

        {videoResult && (
          <div className="mt-8 animate-in zoom-in-95 duration-500">
            <div className="p-1 bg-gradient-to-b from-cyan-500/20 to-transparent rounded-3xl">
              <video
                src={videoResult}
                controls
                className="w-full rounded-[1.4rem] shadow-2xl"
                playsInline
              />
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 opacity-30">
        <p className="text-[9px] tracking-[1em] uppercase">
          User_Authorized: Drackk-20
        </p>
      </footer>
    </main>
  );
  }
