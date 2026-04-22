import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

export const getFFmpeg = async () => {
  if (ffmpegInstance) return ffmpegInstance;
  const ffmpeg = new FFmpeg();
  
  // LOGS POUR L'ADMIN (Toi)
  ffmpeg.on('log', ({ message }) => {
    console.log(`[FFMPEG_CORE]: ${message}`);
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'application/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
};

export async function renderManifest(assets: { videoUrl: string, audioUrl: string }) {
  const ffmpeg = await getFFmpeg();

  // Écriture rapide
  await ffmpeg.writeFile('v_in.mp4', await fetchFile(assets.videoUrl));
  await ffmpeg.writeFile('a_in.mp3', await fetchFile(assets.audioUrl));

  // Encodage optimisé pour le Web (Faststart pour lecture immédiate)
  await ffmpeg.exec([
    '-i', 'v_in.mp4',
    '-i', 'a_in.mp3',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-movflags', '+faststart',
    '-shortest',
    'out.mp4'
  ]);

  const data = await ffmpeg.readFile('out.mp4');
  return new Blob([data as any], { type: 'video/mp4' });
}
