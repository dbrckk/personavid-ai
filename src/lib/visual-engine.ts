/**
 * VISUAL ENGINE v31 - NEURAL RAPTURE
 * Gère la fusion photométrique et l'harmonisation temporelle
 */

export const VISUAL_CONFIG = {
  GRAIN_INTENSITY: 12,
  CHROMA_ABERRATION: 0.02,
  LUT_BRIGHTNESS: 0.02,
  LUT_CONTRAST: 1.1
};

/**
 * Applique le "Light Wrap" : Projette les couleurs du fond sur les bords du sujet IA
 * pour supprimer l'effet "découpage".
 */
export const generateLightWrapFilter = (iaInput: string, brollInput: string) => {
  return `
    [${iaInput}][${brollInput}]maskedmerge,
    boxblur=20,
    curves=all='0/0 0.5/0.45 1/1',
    [${iaInput}]overlay=format=auto[v_composite]
  `;
};

/**
 * Unifie la texture de l'image pour masquer les différences de source.
 * Ajoute du grain de film 35mm et stabilise l'exposition.
 */
export const applyMasterGrade = (input: string) => {
  const cinematicLUT = `eq=brightness=${VISUAL_CONFIG.LUT_BRIGHTNESS}:contrast=${VISUAL_CONFIG.LUT_CONTRAST}:saturation=1.05`;
  const filmGrain = `noise=alls=${VISUAL_CONFIG.GRAIN_INTENSITY}:allf=t+u`;
  const motionBlur = `minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc`;

  return `${input},${cinematicLUT},${filmGrain},${motionBlur}`;
};

/**
 * Injecte des micro-tremblements de caméra (Perlin Noise) pour simuler 
 * une capture humaine au smartphone.
 */
export const generateOrganicMotion = (input: string) => {
  return `[${input}]zoompan=z='1.05':d=1:x='iw/2-(iw/zoom/2)+2*sin(it*2)':y='ih/2-(ih/zoom/2)+1.5*cos(it*1.5)'`;
};

/**
 * Injection Subliminale : Flash de 1/60e de seconde toutes les 2 secondes
 */
export const injectGhostFrame = (input: string, overlayImg: string) => {
  return `[${input}][${overlayImg}]overlay=enable='eq(mod(n,120),0)':opacity=0.15`;
};
