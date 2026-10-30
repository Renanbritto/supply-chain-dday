"use client";

import React from "react";
import { ExternalLink, RefreshCw, Github } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

interface HeaderProps {
  onOpenCopilot?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="border-b dark:border-white/10 border-slate-200/80 dark:bg-obsidian-950/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" showGlow />
            <div>
              <h1 className="text-xl font-bold tracking-tight dark:text-white text-slate-900 flex items-center gap-2">
                Gestao Estrategica de Estoque & Ruptura
                <span className="text-xs px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-mono font-normal">
                  Motor D-Day
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Alternador de Modo Claro / Escuro */}
          <ThemeToggle />

          <a
            href="https://github.com/Renanbritto/supply-chain-dday"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg border dark:border-white/5 border-slate-200 dark:bg-white/5 bg-slate-100 hover:bg-slate-200/70 dark:hover:bg-white/10"
            title="Repositório no GitHub"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs dark:text-slate-300 text-slate-700 px-3 py-1.5 rounded-lg border dark:border-white/10 border-slate-300 dark:bg-obsidian-850 bg-white hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors disabled:opacity-50 shadow-sm"
            title="Recarregar metricas"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
