"use client";

import React, { useState } from 'react';
// Chemin relatif direct pour éviter les erreurs d'alias @/
import { getPredictiveHeatmap } from '../lib/retention-agent';

export default function NeuralRapturePage() {
  const [input, setInput] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [retentionScore, setRetentionScore] = useState(99.1);
  
  // Analyse en temps réel du texte pour l'UI
  const heatmap = getPredictiveHeatmap(input || "Initialisation système...");

  const handleManifest = async () => {
    if (!input) return;
    setIsRendering(true);
    
    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          script: input,
          id: `proj_${Date.now()}`
        }),
      });
      
      if (response.ok) {
        console.log("Manifestation envoyée au noyau.");
      }
    } catch (err) {
      console.error("Rupture de transmission.");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-mono selection:bg-cyan-500 overflow-hidden text-white">
      
      {/* Radar de Rétention */}
      <div className="relative w-72 h-72 mb-16 group">
        <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-ping duration-[3s]"></div>
        <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
          <circle cx="144" cy="144" r="120" fill="transparent" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="2" />
          <circle
            cx="144" cy="144" r="120"
            fill="transparent"
            stroke="cyan"
            strokeWidth="2"
            strokeDasharray="753.6"
            strokeDashoffset={753.6 - (753.6 * retentionScore) / 100}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] text-cyan-500 tracking-[0.6em] mb-1 opacity-50 uppercase">Attention_Flux</span>
          <span className="text-4xl font-black italic">{retentionScore}%</span>
        </div>
      </div>

      {/* Terminal */}
      <div className="w-full max-w-2xl relative">
        <div className="bg-zinc-950/80 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent border-none text-xl font-light text-zinc-300 placeholder-zinc-800 focus:ring-0 mb-8 resize-none min-h-[160px]"
            placeholder="Injecte ton hook ici..."
          />
          
          <div className="flex gap-[2px] h-1 w-full bg-zinc-900 mb-8 rounded-full overflow-hidden">
            {heatmap.map((val, i) => (
              <div key={i} style={{ width: `${100/heatmap.length}%`, opacity: val/100 }} className="h-full bg-cyan-600" />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-[9px] text-zinc-600 uppercase tracking-tighter">
              v31.4_RAPTURE // <span className="text-emerald-500">Online</span>
            </div>
            <button 
              onClick={handleManifest}
              disabled={isRendering}
              className="group relative px-12 py-4 bg-white rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <span className="relative z-10 text-black font-black text-[10px] uppercase tracking-[0.3em]">
                {isRendering ? 'Processing...' : 'Manifest'}
              </span>
              <div className="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
        }
