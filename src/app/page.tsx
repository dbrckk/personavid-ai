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
};

type ScriptPreviewResponse = {
  ok?: boolean;
  script?: string;
  subtitles?: SubtitleSegment[];
  estimatedDuration?: number;
};

async function readJsonSafely<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON: ${text.slice(0, 300)}`);
  }
}

const styles: ViralStyle[] = [
  "dominant",
  "seductive",
  "motivational",
  "mysterious",
  "luxury",
];

export default function Page() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState<ViralStyle>("dominant");

  const [script, setScript] = useState("");
  const [duration, setDuration] = useState<number | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [status, setStatus] = useState("READY");
  const [logs, setLogs] = useState<string[]>([]);

  const [loadingScript, setLoadingScript] = useState(false);
  const [loadingRender, setLoadingRender] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((l) => [`${time} - ${msg}`, ...l].slice(0, 10));
  };

  const wordCount = useMemo(() => {
    return script.split(/\s+/).filter(Boolean).length;
  }, [script]);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/tts-health");
        const data = await readJsonSafely<any>(res);
        addLog(data.ok ? "Colab online" : "Colab offline");
      } catch {
        addLog("Health check failed");
      }
    };

    check();
  }, []);

  const generateScript = async () => {
    if (!input.trim()) return;

    setLoadingScript(true);
    setStatus("GENERATING_SCRIPT");

    try {
      const res = await fetch("/api/script-preview", {
        method: "POST",
        body: JSON.stringify({ prompt: input, style }),
      });

      const data = await readJsonSafely<ScriptPreviewResponse>(res);

      setScript(data.script || "");
      setDuration(data.estimatedDuration || null);

      setStatus("SCRIPT_READY");
      addLog("Script generated");
    } catch (e: any) {
      setStatus("ERROR_SCRIPT");
      addLog(e.message);
    } finally {
      setLoadingScript(false);
    }
  };

  const pollRender = async (jobId: string) => {
    for (let i = 0; i < 240; i++) {
      const res = await fetch(`/api/render-status/${jobId}`);
      const data = await readJsonSafely<any>(res);

      if (!data.ok) throw new Error(data.error);

      const progress = data.progress || 0;
      const stage = data.stage || "rendering";

      setStatus(`${stage} ${progress}%`);

      if (i % 2 === 0) addLog(`${stage} ${progress}%`);

      if (data.status === "done") {
        setVideoUrl(data.finalVideoUrl);
        setStatus("DONE");
        addLog("Video ready");
        return;
      }

      if (data.status === "error") {
        throw new Error(data.error);
      }

      await new Promise((r) => setTimeout(r, 5000));
    }

    throw new Error("Timeout");
  };

  const renderVideo = async () => {
    setLoadingRender(true);
    setStatus("START_RENDER");

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        body: JSON.stringify({
          prompt: input,
          script,
          style,
        }),
      });

      const data = await readJsonSafely<RenderApiResponse>(res);

      if (!data.renderJobId) throw new Error("No job id");

      addLog("Render started");

      await pollRender(data.renderJobId);
    } catch (e: any) {
      setStatus("ERROR_RENDER");
      addLog(e.message);
    } finally {
      setLoadingRender(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-6">PersonaVid AI</h1>

      <div className="space-y-4 max-w-2xl">
        <textarea
          className="w-full p-4 bg-zinc-900 rounded"
          placeholder="Prompt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="flex gap-2">
          {styles.map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`px-3 py-2 rounded ${
                style === s ? "bg-white text-black" : "bg-zinc-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={generateScript}
          className="bg-cyan-400 text-black px-4 py-2 rounded"
        >
          {loadingScript ? "..." : "Generate Script"}
        </button>

        <textarea
          className="w-full p-4 bg-zinc-900 rounded min-h-[200px]"
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />

        <div className="text-sm opacity-60">
          {wordCount} words • {duration || "25-40"} sec
        </div>

        <button
          onClick={renderVideo}
          className="bg-white text-black px-4 py-2 rounded"
        >
          {loadingRender ? "Rendering..." : "Render Video"}
        </button>

        <div className="text-xs opacity-70">{status}</div>

        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full mt-4"
          />
        )}

        <div className="text-xs mt-4 space-y-1">
          {logs.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
                                      }
