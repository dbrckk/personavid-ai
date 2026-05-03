export type SubtitleSegment = {
  id: string;
  text: string;
  start: number;
  end: number;
};

function cleanScript(script: string) {
  return String(script || "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoSubtitleChunks(script: string) {
  const clean = cleanScript(script);

  if (!clean) return [];

  const words = clean.split(" ");
  const chunks: string[] = [];

  let current: string[] = [];

  for (const word of words) {
    current.push(word);

    if (current.length >= 3) {
      chunks.push(current.join(" "));
      current = [];
    }
  }

  if (current.length) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

export function estimateDurationFromScript(script: string) {
  const words = cleanScript(script)
    .split(" ")
    .filter(Boolean).length;

  const estimatedSeconds = Math.round((words / 155) * 60);

  return Math.max(25, Math.min(40, estimatedSeconds || 30));
}

export function generateSubtitleSegments(
  script: string,
  estimatedDuration = estimateDurationFromScript(script)
): SubtitleSegment[] {
  const chunks = splitIntoSubtitleChunks(script);

  if (!chunks.length) return [];

  const segmentDuration = estimatedDuration / chunks.length;

  return chunks.map((text, index) => {
    const start = Number((index * segmentDuration).toFixed(2));
    const end = Number(((index + 1) * segmentDuration).toFixed(2));

    return {
      id: `subtitle-${index}`,
      text,
      start,
      end,
    };
  });
}
