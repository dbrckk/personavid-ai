/**
 * SYSTEM CORE v31 - CONFIGURATION FINALE
 * Définit les limites de l'Overdrive et les accès API.
 */

export const RAPTURE_CORE = {
  VERSION: "31.4.0",
  COGNITIVE_DENSITY: 0.85, // Seuil de complexité du script
  MAX_RENDER_RESOLUTION: "1080x1920", // Format Vertical TikTok/Reels/Shorts
  ENCODING_PRESET: "slow", // Pour une qualité de grain maximale
  
  API_ENDPOINTS: {
    GEMINI_MODERATOR: process.env.GEMINI_API_KEY,
    ELEVEN_LABS: process.env.ELEVEN_LABS_KEY,
    PEXELS_SYNC: process.env.PEXELS_API_KEY
  },

  FEATURES: {
    SUBLIMINAL_INJECTION: true,
    THETA_WAVE_EMISSION: true,
    LIGHT_WRAP_SYNC: true
  }
};

/**
 * Gestionnaire d'erreurs fatal pour Drackk-20
 */
export const handleSystemRupture = (error: Error) => {
  console.error(`[CRITICAL_ERROR] Rupture de la chaîne neuronale: ${error.message}`);
  // Logique de repli sur un rendu safe en cas de surcharge
};
