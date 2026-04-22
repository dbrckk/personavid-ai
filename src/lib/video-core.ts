import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

async function loadFFmpegCore() {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  const ffmpeg = new FFmpeg();

  ffmpeg.on("log", ({ message }) => {
    console.log(`[FFMPEG_CORE] ${message}`);
  });

  await ffmpeg.load({
    coreURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "application/javascript"
    ),
    wasmURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm"
    ),
  });

  return ffmpeg;
}

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (!ffmpegLoadingPromise) {
    ffmpegLoadingPromise = loadFFmpegCore()
      .then((instance) => {
        ffmpegInstance = instance;
        return instance;
      })
      .finally(() => {
        ffmpegLoadingPromise = null;
      });
  }

  return ffmpegLoadingPromise;
}

type RenderManifestInput = {
  videoUrl: string;
  audioUrl: string;
};

function buildSafeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function safeDelete(ffmpeg: FFmpeg, path: string) {
  try {
    await ffmpeg.deleteFile(path);
  } catch {
    // ignore
  }
}

export async function renderManifest({
  videoUrl,
  audioUrl,
}: RenderManifestInput): Promise<Blob> {
  if (!videoUrl || typeof videoUrl !== "string") {
    throw new Error("renderManifest: invalid videoUrl");
  }

  if (!audioUrl || typeof audioUrl !== "string") {
    throw new Error("renderManifest: invalid audioUrl");
  }

  const ffmpeg = await getFFmpeg();
  const jobId = buildSafeId();

  const inputVideo = `video-${jobId}.mp4`;
  const inputAudio = `audio-${jobId}.mp3`;
  const outputVideo = `output-${jobId}.mp4`;

  try {
    const videoData = await fetchFile(videoUrl);
    const audioData = await fetchFile(audioUrl);

    await ffmpeg.writeFile(inputVideo, videoData);
    await ffmpeg.writeFile(inputAudio, audioData);

    await ffmpeg.exec([
      "-i",
      inputVideo,
      "-i",
      inputAudio,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      "-shortest",
      outputVideo,
    ]);

    const data = await ffmpeg.readFile(outputVideo);

    return new Blob([data], { type: "video/mp4" });
  } catch (error: any) {
    console.error("renderManifest failed:", error);
    throw new Error(
      error?.message || "FFmpeg merge failed while creating final video"
    );
  } finally {
    await safeDelete(ffmpeg, inputVideo);
    await safeDelete(ffmpeg, inputAudio);
    await safeDelete(ffmpeg, outputVideo);
  }
      }
