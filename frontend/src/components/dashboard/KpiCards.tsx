"use client";

import React from "react";
import { AlertTriangle, TrendingDown, DollarSign, Truck, Package } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface KpiCardsProps {
  summary: {
    total_skus?: number;
    total_rupturas?: number;
    total_criticos?: number;
    total_atencao?: number;
    taxa_ruptura_pct?: number;
    capital_total_estoque?: number;
    perda_diaria_estimada_ruptura?: number;
    otif_global_fornecedores?: number;
  };
}

export function KpiCards({ summary }: KpiCardsProps) {
  const taxaRuptura = summary.taxa_ruptura_pct ?? 0;
  const otifGlobal = summary.otif_global_fornecedores ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Taxa de Ruptura */}
      <div className="obsidian-card p-5 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Taxa de Ruptura</span>
          <div className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {taxaRuptura.toFixed(1)}%
          </span>
          <span className="text-xs text-red-400 font-medium">
            {summary.total_rupturas ?? 0} SKUs zerados
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Itens com demanda ativa sem saldo fisico
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500/50 to-transparent" />
      </div>

      {/* 2. SKUs em Risco Iminente */}
      <div className="obsidian-card p-5 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Risco Iminente (D-Day)</span>
          <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {(summary.total_rupturas ?? 0) + (summary.total_criticos ?? 0)}
          </span>
          <span className="text-xs text-slate-400">
            de {summary.total_skus ?? 0} catalogados
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {summary.total_criticos ?? 0} SKUs atingiram o Ponto de Pedido
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent" />
      </div>

      {/* 3. Perda Diária Estimada */}
      <div className="obsidian-card p-5 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Perda Diaria Ruptura</span>
          <div className="h-7 w-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-mono tracking-tight text-rose-400">
            {formatCurrency(summary.perda_diaria_estimada_ruptura ?? 0)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Receita potencial nao capturada hoje
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500/50 to-transparent" />
      </div>

      {/* 4. OTIF Global Fornecedores */}
      <div className="obsidian-card p-5 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">OTIF de Fornecedores</span>
          <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Truck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono tracking-tight ${otifGlobal >= 90 ? "text-emerald-400" : otifGlobal >= 80 ? "text-amber-400" : "text-red-400"}`}>
            {otifGlobal.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">Meta: 95%</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Pontualidade e integridade combinadas
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" />
      </div>

      {/* 5. Capital em Estoque */}
      <div className="obsidian-card p-5 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Capital Imobilizado</span>
          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Package className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {formatCurrency(summary.capital_total_estoque ?? 0)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Valor a preco de custo no CD
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent" />
      </div>
    </div>
  );
}
