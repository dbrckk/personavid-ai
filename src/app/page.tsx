"use client";

import React, { useState, useEffect } from 'react';
import { getPredictiveHeatmap } from '../lib/retention-agent';
import { renderManifest } from '../lib/video-core';

export default function NeuralRapturePage() {
  const [input, setInput] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const heatmap = getPredictiveHeatmap(input || "IDLE");

  const handleManifest = async () => {
    setIsRendering(true);
    setVideoResult(null);
    
    try {
      // Simulation des URLs d'assets (à lier avec ton stockage plus tard)
      const mockAssets = {
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', 
        audioUrl: 'https://www.w3schools.com/html/horse.mp3'
      };

      const blob = await renderManifest(mockAssets);
      const url = URL.createObjectURL(blob);
      setVideoResult(url);
    } catch (err) {
      console.error("ERREUR_RENDU:", err);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-8 bg-[#020202]">
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      <div className="w-full max-w-2xl">
        {/* Terminal Section */}
        <div className="bg-zinc-900/20 border border-white/5 backdrop-blur-2xl rounded-[2rem] p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold text-cyan-500 tracking-[0.5em] uppercase">Rapture_Forge_v31</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
            </div>
          </div>

          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-40 bg-transparent border-none text-zinc-300 text-lg font-light placeholder-zinc-800 focus:ring-0 resize-none p-0"
            placeholder="Entrez les directives neuronales..."
          />

          <div className="flex gap-1 h-1 w-full bg-white/5 my-6">
            {heatmap.map((v, i) => (
              <div key={i} style={{ width: `${100/heatmap.length}%`, opacity: v/100 }} className="bg-cyan-500" />
            ))}
          </div>

          <button 
            onClick={handleManifest}
            disabled={isRendering}
            className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all 
              ${isRendering ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-black hover:bg-cyan-400 hover:scale-[1.01]'}`}
          >
            {isRendering ? 'Encodage en cours...' : 'Générer la manifestation'}
          </button>
        </div>

        {/* Preview Section - Apparaît dynamiquement */}
        {videoResult && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="relative group rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <video src={videoResult} controls className="w-full h-auto" />
              <a 
                href={videoResult} 
                download="rapture_output.mp4"
                className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white text-[10px] px-4 py-2 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all"
              >
                Exporter_Fichier
              </a>
            </div>
          </div>
        )}
      </div>

      <footer className="absolute bottom-6 flex gap-8">
        {['Memory_Safe', '4K_Ready', 'AES_256'].map(t => (
          <span key={t} className="text-[8px] text-zinc-700 uppercase tracking-widest">{t}</span>
        ))}
      </footer>
    </main>
  );
            }
