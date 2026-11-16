"use client";

import React from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Compass } from "lucide-react";
import { NavTab } from "./Sidebar";

export interface NavTabMeta {
  id: NavTab;
  label: string;
  shortLabel: string;
  description: string;
}

export const NAV_TABS_ORDER: NavTabMeta[] = [
  {
    id: "inventory",
    label: "Painel de Ruptura & D-Day",
    shortLabel: "Painel D-Day",
    description: "Inventário com dias de cobertura (D-Day) e risco de ruptura",
  },
  {
    id: "scatter",
    label: "Matriz de Dispersão 4Q",
    shortLabel: "Matriz 4Q",
    description: "Classificação cruzada de risco D-Day vs Giro de estoque",
  },
  {
    id: "geo",
    label: "Malha Geográfica & Rotas",
    shortLabel: "Malha Geo",
    description: "Mapa logístico de distribuição e fornecedores em território nacional",
  },
  {
    id: "abc",
    label: "Curva ABC & Pareto",
    shortLabel: "Curva ABC",
    description: "Curva de Pareto de faturamento e criticidade de itens",
  },
  {
    id: "suppliers",
    label: "SLA & Fornecedores",
    shortLabel: "Fornecedores",
    description: "Desempenho de OTIF, lead time e pontualidade da cadeia",
  },
  {
    id: "whatif",
    label: "Simulador What-If",
    shortLabel: "What-If",
    description: "Simulação de variações de demanda e lead time em tempo real",
  },
];

interface PageNavigatorProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
}

export function PageNavigator({ activeTab, onNavigate }: PageNavigatorProps) {
  const currentIndex = NAV_TABS_ORDER.findIndex((t) => t.id === activeTab);
  const currentTab = NAV_TABS_ORDER[currentIndex] || NAV_TABS_ORDER[0];
  const prevTab = currentIndex > 0 ? NAV_TABS_ORDER[currentIndex - 1] : null;
  const nextTab =
    currentIndex < NAV_TABS_ORDER.length - 1
      ? NAV_TABS_ORDER[currentIndex + 1]
      : NAV_TABS_ORDER[0];
  const isLast = currentIndex === NAV_TABS_ORDER.length - 1;

  const handleGo = (tabId: NavTab) => {
    onNavigate(tabId);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label="Navegação entre páginas analíticas"
      className="obsidian-card p-4 sm:p-6 rounded-2xl border dark:border-white/10 border-slate-200/80 dark:bg-obsidian-900/70 bg-white/90 backdrop-blur-xl shadow-lg mt-8 transition-all"
    >
      <div className="flex flex-col gap-4">
        {/* Barra de Progresso das Páginas */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b dark:border-white/10 border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 shrink-0">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500 font-semibold block leading-tight">
                Navegação do Dashboard
              </span>
              <span className="text-xs sm:text-sm font-bold dark:text-white text-slate-900 font-mono">
                Página {currentIndex + 1} de {NAV_TABS_ORDER.length} • {currentTab.label}
              </span>
            </div>
          </div>

          {/* Indicadores de bolinha / passos */}
          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            {NAV_TABS_ORDER.map((item, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleGo(item.id)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? "w-7 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                      : "w-2.5 dark:bg-white/20 bg-slate-200 hover:bg-slate-300 dark:hover:bg-white/40"
                  }`}
                  title={`Ir para ${item.label}`}
                />
              );
            })}
          </div>
        </div>

        {/* Botões de Ação: Anterior e Próxima Página */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {prevTab ? (
            <button
              type="button"
              onClick={() => handleGo(prevTab.id)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border dark:border-white/10 border-slate-200 dark:bg-white/[0.03] bg-slate-100 hover:bg-slate-200/80 dark:hover:bg-white/10 dark:text-slate-300 text-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span>Anterior: {prevTab.shortLabel}</span>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <button
            type="button"
            onClick={() => handleGo(nextTab.id)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.98] transition-all cursor-pointer group"
          >
            <span>
              {isLast
                ? `Voltar ao Início: ${nextTab.shortLabel}`
                : `Próxima Página: ${nextTab.label}`}
            </span>
            {isLast ? (
              <RotateCcw className="h-4 w-4 shrink-0 group-hover:-rotate-90 transition-transform" />
            ) : (
              <ArrowRight className="h-4 w-4 shrink-0 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
