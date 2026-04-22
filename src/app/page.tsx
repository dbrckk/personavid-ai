"use client";

import React, { useState } from 'react';
import { getPredictiveHeatmap } from '../lib/retention-agent';
import { renderManifest } from '../lib/video-core';

export default function NeuralRapturePage() {
  const [input, setInput] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [status, setStatus] = useState('IDLE');

  const handleManifest = async () => {
    if (!input) return;
    setIsRendering(true);
    setVideoResult(null);
    setStatus('ANALYZING_NEURAL_FLUX...');
    
    try {
      // 1. ANALYSE IA (Appel API)
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      
      const assets = await response.json();
      setStatus('RENDERING_MANIFEST...');

      // 2. RENDU FFmpeg (Client-side)
      const blob = await renderManifest(assets);
      const url = URL.createObjectURL(blob);
      
      setVideoResult(url);
      setStatus('MANIFEST_COMPLETED');
    } catch (err) {
      console.error("SYSTEM_FAILURE:", err);
      setStatus('ERROR_IN_NEURAL_LINK');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-8 bg-[#020202] text-white">
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      <div className="w-full max-w-2xl">
        <div className="bg-zinc-900/20 border border-white/5 backdrop-blur-2xl rounded-[2rem] p-8 shadow-2xl neon-glow">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold text-cyan-500 tracking-[0.5em] uppercase">v31.4_Rapture</span>
            <span className="text-[9px] text-zinc-600 font-mono">{status}</span>
          </div>

          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-40 bg-transparent border-none text-zinc-300 text-lg font-light placeholder-zinc-800 focus:ring-0 resize-none p-0"
            placeholder="Injecter le script d'influence..."
          />

          <button 
            onClick={handleManifest}
            disabled={isRendering}
            className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all mt-6
              ${isRendering ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-white text-black hover:bg-cyan-400 hover:scale-[1.01]'}`}
          >
            {isRendering ? 'Processing...' : 'Manifest'}
          </button>
        </div>

        {videoResult && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <video src={videoResult} controls className="w-full rounded-2xl border border-cyan-500/30 shadow-2xl" />
          </div>
        )}
      </div>
    </main>
  );
}
