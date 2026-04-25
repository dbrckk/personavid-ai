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

    if (current.length >= 4) {
      chunks.push(current.join(" "));
      current = [];
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

export function generateSubtitleSegments(
  script: string,
  estimatedDuration = 18
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

export function buildSubtitleOverlayCss() {
  return `
    .pv-subtitle {
      position: absolute;
      left: 50%;
      bottom: 12%;
      transform: translateX(-50%);
      width: 86%;
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      font-weight: 900;
      font-size: 42px;
      line-height: 1.05;
      color: white;
      text-transform: uppercase;
      letter-spacing: -1px;
      text-shadow:
        0 3px 0 #000,
        0 -3px 0 #000,
        3px 0 0 #000,
        -3px 0 0 #000,
        0 0 18px rgba(0,0,0,0.8);
      z-index: 20;
    }
  `;
}
