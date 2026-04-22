/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour permettre l'utilisation de SharedArrayBuffer (requis pour FFmpeg.wasm)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  
  // Optimisation du build pour la v31 "Neural-Rapture"
  typescript: {
    // Permet de déployer même s'il reste de petites alertes de types non critiques
    ignoreBuildErrors: false, 
  },
  eslint: {
    // Vérification rigoureuse avant la mise en ligne
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
