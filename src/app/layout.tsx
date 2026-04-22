/**
 * ROOT LAYOUT v31
 * Définit la structure HTML de base pour le déploiement Vercel
 */
import type { Metadata } from 'next'
import './globals.css' // Assure-toi que ce fichier existe ou crée un fichier vide

export const metadata: Metadata = {
  title: 'NEURAL RAPTURE v31',
  description: 'Cognitive Narrative Engine by Drackk-20',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-black antialiased">
        {children}
      </body>
    </html>
  )
}
