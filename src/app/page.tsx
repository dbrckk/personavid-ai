"use client";

import React, { useState } from 'react';
import { getPredictiveHeatmap } from '../lib/retention-agent';

export default function NeuralRapturePage() {
  const [input, setInput] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const score = 99.1;
  const heatmap = getPredictiveHeatmap(input || "SYSTEM IDLE...");

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 bg-[#030303]">
      <div className="scanline" />
      
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-4 px-2">
          <div>
            <h1 className="text-[10px] tracking-[0.4em] text-cyan-500/60 font-bold uppercase">Neural_Processor_v31</h1>
            <p className="text-2xl font-light tracking-tighter text-white">Status: <span className="font-medium">Active</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-600 uppercase">Retention_Probability</p>
            <p className="text-3xl font-black italic text-white leading-none">{score}%</p>
          </div>
        </div>

        {/* Main Terminal Box */}
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-b from-cyan-500/20 to-transparent rounded-3xl" />
          
          <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 neon-glow">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-48 bg-transparent border-none text-zinc-200 text-lg font-light placeholder-zinc-800 focus:ring-0 resize-none"
              placeholder="Injecter le script d'influence..."
            />

            {/* Heatmap Audio/Visuelle */}
            <div className="flex gap-[2px] h-1.5 w-full bg-zinc-950/50 rounded-full overflow-hidden my-6">
              {heatmap.map((val, i) => (
                <div 
                  key={i} 
                  style={{ width: `${100/heatmap.length}%`, height: '100%', opacity: val/100 }} 
                  className="bg-cyan-400 transition-all duration-500" 
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest">I/O_Streaming</span>
              </div>

              <button 
                onClick={() => setIsRendering(true)}
                disabled={isRendering}
                className="relative px-8 py-3 bg-white hover:bg-cyan-400 transition-colors rounded-full group overflow-hidden"
              >
                <span className="relative z-10 text-black font-bold text-[10px] uppercase tracking-widest">
                  {isRendering ? 'Processing...' : 'Manifest'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Data */}
        <div className="mt-8 grid grid-cols-3 gap-4 px-4">
          {[
            { label: 'Latency', val: '12ms' },
            { label: 'Sync', val: 'Neural' },
            { label: 'Core', val: 'Rapture' }
          ].map((stat, i) => (
            <div key={i} className="border-l border-zinc-800 pl-3">
              <p className="text-[8px] uppercase text-zinc-600">{stat.label}</p>
              <p className="text-xs font-medium text-zinc-400">{stat.val}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
