"use client";

import React, { useEffect, useRef, useState } from "react";
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
  error?: string;
  help?: string;
};

type ScriptPreviewResponse = {
  ok?: boolean;
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
  { id: "motivational", label: "Motivation", desc: "energy" },
  { id: "mysterious", label: "Mysterious", desc: "dark" },
  { id: "luxury", label: "Luxury", desc: "premium" },
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

  const [ttsHealth, setTtsHealth] = useState<TtsHealth | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const checkTtsHealth = async () => {
    try {
      const res = await fetch("/api/tts-health");
      const data = await res.json();
      setTtsHealth(data);
    } catch {
      setTtsHealth({ ok: false, status: "offline" });
    }
  };

  useEffect(() => {
    checkTtsHealth();
    const i = setInterval(checkTtsHealth, 30000);
    return () => clearInterval(i);
  }, []);

  const handleScriptPreview = async () => {
    if (!input.trim()) return;

    setIsGeneratingScript(true);
    setStatus("GENERATING_SCRIPT...");

    try {
      const res = await fetch("/api/script-preview", {
        method: "POST",
        body: JSON.stringify({ prompt: input, style }),
      });

      const data: ScriptPreviewResponse = await res.json();

      if (!data.ok) throw new Error(data.error);

      setGeneratedScript(data.script || "");
      setSubtitles(data.subtitles || []);
      setStatus("SCRIPT_READY");
    } catch (e: any) {
      setDebugMessage(e.message);
      setStatus("ERROR_SCRIPT");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleVoiceTest = async () => {
    setIsTestingVoice(true);

    try {
      const res = await fetch("/api/tts-test", {
        method: "POST",
        body: JSON.stringify({ text: generatedScript }),
      });

      const data = await res.json();

      if (!data.ok) throw new Error(data.error);

      setTestAudioUrl(data.audioUrl);
      setStatus("VOICE_READY");
    } catch (e: any) {
      setDebugMessage(e.message);
      setStatus("ERROR_VOICE");
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleGenerate = async () => {
    if (!generatedScript && !input) return;

    setIsRendering(true);
    setStatus("GENERATING_VIDEO...");

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        body: JSON.stringify({
          prompt: input,
          script: generatedScript,
          style,
        }),
      });

      const data: RenderApiResponse = await res.json();

      if (!data.ok) throw new Error(data.error);

      setVideoResult(data.finalVideoUrl || null);
      setGeneratedScript(data.script || "");
      setSubtitles(data.subtitles || []);
      setStatus("DONE");
    } catch (e: any) {
      setDebugMessage(e.message);
      setStatus("ERROR_RENDER");
    } finally {
      setIsRendering(false);
    }
  };

  const handleTimeUpdate = () => {
    const t = videoRef.current?.currentTime || 0;

    const sub = subtitles.find(
      (s) => t >= s.start && t <= s.end
    );

    setActiveSubtitle(sub?.text || "");
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">PersonaVid AI</h1>

      {/* STATUS */}
      <div className="mb-4 text-sm">
        Status: {status} | Colab: {ttsHealth?.status || "checking"}
      </div>

      {/* INPUT */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter idea..."
        className="w-full h-32 bg-zinc-900 p-3 mb-4"
      />

      {/* EXAMPLES */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {examples.map((e) => (
          <button key={e} onClick={() => setInput(e)} className="bg-zinc-800 px-3 py-2">
            {e}
          </button>
        ))}
      </div>

      {/* STYLE */}
      <div className="flex gap-2 mb-4">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className={style === s.id ? "bg-cyan-500 px-3 py-2" : "bg-zinc-800 px-3 py-2"}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* BUTTONS */}
      <div className="flex gap-3 mb-4">
        <button onClick={handleScriptPreview} className="bg-blue-500 px-4 py-2">
          Script
        </button>

        <button onClick={handleVoiceTest} className="bg-green-500 px-4 py-2">
          Voice
        </button>

        <button onClick={handleGenerate} className="bg-white text-black px-4 py-2">
          Video
        </button>
      </div>

      {/* SCRIPT EDIT */}
      <textarea
        value={generatedScript}
        onChange={(e) => setGeneratedScript(e.target.value)}
        className="w-full h-40 bg-zinc-900 p-3 mb-4"
      />

      {/* AUDIO TEST */}
      {testAudioUrl && <audio controls src={testAudioUrl} />}

      {/* VIDEO */}
      {videoResult && (
        <div className="mt-6">
          <video
            ref={videoRef}
            src={videoResult}
            controls
            className="w-full max-w-sm"
            onTimeUpdate={handleTimeUpdate}
          />

          <div className="text-xl font-bold mt-2">{activeSubtitle}</div>
        </div>
      )}

      {/* ERROR */}
      {debugMessage && <div className="text-red-400 mt-4">{debugMessage}</div>}
    </main>
  );
    }
