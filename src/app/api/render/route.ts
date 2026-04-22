import { NextResponse } from 'next/server';
import { generateNeuralScript } from '@/lib/ai-engine';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Input requis" }, { status: 400 });
    }

    // Appel réel à Gemini
    const config = await generateNeuralScript(prompt);

    // Ici, on définit tes vrais assets basés sur l'analyse de l'IA
    // Pour l'instant, on lie tes fichiers de référence
    const assets = {
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // À remplacer par tes MP4 sur S3/Vercel Blob
      audioUrl: 'https://www.w3schools.com/html/horse.mp3',   // À remplacer par tes MP3
      config: config
    };

    return NextResponse.json(assets);
  } catch (error) {
    console.error("ERREUR_API_ROUTE:", error);
    return NextResponse.json({ error: "Échec du traitement neural" }, { status: 500 });
  }
}
