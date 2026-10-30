"use client";

import React from "react";
import {
  LayoutGrid,
  Target,
  MapPin,
  BarChart3,
  Truck,
  Sliders,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Layers,
  Database,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export type NavTab = "inventory" | "scatter" | "geo" | "abc" | "suppliers" | "whatif";

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
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      id: "inventory" as NavTab,
      label: "Painel de Ruptura & D-Day",
      shortLabel: "D-Day",
      icon: LayoutGrid,
      count: inventoryCount,
    },
    {
      id: "scatter" as NavTab,
      label: "Matriz de Dispersao 4Q",
      shortLabel: "Dispersao",
      icon: Target,
      count: 120,
    },
    {
      id: "geo" as NavTab,
      label: "Malha Geografica & Rotas",
      shortLabel: "Malha Geo",
      icon: MapPin,
      count: 5,
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
      className={`h-screen sticky top-0 z-50 flex flex-col border-r dark:border-white/10 border-slate-200/80 dark:bg-obsidian-950/95 bg-white/95 backdrop-blur-2xl transition-all duration-300 ease-in-out shrink-0 select-none ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Sidebar Header / Brand */}
      <div className="h-16 border-b dark:border-white/10 border-slate-200/80 px-4 flex items-center justify-between gap-3">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold font-mono tracking-wider uppercase dark:text-white text-slate-900 truncate">
                D-Day Engine
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono truncate">
                RN Intelligence
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
              <Layers className="h-4 w-4" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`h-7 w-7 rounded-md border dark:border-white/10 border-slate-200 dark:bg-white/[0.03] bg-slate-100 hover:bg-slate-200/80 dark:hover:bg-white/10 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 flex items-center justify-center transition-colors ${
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
        <div className="px-4 pt-4 pb-2 text-[10px] font-mono uppercase tracking-wider dark:text-slate-500 text-slate-400 font-semibold">
          Navegacao Analitica
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-1.5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? "dark:bg-cyan-500/15 bg-cyan-50/90 dark:border-cyan-500/30 border-cyan-300 dark:text-cyan-300 text-cyan-800 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold border"
                  : "dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent"
              } ${isCollapsed ? "justify-center" : "justify-between"}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-cyan-500" : "dark:text-slate-400 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {!isCollapsed && item.count !== null && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "dark:bg-cyan-400/20 bg-cyan-200/60 dark:text-cyan-200 text-cyan-900 border dark:border-cyan-400/30 border-cyan-300"
                      : "dark:bg-obsidian-850 bg-slate-100 dark:text-slate-400 text-slate-600 border dark:border-white/5 border-slate-200"
                  }`}
                >
                  {item.count}
                </span>
              )}

              {/* Indicador quando recolhido */}
              {isCollapsed && item.count !== null && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
            </button>
          );
        })}

        {/* Divisor */}
        <div className="pt-2 pb-1">
          <div className="h-px dark:bg-white/10 bg-slate-200" />
        </div>

        {/* Atalho RN Intelligence */}
        <button
          onClick={onOpenCopilot}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative dark:bg-gradient-to-r dark:from-cyan-500/10 dark:via-blue-500/10 dark:to-transparent bg-cyan-50/80 border dark:border-cyan-500/30 border-cyan-200 hover:border-cyan-400/60 dark:text-slate-200 text-slate-800 hover:text-slate-900 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
          title="Abrir RN Intelligence"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <MessageSquare className="h-4 w-4 text-cyan-500 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping" />
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-cyan-700 dark:text-cyan-300">RN Intelligence</span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded dark:bg-cyan-400/20 bg-cyan-200/70 dark:text-cyan-200 text-cyan-900 border dark:border-cyan-400/30 border-cyan-300">
              Chat
            </span>
          )}
        </button>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t dark:border-white/10 border-slate-200/80 dark:bg-obsidian-900/60 bg-slate-50/80 space-y-2">
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between text-[11px] dark:text-slate-400 text-slate-600 font-mono">
              <span className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-emerald-500" />
                DuckDB OLAP (61k logs)
              </span>
              <span className="text-emerald-500 font-semibold">Online</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t dark:border-white/5 border-slate-200">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 text-[10px] dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                title="Alternar tema"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-3 w-3 text-amber-400" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3 w-3 text-indigo-600" />
                    <span>Modo Escuro</span>
                  </>
                )}
              </button>

              <a
                href="https://www.renannocelli.com.br/projetos/gestao-estoque#prototipo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <span>Portfólio</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-indigo-600" />
              )}
            </button>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.8)]" title="DuckDB Online" />
          </div>
        )}
      </div>
    </aside>
  );
}
