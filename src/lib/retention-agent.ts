/**
 * RETENTION AGENT v31 - NEURAL RAPTURE
 * Analyse sémantique et orchestration des stimuli
 */

export interface WordTiming {
  word: string;
  start: number;
  end: number;
  duration: number;
}

export const AGENT_PROMPT = `
  Rewrite this content for maximum ego-provocation and retention.
  - Use the "Forbidden Rule" technique.
  - Insert [BOOM] markers for psychological impacts.
  - Use short, punchy sentences (max 7 words).
  - Tone: Authority, Mystery, Direct.
`;

/**
 * Analyse le script et injecte des triggers de montage 
 * là où l'attention risque de chuter.
 */
export const calculateNeuroTriggers = (timings: WordTiming[]) => {
  return timings.map(t => {
    let effect = "NONE";
    let filter = "NORMAL";

    // Trigger : Phrase trop longue ou mot complexe
    if (t.duration > 700) {
      effect = "ZOOM_PUNCH_1.2";
      filter = "CHROMATIC_ABERRATION";
    }

    // Trigger : Marqueur de choc détecté
    if (t.word.includes("[BOOM]")) {
      effect = "RGB_SPLIT_FLASH";
      filter = "GLITCH_VIGNETTE";
    }

    return {
      ...t,
      action: effect,
      visualFilter: filter
    };
  });
};

/**
 * Calcule le score de rétention prédictif pour l'UI
 */
export const getPredictiveHeatmap = (script: string) => {
  const words = script.split(' ');
  return words.map((_, i) => {
    // Simule une analyse de densité de mots/vitesse
    return Math.sin(i * 0.5) * 50 + 50; 
  });
};

/**
 * Formate les sous-titres pour l'animation élastique (ASS Format)
 */
export const formatElasticSubtitles = (word: string, isStressed: boolean) => {
  const scale = isStressed ? 140 : 100;
  return `{\\fscx${scale}\\fscy${scale}\\b1}${word}{\\r}`;
};
