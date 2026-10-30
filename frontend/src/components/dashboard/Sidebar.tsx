"use client";

import React from "react";
import {
  LayoutGrid,
  BarChart3,
  Truck,
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Layers,
  Database,
  ExternalLink,
} from "lucide-react";

export type NavTab = "inventory" | "abc" | "suppliers" | "whatif";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  inventoryCount: number;
  suppliersCount: number;
  onOpenCopilot: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  inventoryCount,
  suppliersCount,
  onOpenCopilot,
}: SidebarProps) {
  const navItems = [
    {
      id: "inventory" as NavTab,
      label: "Painel de Ruptura & D-Day",
      shortLabel: "D-Day",
      icon: LayoutGrid,
      count: inventoryCount,
    },
    {
      id: "abc" as NavTab,
      label: "Curva ABC & Pareto",
      shortLabel: "Curva ABC",
      icon: BarChart3,
      count: null,
    },
    {
      id: "suppliers" as NavTab,
      label: "SLA & Fornecedores",
      shortLabel: "Fornecedores",
      icon: Truck,
      count: suppliersCount,
    },
    {
      id: "whatif" as NavTab,
      label: "Simulador What-If",
      shortLabel: "What-If",
      icon: Sliders,
      count: null,
    },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 z-50 flex flex-col border-r border-white/10 bg-obsidian-950/95 backdrop-blur-2xl transition-all duration-300 ease-in-out shrink-0 select-none ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Sidebar Header / Brand */}
      <div className="h-16 border-b border-white/10 px-4 flex items-center justify-between gap-3">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold font-mono tracking-wider uppercase text-white truncate">
                D-Day Engine
              </span>
              <span className="text-[10px] text-cyan-400 font-mono truncate">
                RN Intelligence
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`h-7 w-7 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors ${
            isCollapsed ? "mx-auto mt-2" : ""
          }`}
          title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Label */}
      {!isCollapsed && (
        <div className="px-4 pt-5 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Navegacao Analitica
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
              } ${isCollapsed ? "justify-center" : "justify-between"}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {!isCollapsed && item.count !== null && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-cyan-400/20 text-cyan-200 border border-cyan-400/30"
                      : "bg-obsidian-850 text-slate-400 border border-white/5"
                  }`}
                >
                  {item.count}
                </span>
              )}

              {/* Indicador quando recolhido */}
              {isCollapsed && item.count !== null && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
            </button>
          );
        })}

        {/* Divisor */}
        <div className="pt-3 pb-1">
          <div className="h-px bg-white/10" />
        </div>

        {/* Atalho RN Intelligence Copilot */}
        <button
          onClick={onOpenCopilot}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent border border-cyan-500/30 hover:border-cyan-400/60 text-slate-200 hover:text-white ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
          title="Abrir RN Intelligence Copilot"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <Sparkles className="h-4 w-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-cyan-300">RN Intelligence</span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
              Copilot
            </span>
          )}
        </button>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-white/10 bg-obsidian-900/60">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-emerald-400" />
                DuckDB OLAP
              </span>
              <span className="text-emerald-400">Online</span>
            </div>
            <a
              href="https://www.renannocelli.com.br/projetos/gestao-estoque#prototipo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-200 transition-colors pt-1 border-t border-white/5"
            >
              <span>Ver Portfólio</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        ) : (
          <div className="flex justify-center" title="DuckDB OLAP Online">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
        )}
      </div>
    </aside>
  );
}
