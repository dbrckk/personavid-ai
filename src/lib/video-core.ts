import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

export async function createTikTokVideo(audioBlob: Blob, imageUrl: string, duration: number) {
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: await toBlobURL(`/ffmpeg-core.js`, 'application/javascript'),
      wasmURL: await toBlobURL(`/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }

  // Ecriture des fichiers dans le système virtuel FFmpeg
  await ffmpeg.writeFile('audio.mp3', await fetchFile(audioBlob));
  await ffmpeg.writeFile('bg.jpg', await fetchFile(imageUrl));
  await ffmpeg.writeFile('ambient.mp3', await fetchFile('/ambient-loop.mp3'));

  // Commande FFmpeg : 
  // - Boucle l'image
  // - Mixe la voix (fort) et l'ambiance (très léger)
  // - Format 9:16 (TikTok)
  await ffmpeg.exec([
    '-loop', '1', '-i', 'bg.jpg',
    '-i', 'audio.mp3',
    '-i', 'ambient.mp3',
    '-filter_complex', '[2:a]volume=0.1[bg];[1:a][bg]amix=inputs=2:duration=first',
    '-c:v', 'libx264', '-t', `${duration}`, '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
    '-pix_fmt', 'yuv420p', 'output.mp4'
  ]);

  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data], { type: 'video/mp4' });
}
