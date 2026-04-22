/**
 * AUDIO ENGINE v31 - NEURAL RAPTURE
 * Spatialisation binaurale et manipulation psycho-acoustique
 */

export const AUDIO_SETTINGS = {
  THETA_FREQ_L: 200,
  THETA_FREQ_R: 206, // Différence de 6Hz pour l'état de flow (Thêta)
  ROOM_TONE_VOL: 0.04,
  SUB_PULSE_FREQ: 38 // Tension nerveuse
};

/**
 * Prépare la chaîne de mastering de la voix (ElevenLabs / OpenAI)
 * Ajoute de la chaleur (200Hz) et une compression forte pour la clarté.
 */
export const masterVoice = (input: string) => {
  return `
    ${input},
    anequalizer=c0 f=200 g=3 t=1|c1 f=200 g=3 t=1,
    compand=0.3|0.3:1/-90/-90/-70/-70/-20/-20:6:0:-90:0.2,
    loudnorm
  `;
};

/**
 * Génère l'onde binaurale Thêta en arrière-plan
 */
export const generateThetaWave = (duration: number) => {
  return `sine=f=${AUDIO_SETTINGS.THETA_FREQ_L}:d=${duration},pan=stereo|c0=c0|c1=sine=f=${AUDIO_SETTINGS.THETA_FREQ_R}:d=${duration}`;
};

/**
 * Mixage complexe avec Sidechain :
 * La musique baisse de volume dès que la voix est détectée.
 */
export const generateMasterAudioMap = (voiceIdx: number, musicIdx: number, sfxIdx: number) => {
  return `
    [${voiceIdx}:a]asplit[v1][v2];
    [${musicIdx}:a][v2]sidechaincompress=threshold=0.1:ratio=20:attack=5:release=50[bg_ducked];
    [v1]volume=1.3[v_boosted];
    [${sfxIdx}:a]volume=0.2[sfx_low];
    [v_boosted][bg_ducked][sfx_low]amix=inputs=3:duration=first:dropout_transition=2[outa]
  `;
};

/**
 * Ajoute une présence physique (Room Tone) pour simuler un espace réel
 */
export const applyRoomPresence = (audioInput: string) => {
  return `${audioInput},aecho=0.8:0.88:6:0.4`;
};
