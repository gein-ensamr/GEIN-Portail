import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import { StudyDock } from "@/components/study-dock";

const orbitron = Orbitron({
  variable: "--font-hero",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GEIN — Portail Étudiant",
  description:
    "Portail étudiant premium pour la filière Génie Électrique et Industries Numériques. Ressources, spécialisations, stages, syllabus et communauté.",
  keywords: [
    "GEIN",
    "portail étudiant",
    "génie électrique",
    "ressources",
    "ISNM",
    "ISE",
    "ISEI",
    "syllabus",
  ],
  authors: [{ name: "Communauté GEIN" }],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "GEIN — Portail Étudiant",
    description:
      "Portail étudiant premium pour la filière GEIN. Ressources, spécialisations, stages, syllabus et communauté.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GEIN — Portail Étudiant",
    description:
      "Portail étudiant premium pour la filière GEIN. Ressources, spécialisations, stages, syllabus et communauté.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${orbitron.variable} ${rajdhani.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <StudyDock />
      </body>
    </html>
  );
}
