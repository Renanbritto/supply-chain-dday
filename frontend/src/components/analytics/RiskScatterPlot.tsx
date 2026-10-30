"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Target, AlertTriangle, ShieldCheck, Clock, Layers, MessageSquare } from "lucide-react";

interface ScatterPoint {
  sku: string;
  nome: string;
  categoria: string;
  fornecedor: string;
  lead_time: number;
  faturamento_mensal: number;
  capital_estoque: number;
  cmd: number;
  dias_cobertura: number;
  dias_para_dday: number;
  classe_abc: "A" | "B" | "C";
  status: "RUPTURA" | "CRITICO" | "ATENCAO" | "NORMAL" | "EXCESSO";
  quadrante_id: "Q1" | "Q2" | "Q3" | "Q4";
  quadrante_nome: string;
  sugestao_compra_qtd: number;
  sugestao_compra_valor: number;
}

interface ScatterRiskMatrixProps {
  data: {
    total_pontos?: number;
    eixos?: {
      mediana_lead_time: number;
      mediana_faturamento: number;
    };
    pontos?: ScatterPoint[];
    quadrantes?: Record<
      string,
      {
        id: string;
        titulo: string;
        descricao: string;
        total_skus: number;
        capital_total: number;
        prioridade: string;
      }
    >;
  };
  onDiagnoseSku?: (sku: string) => void;
}

export function RiskScatterPlot({ data, onDiagnoseSku }: ScatterRiskMatrixProps) {
  const { theme } = useTheme();
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedAbc, setSelectedAbc] = useState<string>("ALL");
  const [highlightPoint, setHighlightPoint] = useState<ScatterPoint | null>(null);

  const points = data?.pontos || [];
  const eixos = data?.eixos || { mediana_lead_time: 10, mediana_faturamento: 25000 };
  const quadrantes = data?.quadrantes || {};

  // Filtra pontos
  const filteredPoints = points.filter((p) => {
    if (selectedQuadrant !== "ALL" && p.quadrante_id !== selectedQuadrant) return false;
    if (selectedCategory !== "ALL" && p.categoria.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (selectedAbc !== "ALL" && p.classe_abc !== selectedAbc) return false;
    return true;
  });

  const categories = ["ALL", "Hardware", "Armazenamento", "Redes", "Audio & Video", "Perifericos", "Energia"];

  const getColorByStatus = (status: string) => {
    switch (status) {
      case "RUPTURA":
        return "#EF4444"; // Vermelho
      case "CRITICO":
        return "#F59E0B"; // Ambar
      case "ATENCAO":
        return "#EAB308"; // Amarelo
      case "NORMAL":
        return "#10B981"; // Verde
      case "EXCESSO":
        return "#6366F1"; // Indigo
      default:
        return "#06B6D4"; // Ciano
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards dos 4 Quadrantes Estratégicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Q1: Estratégico / Alto Risco */}
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === "Q1" ? "ALL" : "Q1")}
          className={`obsidian-card p-4 rounded-xl text-left border-l-4 border-l-red-500 transition-all ${
            selectedQuadrant === "Q1" ? "ring-2 ring-red-500/50 bg-red-500/10" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-red-500 font-bold">
              Q1: Estrategico / Alto Risco
            </span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono dark:text-white text-slate-900">
              {quadrantes.Q1?.total_skus ?? 0}
            </span>
            <span className="text-[11px] text-red-500">SKUs criticos</span>
          </div>
          <p className="text-[10px] dark:text-slate-400 text-slate-500 mt-1 line-clamp-2">
            Alto faturamento & Lead time longo. Vulnerabilidade maxima a ruptura.
          </p>
          <div className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 mt-2">
            Capital: {formatCurrency(quadrantes.Q1?.capital_total ?? 0)}
          </div>
        </button>

        {/* Q2: Fluxo Contínuo / Alta Performance */}
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === "Q2" ? "ALL" : "Q2")}
          className={`obsidian-card p-4 rounded-xl text-left border-l-4 border-l-emerald-500 transition-all ${
            selectedQuadrant === "Q2" ? "ring-2 ring-emerald-500/50 bg-emerald-500/10" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-emerald-500 font-bold">
              Q2: Fluxo Continuo
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono dark:text-white text-slate-900">
              {quadrantes.Q2?.total_skus ?? 0}
            </span>
            <span className="text-[11px] text-emerald-500">SKUs eficientes</span>
          </div>
          <p className="text-[10px] dark:text-slate-400 text-slate-500 mt-1 line-clamp-2">
            Alto giro & Lead time agil. Maquinas de geracao de caixa operacional.
          </p>
          <div className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 mt-2">
            Capital: {formatCurrency(quadrantes.Q2?.capital_total ?? 0)}
          </div>
        </button>

        {/* Q3: Operação Rotineira */}
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === "Q3" ? "ALL" : "Q3")}
          className={`obsidian-card p-4 rounded-xl text-left border-l-4 border-l-cyan-500 transition-all ${
            selectedQuadrant === "Q3" ? "ring-2 ring-cyan-500/50 bg-cyan-500/10" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold">
              Q3: Operacao Rotineira
            </span>
            <Clock className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono dark:text-white text-slate-900">
              {quadrantes.Q3?.total_skus ?? 0}
            </span>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400">SKUs estaveis</span>
          </div>
          <p className="text-[10px] dark:text-slate-400 text-slate-500 mt-1 line-clamp-2">
            Baixo giro & reposicao rapida. Itens seguros com baixa necessidade de buffer.
          </p>
          <div className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 mt-2">
            Capital: {formatCurrency(quadrantes.Q3?.capital_total ?? 0)}
          </div>
        </button>

        {/* Q4: Cauda Longa / Obsolescência */}
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === "Q4" ? "ALL" : "Q4")}
          className={`obsidian-card p-4 rounded-xl text-left border-l-4 border-l-amber-500 transition-all ${
            selectedQuadrant === "Q4" ? "ring-2 ring-amber-500/50 bg-amber-500/10" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-amber-500 font-bold">
              Q4: Cauda Longa
            </span>
            <Target className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono dark:text-white text-slate-900">
              {quadrantes.Q4?.total_skus ?? 0}
            </span>
            <span className="text-[11px] text-amber-500">SKUs de atencao</span>
          </div>
          <p className="text-[10px] dark:text-slate-400 text-slate-500 mt-1 line-clamp-2">
            Baixo giro com lead time dilatado. Risco de capital estagnado no estoque.
          </p>
          <div className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 mt-2">
            Capital: {formatCurrency(quadrantes.Q4?.capital_total ?? 0)}
          </div>
        </button>
      </div>

      {/* Gráfico de Dispersão Super Populado */}
      <div className="obsidian-card p-6 rounded-xl transition-all">
        {/* Cabeçalho do Gráfico & Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b dark:border-white/10 border-slate-200">
          <div>
            <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
              Matriz Estrategica de Dispersao 4-Quadrantes ({filteredPoints.length} posicoes mapeadas)
            </h3>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
              Eixo X: Lead Time de Reposicao (Dias) | Eixo Y: Faturamento Mensal (R$) | Tamanho do Ponto: Capital Imobilizado
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de Quadrante */}
            <select
              value={selectedQuadrant}
              onChange={(e) => setSelectedQuadrant(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg dark:bg-obsidian-850 bg-white border dark:border-white/10 border-slate-300 dark:text-slate-300 text-slate-700 focus:outline-none"
            >
              <option value="ALL">Todos os Quadrantes</option>
              <option value="Q1">Q1: Alto Risco</option>
              <option value="Q2">Q2: Fluxo Continuo</option>
              <option value="Q3">Q3: Rotineiro</option>
              <option value="Q4">Q4: Cauda Longa</option>
            </select>

            {/* Filtro de Categoria */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg dark:bg-obsidian-850 bg-white border dark:border-white/10 border-slate-300 dark:text-slate-300 text-slate-700 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "Todas Categorias" : c}
                </option>
              ))}
            </select>

            {/* Filtro Curva ABC */}
            <div className="flex items-center rounded-lg border dark:border-white/10 border-slate-300 overflow-hidden text-xs">
              {["ALL", "A", "B", "C"].map((abc) => (
                <button
                  key={abc}
                  onClick={() => setSelectedAbc(abc)}
                  className={`px-2 py-1.5 font-mono ${
                    selectedAbc === abc
                      ? "bg-cyan-600 text-white font-bold"
                      : "dark:bg-obsidian-850 bg-white dark:text-slate-400 text-slate-600 hover:bg-slate-100 dark:hover:bg-obsidian-800"
                  }`}
                >
                  {abc === "ALL" ? "ABC" : abc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legenda de Cores por Status */}
        <div className="flex flex-wrap items-center gap-4 py-3 text-[11px] font-mono dark:text-slate-400 text-slate-600 border-b dark:border-white/5 border-slate-100">
          <span className="font-sans font-medium text-slate-500">Status Operacional:</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Ruptura
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Critico
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Atencao
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Saudavel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Excesso
          </span>
        </div>

        {/* Container do Scatter Chart */}
        <div className="h-96 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
              
              <XAxis
                type="number"
                dataKey="lead_time"
                name="Lead Time"
                unit="d"
                domain={[0, 32]}
                stroke={theme === "dark" ? "#64748B" : "#94A3B8"}
                fontSize={11}
                tickLine={false}
              />
              
              <YAxis
                type="number"
                dataKey="faturamento_mensal"
                name="Faturamento Mensal"
                tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                stroke={theme === "dark" ? "#64748B" : "#94A3B8"}
                fontSize={11}
                tickLine={false}
              />
              
              <ZAxis
                type="number"
                dataKey="capital_estoque"
                range={[30, 250]}
                name="Capital em Estoque"
              />

              {/* Linha de Referência da Mediana de Lead Time */}
              <ReferenceLine
                x={eixos.mediana_lead_time}
                stroke="#06B6D4"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Lead Time Mediano: ${eixos.mediana_lead_time}d`,
                  fill: "#06B6D4",
                  fontSize: 10,
                  position: "top",
                }}
              />

              {/* Linha de Referência da Mediana de Faturamento */}
              <ReferenceLine
                y={eixos.mediana_faturamento}
                stroke="#3B82F6"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Giro Mediano: ${formatCurrency(eixos.mediana_faturamento)}`,
                  fill: "#3B82F6",
                  fontSize: 10,
                  position: "right",
                }}
              />

              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as ScatterPoint;
                    return (
                      <div className="obsidian-drawer p-3.5 rounded-xl border dark:border-white/10 border-slate-200 text-xs shadow-xl space-y-1.5 max-w-[280px]">
                        <div className="font-bold text-cyan-500 font-mono flex items-center justify-between">
                          <span>{d.sku}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-sans">
                            Classe {d.classe_abc}
                          </span>
                        </div>
                        <div className="dark:text-white text-slate-900 font-medium truncate">
                          {d.nome}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {d.categoria} | {d.fornecedor}
                        </div>
                        <div className="pt-1.5 border-t dark:border-white/10 border-slate-200 grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 block">Lead Time:</span>
                            <span className="dark:text-white text-slate-800 font-semibold">{d.lead_time} dias</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Giro Mensal:</span>
                            <span className="dark:text-white text-slate-800 font-semibold">{formatCurrency(d.faturamento_mensal)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">D-Day:</span>
                            <span className={d.dias_para_dday <= 0 ? "text-red-500 font-bold" : "text-amber-500"}>
                              {d.dias_para_dday <= 0 ? "HOJE" : `${d.dias_para_dday} dias`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Capital:</span>
                            <span className="dark:text-white text-slate-800 font-semibold">{formatCurrency(d.capital_estoque)}</span>
                          </div>
                        </div>

                        {onDiagnoseSku && (
                          <button
                            onClick={() => onDiagnoseSku(d.sku)}
                            className="w-full mt-2 py-1 px-2 text-[10px] rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Diagnosticar no RN Intelligence</span>
                          </button>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Scatter data={filteredPoints} onClick={(node) => setHighlightPoint(node.payload)}>
                {filteredPoints.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColorByStatus(entry.status)}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth={0.5}
                    className="hover:scale-125 transition-transform cursor-pointer"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Rodapé com Insight Executivo */}
        <div className="mt-4 p-3 rounded-lg dark:bg-obsidian-850/60 bg-slate-100/80 border dark:border-white/5 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs dark:text-slate-400 text-slate-600 gap-2">
          <span>
            <strong>Interpretacao Executiva:</strong> SKUs concentrados no topo direito (Q1) exigem acordos de SLA blindados (VMI ou estoque consignado) para evitar perda de receita.
          </span>
          <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 shrink-0">
            {filteredPoints.length} SKUs renderizados
          </span>
        </div>
      </div>
    </div>
  );
}

