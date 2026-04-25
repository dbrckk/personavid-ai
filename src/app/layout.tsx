import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PersonaVid AI",
  description: "Generate ultra realistic TikTok videos with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-[#010101] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
