import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-comfortaa",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gestao Estrategica de Estoque, Ruptura & D-Day | RN Intelligence",
  description: "Ecossistema analitico de supply chain com motor preditivo D-Day e Copilot RN Intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`dark ${comfortaa.variable}`}>
      <body className={`${comfortaa.className} font-sans min-h-screen bg-obsidian-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}>
        {children}
      </body>
    </html>
  );
}
