"use client";
import { useState } from 'react';
import { generateScript } from '@/lib/ai-engine';
import { createTikTokVideo } from '@/lib/video-core';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const runPipeline = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const subject = formData.get('subject') as string;
    const persona = formData.get('persona') as string;
    const time = formData.get('duration') as string;

    try {
      // 1. Script via Gemini
      const text = await generateScript(subject, persona, parseInt(time));
      
      // 2. Audio via ElevenLabs (Free tier)
      const voiceRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/ID_VOIX`, {
        method: 'POST',
        headers: { 'xi-api-key': 'TA_CLE_GRATUITE', 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" })
      });
      const audioBlob = await voiceRes.blob();

      // 3. Image via Pollinations (Gratuit)
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(subject)}?width=1080&height=1920&nologo=true`;

      // 4. Montage Final
      const finalVideo = await createTikTokVideo(audioBlob, imageUrl, parseInt(time));
      setVideoUrl(URL.createObjectURL(finalVideo));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-5 flex flex-col items-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
          PERSONA STUDIO AI
        </h1>
        
        <form onSubmit={runPipeline} className="space-y-4">
          <textarea name="subject" placeholder="Sujet de la vidéo..." className="w-full h-32 bg-zinc-900 border-none rounded-2xl p-4 focus:ring-2 ring-pink-500" required />
          
          <select name="persona" className="w-full bg-zinc-900 border-none rounded-xl p-3">
            <option value="seductive">Séductive</option>
            <option value="innocent">Innocente / Timide</option>
            <option value="dominant">Dominatrice</option>
          </select>

          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>27s</span>
            <span>Durée</span>
            <span>70s</span>
          </div>
          <input type="range" name="duration" min="27" max="70" className="w-full accent-pink-500" />

          <button disabled={loading} className="w-full py-4 bg-white text-black font-bold rounded-full hover:bg-pink-500 hover:text-white transition-all uppercase tracking-widest shadow-xl">
            {loading ? "Calcul en cours..." : "Générer Vidéo"}
          </button>
        </form>

        {videoUrl && (
          <div className="mt-8 flex flex-col items-center">
            <video src={videoUrl} controls className="w-[280px] h-[500px] rounded-3xl border-4 border-zinc-800 object-cover shadow-2xl" />
            <a href={videoUrl} download="tiktok_ai.mp4" className="mt-4 text-pink-500 font-bold underline">Télécharger l'original</a>
          </div>
        )}
      </div>
    </div>
  );
    }
