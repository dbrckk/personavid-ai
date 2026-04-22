import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * VIDEO CORE ENGINE v31 - NEURAL RAPTURE
 * Moteur de rendu client-side haute performance.
 */

// Instance unique pour éviter les fuites de mémoire
let ffmpegInstance: FFmpeg | null = null;

export const getFFmpeg = async () => {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  
  // Chargement des ressources distantes via CDN pour alléger le bundle Vercel
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'application/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
};

/**
 * Exécute le montage final de la v31
 * @param script - Les instructions de montage calculées par l'orchestrateur
 */
export async function renderManifest(assets: { videoUrl: string, audioUrl: string, script: string }) {
  const ffmpeg = await getFFmpeg();

  // Écriture des fichiers dans le système de fichiers virtuel de FFmpeg
  await ffmpeg.writeFile('input_video.mp4', await fetchFile(assets.videoUrl));
  await ffmpeg.writeFile('input_audio.mp3', await fetchFile(assets.audioUrl));

  // Commande de fusion basique (extensible avec tes filtres visual-engine)
  // On synchronise la durée sur la piste audio
  await ffmpeg.exec([
    '-i', 'input_video.mp4',
    '-i', 'input_audio.mp3',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-shortest',
    'output.mp4'
  ]);

  // LECTURE ET EXPORTATION (Fix pour Vercel)
  const data = await ffmpeg.readFile('output.mp4');
  
  /**
   * CRITICAL FIX: Le 'as any' est obligatoire ici car TypeScript
   * détecte un SharedArrayBuffer alors que le constructeur Blob 
   * attend un BlobPart standard.
   */
  return new Blob([data as any], { type: 'video/mp4' });
}

/**
 * Nettoyage du système de fichiers virtuel
 */
export async function clearFS() {
  const ffmpeg = await getFFmpeg();
  await ffmpeg.deleteFile('input_video.mp4');
  await ffmpeg.deleteFile('input_audio.mp3');
  await ffmpeg.deleteFile('output.mp4');
}
