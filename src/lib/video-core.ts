import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

async function loadFFmpegCore() {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  const ffmpeg = new FFmpeg();

  ffmpeg.on("log", ({ message }) => {
    console.log(`[FFMPEG] ${message}`);
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
  if (ffmpegInstance) return ffmpegInstance;

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

async function safeDelete(ffmpeg: FFmpeg, file: string) {
  try {
    await ffmpeg.deleteFile(file);
  } catch {
    // ignore cleanup errors
  }
}

function toBlobPart(data: Awaited<ReturnType<FFmpeg["readFile"]>>): BlobPart {
  if (typeof data === "string") {
    return new TextEncoder().encode(data).buffer;
  }

  const bytes = data as Uint8Array;
  return bytes.slice().buffer;
}

export async function renderManifest({
  videoUrl,
  audioUrl,
}: RenderManifestInput): Promise<Blob> {
  if (!videoUrl || typeof videoUrl !== "string") {
    throw new Error("Invalid videoUrl");
  }

  if (!audioUrl || typeof audioUrl !== "string") {
    throw new Error("Invalid audioUrl");
  }

  const ffmpeg = await getFFmpeg();

  const jobId = buildSafeId();

  const inputVideo = `input-video-${jobId}.mp4`;
  const inputAudio = `input-audio-${jobId}.mp3`;
  const outputVideo = `final-tiktok-${jobId}.mp4`;

  try {
    const [videoData, audioData] = await Promise.all([
      fetchFile(videoUrl),
      fetchFile(audioUrl),
    ]);

    await ffmpeg.writeFile(inputVideo, videoData);
    await ffmpeg.writeFile(inputAudio, audioData);

    await ffmpeg.exec([
      "-stream_loop",
      "-1",
      "-i",
      inputVideo,
      "-i",
      inputAudio,

      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",

      "-map",
      "0:v:0",
      "-map",
      "1:a:0",

      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",

      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "44100",

      "-shortest",
      "-movflags",
      "+faststart",

      outputVideo,
    ]);

    const data = await ffmpeg.readFile(outputVideo);

    return new Blob([toBlobPart(data)], {
      type: "video/mp4",
    });
  } catch (error: any) {
    console.error("VIDEO_CORE_RENDER_FAILED:", error);

    throw new Error(error?.message || "Failed to create final TikTok video");
  } finally {
    await safeDelete(ffmpeg, inputVideo);
    await safeDelete(ffmpeg, inputAudio);
    await safeDelete(ffmpeg, outputVideo);
  }
                    }
