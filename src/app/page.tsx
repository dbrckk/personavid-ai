"use client";

import { useState } from "react";

type RenderResponse = {
  videoUrl?: string;
  audioUrl?: string;
  error?: string;
};

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      const data: RenderResponse = await res.json();

      if (!data.videoUrl || !data.audioUrl) {
        throw new Error(
          data.error || "Pipeline incomplet : aucun média généré"
        );
      }

      // 👉 ici normalement tu passes dans ton moteur vidéo
      // pour l’instant on affiche directement la vidéo
      setVideoUrl(data.videoUrl);
    } catch (err: any) {
      console.error(err);
      setError("ERROR_IN_NEURAL_LINK");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">PERSONAVID AI</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your viral TikTok idea..."
        className="w-full max-w-xl p-4 bg-neutral-900 rounded"
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-6 py-3 bg-white text-black rounded font-bold"
      >
        {loading ? "Generating..." : "Generate Video"}
      </button>

      {error && (
        <div className="text-red-500 font-bold">{error}</div>
      )}

      {videoUrl && (
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-[300px] rounded"
        />
      )}
    </main>
  );
    }
