/**
 * UI v31 "VOID-CONTROL"
 * Interface de déploiement de la Neural Rapture
 */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getPredictiveHeatmap } from '@/lib/retention-agent';

export default function NeuralRapturePage() {
  const [input, setInput] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [retentionScore, setRetentionScore] = useState(99.1);
  const heatmap = getPredictiveHeatmap(input || "Prompt initialisation...");

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-mono selection:bg-cyan-500 overflow-hidden">
      
      {/* Radar de Rétention Bio-Métrique */}
      <div className="relative w-72 h-72 mb-16 group">
        <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-ping duration-[3s]"></div>
        <div className="absolute inset-0 border border-cyan-500/5 rounded-full scale-150"></div>
        
        {/* Visualizer circulaire (SVG) */}
        <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
          <circle
            cx="144" cy="144" r="120"
            fill="transparent"
            stroke="rgba(6, 182, 212, 0.1)"
            strokeWidth="2"
          />
          <circle
            cx="144" cy="144" r="120"
            fill="transparent"
            stroke="cyan"
            strokeWidth="2"
            strokeDasharray="753.6"
            strokeDashoffset={753.6 - (753.6 * retentionScore) / 100}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] text-cyan-500 tracking-[0.6em] mb-1 opacity-50">ATTENTION_FLUX</span>
          <span className="text-4xl font-black text-white italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {retentionScore}%
          </span>
        </div>
      </div>

      {/* Terminal de Commande */}
      <div className="w-full max-w-2xl relative">
        <div className="absolute -top-6 left-10 text-[8px] text-zinc-700 tracking-[0.4em] uppercase">
          Neural_Input_Terminal // Drackk-20
        </div>
        
        <div className="bg-zinc-950/80 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent border-none text-xl font-light text-zinc-300 placeholder-zinc-800 focus:ring-0 mb-8 resize-none min-h-[160px] leading-relaxed"
            placeholder="Injecte ta pensée. L'algorithme fera le reste."
          />
          
          {/* Heatmap de Rétention Prédictive */}
          <div className="flex gap-[2px] h-1 w-full bg-zinc-900 mb-8 rounded-full overflow-hidden">
            {heatmap.map((val, i) => (
              <div 
                key={i} 
                style={{ width: `${100/heatmap.length}%`, opacity: val/100 }} 
                className={`h-full ${val < 40 ? 'bg-red-600 animate-pulse' : 'bg-cyan-600'}`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[7px] text-zinc-600 uppercase">Engine</span>
                <span className="text-[9px] text-zinc-400 font-bold tracking-tighter">v31.4_RAPTURE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] text-zinc-600 uppercase">Status</span>
                <span className="text-[9px] text-emerald-500 font-bold tracking-tighter uppercase">Ready</span>
              </div>
            </div>

            <button 
              onClick={() => setIsRendering(true)}
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

      <footer className="mt-16 text-[8px] text-zinc-800 uppercase tracking-[1.2em] font-bold">
        Drackk-20 // 2026 // Beyond Reality
      </footer>
    </div>
  );
                }
      
