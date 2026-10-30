"use client";

import React from "react";
import { MessageSquare, ExternalLink, RefreshCw, Layers } from "lucide-react";

interface HeaderProps {
  onOpenCopilot: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ onOpenCopilot, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="border-b border-white/10 bg-obsidian-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Gestao Estrategica de Estoque & Ruptura
                <span className="text-xs px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono font-normal">
                  Motor D-Day
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Modelagem Star Schema em DuckDB + RN Intelligence Integrado
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://www.renannocelli.com.br/projetos/gestao-estoque#prototipo"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10"
          >
            <span>Ver Portfólio</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-slate-300 px-3 py-1.5 rounded-lg border border-white/10 bg-obsidian-850 hover:bg-obsidian-800 transition-colors disabled:opacity-50"
            title="Recarregar metricas"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={onOpenCopilot}
            className="relative flex items-center gap-2 text-xs font-medium text-white px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/40 hover:border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
            <span>RN Intelligence</span>
          </button>
        </div>
      </div>
    </header>
  );
}
