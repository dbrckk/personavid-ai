export type SubtitleSegment = {
  id: string;
  text: string;
  start: number;
  end: number;
};

function splitIntoChunks(text: string) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

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

  if (current.length > 0) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

export function estimateDurationFromScript(script: string) {
  const words = String(script || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const estimated = Math.round((words / 155) * 60);

  return Math.max(25, Math.min(40, estimated || 30));
}

export function generateSubtitleSegments(
  script: string,
  estimatedDuration = estimateDurationFromScript(script)
): SubtitleSegment[] {
  const chunks = splitIntoChunks(script);

  if (chunks.length === 0) {
    return [];
  }

  const segmentDuration = estimatedDuration / chunks.length;

  return chunks.map((chunk, index) => {
    const start = Number((index * segmentDuration).toFixed(2));
    const end = Number(((index + 1) * segmentDuration).toFixed(2));

    return {
      id: `subtitle-${index}`,
      text: chunk,
      start,
      end,
    };
  });
  }
