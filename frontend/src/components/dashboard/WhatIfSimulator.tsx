"use client";

import React, { useState } from "react";
import { runSimulation } from "@/lib/api";
import { Sliders, ArrowRight, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface WhatIfSimulatorProps {
  skus: Array<{ sku: string; nome: string; categoria: string }>;
}

export function WhatIfSimulator({ skus }: WhatIfSimulatorProps) {
  const [selectedSku, setSelectedSku] = useState(skus[0]?.sku || "SKU-1006");
  const [demandMultiplier, setDemandMultiplier] = useState(1.3);
  const [delayDays, setDelayDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const data = await runSimulation(selectedSku, demandMultiplier, delayDays);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="obsidian-card p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Simulador What-If de Ruptura & Sensibilidade
            </h3>
            <p className="text-xs text-slate-400">
              Teste o impacto de picos de consumo ou atrasos de entrega de fornecedores na data D-Day
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Seletor de SKU */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Selecionar SKU para Estudo
            </label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-lg bg-obsidian-850 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
            >
              {skus.map((s) => (
                <option key={s.sku} value={s.sku}>
                  {s.sku} - {s.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Variação de Demanda */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Variacao de Demanda: <span className="font-mono text-cyan-400">+{Math.round((demandMultiplier - 1) * 100)}%</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={demandMultiplier}
              onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
              className="w-full h-2 bg-obsidian-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>-50%</span>
              <span>Padrao (0%)</span>
              <span>+150%</span>
            </div>
          </div>

          {/* Atraso do Fornecedor */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Atraso no Fornecedor: <span className="font-mono text-amber-400">+{delayDays} dias</span>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={delayDays}
              onChange={(e) => setDelayDays(parseInt(e.target.value))}
              className="w-full h-2 bg-obsidian-800 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0 dias (no prazo)</span>
              <span>+10 dias</span>
              <span>+20 dias</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="flex items-center justify-center gap-2 text-xs font-semibold text-white px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{loading ? "Calculando..." : "Executar Simulacao What-If"}</span>
        </button>
      </div>

      {/* Resultado da Simulação */}
      {result && result.simulacao && (
        <div className="obsidian-card p-6 rounded-xl border-cyan-500/30">
          <h4 className="text-xs uppercase tracking-wider font-mono text-cyan-400 font-semibold mb-4">
            Resultado Comparativo: {result.nome} ({result.sku})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-obsidian-850 p-4 rounded-lg border border-white/5">
              <span className="text-[11px] text-slate-400">Consumo Medio Diario (CMD)</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-mono text-slate-400">{result.baseline.cmd} un</span>
                <ArrowRight className="h-3 w-3 text-cyan-400" />
                <span className="text-lg font-mono font-bold text-cyan-400">
                  {result.simulacao.cmd_simulado} un/dia
                </span>
              </div>
            </div>

            <div className="bg-obsidian-850 p-4 rounded-lg border border-white/5">
              <span className="text-[11px] text-slate-400">Lead Time Total</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-mono text-slate-400">{result.baseline.lead_time}d</span>
                <ArrowRight className="h-3 w-3 text-amber-400" />
                <span className="text-lg font-mono font-bold text-amber-400">
                  {result.simulacao.lead_time_simulado} dias
                </span>
              </div>
            </div>

            <div className="bg-obsidian-850 p-4 rounded-lg border border-white/5">
              <span className="text-[11px] text-slate-400">Ponto de Pedido (ROP)</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-mono text-slate-400">{result.baseline.ponto_de_pedido} un</span>
                <ArrowRight className="h-3 w-3 text-white" />
                <span className="text-lg font-mono font-bold text-white">
                  {result.simulacao.ponto_de_pedido_simulado} un
                </span>
              </div>
            </div>

            <div className="bg-obsidian-850 p-4 rounded-lg border border-white/5">
              <span className="text-[11px] text-slate-400">Impacto no D-Day</span>
              <div className="mt-2">
                <div className="text-lg font-mono font-bold text-rose-400">
                  {result.simulacao.diferenca_dias_dday < 0
                    ? `Antecipado em ${Math.abs(result.simulacao.diferenca_dias_dday)} dias`
                    : "Sem alteracao critica"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Nova cobertura estimada: {result.simulacao.dias_cobertura_simulada} dias
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
