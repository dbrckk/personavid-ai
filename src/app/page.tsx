"use client";

import React, { useState } from 'react';
import { getPredictiveHeatmap } from '../lib/retention-agent';
import { renderManifest } from '../lib/video-core';

export default function NeuralRapturePage() {
  const [input, setInput] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [status, setStatus] = useState('SYSTEM_READY');

  const handleManifest = async () => {
    if (!input) return;
    setIsRendering(true);
    setVideoResult(null);
    setStatus('ANALYZING_NEURAL_FLUX...');
    
    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      
      const assets = await response.json();
      setStatus('RENDERING_MANIFEST...');

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
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-[#010101] text-zinc-100">
      {/* Ligne de scan plus discrète */}
      <div className="absolute top-0 w-full h-[2px] bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
      
      <div className="w-full max-w-2xl">
        {/* Header - Texte plus lisible (Zinc-400) */}
        <div className="flex justify-between items-end mb-4 px-2">
          <span className="text-[10px] font-bold text-cyan-400 tracking-[0.5em] uppercase">v31.4_Rapture</span>
          <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-widest uppercase">
            Status // <span className={isRendering ? "text-amber-500" : "text-emerald-500"}>{status}</span>
          </span>
        </div>

        <div className="relative bg-zinc-900/40 border border-white/10 backdrop-blur-3xl rounded-3xl p-1 shadow-2xl">
          {/* Zone de saisie - Contraste renforcé */}
          <div className="bg-black/40 rounded-[1.4rem] p-6">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-48 bg-transparent border-none text-white text-xl font-light placeholder-zinc-700 focus:ring-0 resize-none p-0 leading-relaxed"
              placeholder="Injecter le script d'influence ici..."
            />
            
            {/* Heatmap avec couleurs plus vives */}
            <div className="flex gap-[1px] h-1.5 w-full bg-white/5 mt-6 rounded-full overflow-hidden">
              {getPredictiveHeatmap(input || " ").map((v, i) => (
                <div key={i} style={{ width: `${100/20}%`, opacity: (v/100) + 0.2 }} className="bg-cyan-400" />
              ))}
            </div>
          </div>

          <div className="p-4">
            <button 
              onClick={handleManifest}
              disabled={isRendering}
              className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all
                ${isRendering 
                  ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
                  : 'bg-white text-black hover:bg-cyan-400 active:scale-95'}`}
            >
              {isRendering ? 'Synchronisation...' : 'Lancer Manifestation'}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        {videoResult && (
          <div className="mt-8 animate-in zoom-in-95 duration-500">
            <div className="p-1 bg-gradient-to-b from-cyan-500/20 to-transparent rounded-3xl">
              <video src={videoResult} controls className="w-full rounded-[1.4rem] shadow-2xl" />
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 opacity-30">
        <p className="text-[9px] tracking-[1em] uppercase">User_Authorized: Drackk-20</p>
      </footer>
    </main>
  );
          }
