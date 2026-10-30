"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme/ThemeProvider";

interface AbcData {
  items: Array<{
    sku: string;
    nome: string;
    categoria: string;
    faturamento_total: number;
    volume_total: number;
    margem_bruta_total: number;
    pct_faturamento: number;
    pct_acumulado_fat: number;
    classe_faturamento: "A" | "B" | "C";
    classe_volume: "A" | "B" | "C";
  }>;
  totais: {
    faturamento: number;
    volume: number;
    margem: number;
  };
  resumo: {
    A?: { skus_count: number; faturamento: number; pct_share: number };
    B?: { skus_count: number; faturamento: number; pct_share: number };
    C?: { skus_count: number; faturamento: number; pct_share: number };
  };
}

export function AbcChart({ data }: { data: AbcData }) {
  const { theme } = useTheme();

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="obsidian-card p-8 rounded-xl text-center dark:text-slate-500 text-slate-400">
        Carregando analise da Curva ABC...
      </div>
    );
  }

  // Prepara dados para o grafico de Pareto (Top 16 SKUs)
  const chartData = data.items.slice(0, 16).map((item) => ({
    name: item.sku,
    faturamento: item.faturamento_total,
    acumulado: item.pct_acumulado_fat,
    classe: item.classe_faturamento,
  }));

  const resumo = data.resumo;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo por Classe ABC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Classe A */}
        <div className="obsidian-card p-5 rounded-xl border-cyan-500/30 relative overflow-hidden transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-mono">
              Classe A (80% Faturamento)
            </span>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              {resumo.A?.skus_count ?? 0} SKUs ({Math.round(((resumo.A?.skus_count ?? 0) / data.items.length) * 100)}% catalogo)
            </Badge>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono dark:text-white text-slate-900">
              {formatCurrency(resumo.A?.faturamento ?? 0)}
            </div>
            <div className="text-xs dark:text-slate-400 text-slate-600 mt-1">
              Participacao: <strong className="text-cyan-600 dark:text-cyan-400">{resumo.A?.pct_share ?? 0}%</strong> da receita
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" />
        </div>

        {/* Classe B */}
        <div className="obsidian-card p-5 rounded-xl border-blue-500/30 relative overflow-hidden transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono">
              Classe B (15% Faturamento)
            </span>
            <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400">
              {resumo.B?.skus_count ?? 0} SKUs ({Math.round(((resumo.B?.skus_count ?? 0) / data.items.length) * 100)}% catalogo)
            </Badge>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono dark:text-white text-slate-900">
              {formatCurrency(resumo.B?.faturamento ?? 0)}
            </div>
            <div className="text-xs dark:text-slate-400 text-slate-600 mt-1">
              Participacao: <strong className="text-blue-600 dark:text-blue-400">{resumo.B?.pct_share ?? 0}%</strong> da receita
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Classe C */}
        <div className="obsidian-card p-5 rounded-xl border-purple-500/30 relative overflow-hidden transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider font-mono">
              Classe C (5% Faturamento)
            </span>
            <Badge variant="outline" className="border-purple-500/30 text-purple-600 dark:text-purple-400">
              {resumo.C?.skus_count ?? 0} SKUs ({Math.round(((resumo.C?.skus_count ?? 0) / data.items.length) * 100)}% catalogo)
            </Badge>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono dark:text-white text-slate-900">
              {formatCurrency(resumo.C?.faturamento ?? 0)}
            </div>
            <div className="text-xs dark:text-slate-400 text-slate-600 mt-1">
              Participacao: <strong className="text-purple-600 dark:text-purple-400">{resumo.C?.pct_share ?? 0}%</strong> da receita
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
        </div>
      </div>

      {/* Grafico Composto de Pareto */}
      <div className="obsidian-card p-6 rounded-xl transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-semibold dark:text-white text-slate-900 tracking-wide">
              Diagrama de Pareto & Concentracao de Faturamento (Top 16 SKUs)
            </h3>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
              Barras: Faturamento individual (R$) | Linha: Percentual acumulado (%)
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono dark:text-slate-400 text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500"></span> Classe A
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-500"></span> Classe B
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-purple-500"></span> Classe C
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} />
              <XAxis dataKey="name" stroke={theme === "dark" ? "#64748B" : "#94A3B8"} fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke={theme === "dark" ? "#64748B" : "#94A3B8"}
                fontSize={11}
                tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#06B6D4"
                fontSize={11}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#0B0F17" : "#FFFFFF",
                  borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  color: theme === "dark" ? "#F1F5F9" : "#0F172A",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                }}
                formatter={(value: any, name: string) => {
                  if (name === "faturamento") return [formatCurrency(Number(value)), "Faturamento"];
                  if (name === "acumulado") return [`${Number(value).toFixed(1)}%`, "% Acumulado"];
                  return [value, name];
                }}
              />
              <Bar yAxisId="left" dataKey="faturamento" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.classe === "A" ? "#06B6D4" : entry.classe === "B" ? "#3B82F6" : "#A855F7"}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="acumulado"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 3, fill: "#F59E0B" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
