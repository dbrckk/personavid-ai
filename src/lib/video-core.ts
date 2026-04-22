export async function renderManifest({
  videoUrl,
  audioUrl,
}: {
  videoUrl: string;
  audioUrl: string;
}) {
  if (!videoUrl || !audioUrl) {
    throw new Error("Missing media inputs");
  }

  // ⚠️ Ici normalement FFmpeg ou Remotion
  // pour l'instant on retourne la vidéo brute

  return videoUrl;
}
