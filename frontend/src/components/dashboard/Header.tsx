"use client";

import React from "react";
import { ExternalLink, RefreshCw, Github, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

interface HeaderProps {
  onOpenCopilot?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onToggleMobileMenu?: () => void;
}

export function Header({ onRefresh, isRefreshing, onToggleMobileMenu }: HeaderProps) {
  return (
    <header className="border-b dark:border-white/10 border-slate-200/80 dark:bg-obsidian-950/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Botão de Menu Retrátil no Mobile */}
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border dark:border-white/10 border-slate-200 dark:bg-white/[0.03] bg-slate-100 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs"
                title="Abrir menu de navegação"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <Logo className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" showGlow />

            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-bold tracking-tight dark:text-white text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="truncate">Gestão Estratégica de Estoque & Ruptura</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-mono font-normal whitespace-nowrap">
                  Motor D-Day
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
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
            className="flex items-center gap-1.5 text-xs dark:text-slate-300 text-slate-700 px-3 py-1.5 rounded-lg border dark:border-white/10 border-slate-300 dark:bg-obsidian-850 bg-white hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
            title="Recarregar métricas"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
