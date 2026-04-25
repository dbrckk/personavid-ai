export function getPredictiveHeatmap(text: string): number[] {
  const clean = String(text || "").trim();

  if (!clean) {
    return Array.from({ length: 20 }, () => 12);
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const lower = clean.toLowerCase();

  const strongWords = [
    "secret",
    "money",
    "argent",
    "danger",
    "truth",
    "vérité",
    "viral",
    "ai",
    "ia",
    "business",
    "discipline",
    "motivation",
    "result",
    "résultat",
    "mistake",
    "erreur",
    "power",
    "puissance",
  ];

  const emotionalWords = [
    "peur",
    "envie",
    "rêve",
    "douleur",
    "succès",
    "échec",
    "liberté",
    "riche",
    "fort",
    "faible",
    "honte",
    "fierté",
  ];

  let baseScore = 35;

  if (words.length >= 8) baseScore += 10;
  if (words.length >= 16) baseScore += 10;
  if (words.length > 35) baseScore -= 8;

  for (const word of strongWords) {
    if (lower.includes(word)) baseScore += 4;
  }

  for (const word of emotionalWords) {
    if (lower.includes(word)) baseScore += 3;
  }

  if (/[?!]/.test(clean)) baseScore += 8;
  if (/\d/.test(clean)) baseScore += 6;

  baseScore = Math.max(15, Math.min(92, baseScore));

  return Array.from({ length: 20 }, (_, index) => {
    const wave = Math.sin(index * 0.85) * 13;
    const hookBoost = index < 4 ? 18 - index * 3 : 0;
    const endingBoost = index > 15 ? (index - 15) * 3 : 0;
    const value = baseScore + wave + hookBoost + endingBoost;

    return Math.round(Math.max(8, Math.min(100, value)));
  });
}
