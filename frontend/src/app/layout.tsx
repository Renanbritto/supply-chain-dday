import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-obsidian-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
