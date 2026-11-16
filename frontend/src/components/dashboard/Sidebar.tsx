"use client";

import React from "react";
import { Logo } from "@/components/ui/Logo";
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
  ExternalLink,
  Sun,
  Moon,
  Github,
  X,
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
  isMobileOpen?: boolean;
  setIsMobileOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  inventoryCount,
  suppliersCount,
  onOpenCopilot,
  isMobileOpen = false,
  setIsMobileOpen,
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
      label: "Matriz de Dispersão 4Q",
      shortLabel: "Dispersão",
      icon: Target,
      count: 120,
    },
    {
      id: "geo" as NavTab,
      label: "Malha Geográfica & Rotas",
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

  const handleSelectTab = (tabId: NavTab) => {
    setActiveTab(tabId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleOpenCopilot = () => {
    onOpenCopilot();
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop transparente/escurecido no Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen?.(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Menu Lateral: Retrátil completo no mobile (drawer) e fixo/recolhível no desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r dark:border-white/10 border-slate-200/80 dark:bg-obsidian-950/95 bg-white/95 backdrop-blur-2xl transition-all duration-300 ease-in-out shrink-0 select-none shadow-2xl md:shadow-none md:static md:h-screen md:sticky md:top-0 ${
          isMobileOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-[72px]" : "md:w-64"}`}
      >
        {/* Sidebar Header / Brand */}
        <div className="h-16 border-b dark:border-white/10 border-slate-200/80 px-4 flex items-center justify-between gap-3 shrink-0">
          {/* Versão Mobile do Header: Logo, Título e Botão Fechar X */}
          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Logo className="h-8 w-8" showGlow />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold font-mono tracking-wider uppercase dark:text-white text-slate-900 truncate">
                  D-Day Engine
                </span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono truncate">
                  RN Intelligence
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileOpen?.(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl dark:border-white/10 border-slate-200 border dark:bg-white/[0.03] bg-slate-100 dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Fechar menu"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Versão Desktop do Header: Expandir / Recolher */}
          <div className="hidden md:flex items-center justify-between w-full">
            {!isCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Logo className="h-8 w-8" showGlow />
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
                <Logo className="h-8 w-8" showGlow />
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className={`h-7 w-7 rounded-md border dark:border-white/10 border-slate-200 dark:bg-white/[0.03] bg-slate-100 hover:bg-slate-200/80 dark:hover:bg-white/10 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer ${
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
        </div>

        {/* Navigation Label */}
        <div className="px-4 pt-4 pb-2 text-[10px] font-mono uppercase tracking-wider dark:text-slate-500 text-slate-400 font-semibold md:block">
          <span className={isCollapsed ? "hidden md:hidden" : "block"}>
            Navegação Analítica
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-1.5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-xl md:rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? "dark:bg-cyan-500/15 bg-cyan-50/90 dark:border-cyan-500/30 border-cyan-300 dark:text-cyan-300 text-cyan-800 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold border"
                    : "dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent"
                } ${isCollapsed ? "md:justify-center justify-between" : "justify-between"}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? "text-cyan-500"
                        : "dark:text-slate-400 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                    }`}
                  />
                  {/* No mobile, o texto sempre aparece. No desktop, respeita o estado isCollapsed */}
                  <span className={`truncate ${isCollapsed ? "hidden md:hidden max-md:inline" : "inline"}`}>
                    {item.label}
                  </span>
                </div>

                {/* Badge de contagem */}
                {item.count !== null && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isCollapsed ? "hidden md:hidden max-md:inline" : "inline"
                    } ${
                      isActive
                        ? "dark:bg-cyan-400/20 bg-cyan-200/60 dark:text-cyan-200 text-cyan-900 border dark:border-cyan-400/30 border-cyan-300"
                        : "dark:bg-obsidian-850 bg-slate-100 dark:text-slate-400 text-slate-600 border dark:border-white/5 border-slate-200"
                    }`}
                  >
                    {item.count}
                  </span>
                )}

                {/* Indicador pontinho quando recolhido no desktop */}
                {isCollapsed && item.count !== null && (
                  <span className="hidden md:block absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
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
            type="button"
            onClick={handleOpenCopilot}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-all shadow-md hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 group cursor-pointer ${
              isCollapsed ? "md:justify-center justify-between" : "justify-between"
            }`}
            title="Abrir RN Intelligence"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <MessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              <span className={`font-semibold text-white tracking-wide truncate ${isCollapsed ? "hidden md:hidden max-md:inline" : "inline"}`}>
                RN Intelligence
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white shrink-0 ${isCollapsed ? "hidden md:hidden max-md:inline" : "inline"}`}>
              IA
            </span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t dark:border-white/10 border-slate-200/80 dark:bg-obsidian-900/60 bg-slate-50/80 shrink-0">
          {/* No mobile, sempre mostra a versão completa */}
          <div className={`flex items-center justify-between ${isCollapsed ? "md:hidden flex" : "flex"}`}>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 text-[11px] dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Alternar tema"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Modo Escuro</span>
                </>
              )}
            </button>

            <a
              href="https://github.com/Renanbritto/supply-chain-dday"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              title="Repositório no GitHub"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </a>
          </div>

          {/* Modo ícone compacto exclusivo para desktop quando isCollapsed = true */}
          {isCollapsed && (
            <div className="hidden md:flex flex-col items-center">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-indigo-600" />
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
