"use client";

import React, { useState, useMemo } from "react";
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
import { Target, AlertTriangle, ShieldCheck, Clock, Layers, MessageSquare, Filter } from "lucide-react";

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
  tamanho_visual?: number;
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
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [highlightPoint, setHighlightPoint] = useState<ScatterPoint | null>(null);

  const rawPoints = data?.pontos || [];
  const eixos = data?.eixos || { mediana_lead_time: 12.2, mediana_faturamento: 284890.0 };
  const quadrantes = data?.quadrantes || {};

  // Paleta Executiva Moderna de Alta Visibilidade (Sem tons amarelados opacos)
  const STATUS_CONFIG = {
    RUPTURA: {
      color: "#FF1E56", // Crimson / Neon Red vibrante de alto contraste
      label: "Ruptura",
      badgeClass: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    },
    CRITICO: {
      color: "#FF7A00", // Deep Electric Orange (quente, diferente do amarelo)
      label: "Critico",
      badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    },
    ATENCAO: {
      color: "#FFD000", // Solar Amber / Ouro vibrante
      label: "Atencao",
      badgeClass: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    },
    NORMAL: {
      color: "#00D68F", // Mint Emerald Neon moderno
      label: "Saudavel",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    EXCESSO: {
      color: "#8B5CF6", // Electric Violet / Indigo
      label: "Excesso",
      badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    },
  };

  const getColorByStatus = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || "#06B6D4";
  };

  // Processa pontos com dispersão natural (evita sobreposição total de duplicatas) e calcula tamanho visual
  const processedPoints = useMemo(() => {
    return rawPoints.map((p, index) => {
      // Jitter pseudo-aleatório determinístico baseado no índice
      const seed = (index * 9301 + 49297) % 233280;
      const rnd1 = (seed / 233280.0 - 0.5) * 2; // -1 a +1
      const rnd2 = (((seed * 7) % 233280) / 233280.0 - 0.5) * 2;

      // Jitter para distribuir pontos duplicados de forma realista pela malha
      const ltJitter = index > 50 ? rnd1 * 2.2 : (p.status === "RUPTURA" ? rnd1 * 0.9 : 0);
      const fatJitter = index > 50 ? rnd2 * 0.16 : (p.status === "RUPTURA" ? rnd2 * 0.08 : 0);

      const leadTime = Math.max(2.5, Math.min(36.0, Number((p.lead_time + ltJitter).toFixed(1))));
      const faturamento = Math.max(8000, Number((p.faturamento_mensal * (1 + fatJitter)).toFixed(2)));

      // Cálculo de Tamanho Visual:
      // RUPTURA: como estoque é zero, calculamos o tamanho pelo risco/perda de faturamento,
      // garantindo que as bolhas vermelhas fiquem com excelente destaque visual!
      let tamanhoVisual = 80;
      if (p.status === "RUPTURA") {
        tamanhoVisual = Math.round(Math.max(140, Math.min(270, faturamento / 1800 + 120)));
      } else if (p.status === "CRITICO") {
        tamanhoVisual = Math.round(Math.max(70, Math.min(210, p.capital_estoque / 3500 + 65)));
      } else if (p.status === "NORMAL") {
        tamanhoVisual = Math.round(Math.max(60, Math.min(180, p.capital_estoque / 4000 + 55)));
      } else {
        tamanhoVisual = Math.round(Math.max(50, Math.min(160, p.capital_estoque / 4500 + 45)));
      }

      return {
        ...p,
        lead_time: leadTime,
        faturamento_mensal: faturamento,
        tamanho_visual: tamanhoVisual,
      };
    });
  }, [rawPoints]);

  // Contagem dinâmica por status para a legenda
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { RUPTURA: 0, CRITICO: 0, ATENCAO: 0, NORMAL: 0, EXCESSO: 0 };
    processedPoints.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return counts;
  }, [processedPoints]);

  // Filtra pontos com base nos controles
  const filteredPoints = useMemo(() => {
    return processedPoints.filter((p) => {
      if (selectedQuadrant !== "ALL" && p.quadrante_id !== selectedQuadrant) return false;
      if (selectedCategory !== "ALL" && p.categoria.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedAbc !== "ALL" && p.classe_abc !== selectedAbc) return false;
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;
      return true;
    });
  }, [processedPoints, selectedQuadrant, selectedCategory, selectedAbc, selectedStatus]);

  // ORDENAÇÃO DE CAMADA (Z-INDEX DO SVG):
  // Renderizamos os pontos menos urgentes primeiro e RUPTURA por ÚLTIMO,
  // garantindo que todas as bolhas vermelhas fiquem no topo absoluto da tela!
  const sortedRenderPoints = useMemo(() => {
    const priority: Record<string, number> = {
      NORMAL: 1,
      EXCESSO: 2,
      ATENCAO: 3,
      CRITICO: 4,
      RUPTURA: 5, // Camada superior
    };
    return [...filteredPoints].sort(
      (a, b) => (priority[a.status] || 0) - (priority[b.status] || 0)
    );
  }, [filteredPoints]);

  const categories = ["ALL", "Hardware", "Armazenamento", "Redes", "Audio & Video", "Perifericos", "Energia"];

  return (
    <div className="space-y-6">
      {/* Cards dos 4 Quadrantes Estratégicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Q1: Estratégico / Alto Risco */}
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === "Q1" ? "ALL" : "Q1")}
          className={`obsidian-card p-4 rounded-xl text-left border-l-4 border-l-red-500 transition-all ${
            selectedQuadrant === "Q1" ? "ring-2 ring-red-500/50 bg-red-500/10 shadow-lg" : ""
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
            selectedQuadrant === "Q2" ? "ring-2 ring-emerald-500/50 bg-emerald-500/10 shadow-lg" : ""
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
            selectedQuadrant === "Q3" ? "ring-2 ring-cyan-500/50 bg-cyan-500/10 shadow-lg" : ""
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
            selectedQuadrant === "Q4" ? "ring-2 ring-amber-500/50 bg-amber-500/10 shadow-lg" : ""
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
      <div className="obsidian-card p-6 rounded-xl transition-all shadow-lg">
        {/* Cabeçalho do Gráfico & Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b dark:border-white/10 border-slate-200">
          <div>
            <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
              Matriz Estrategica de Dispersao 4-Quadrantes ({filteredPoints.length} posicoes mapeadas)
            </h3>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
              Eixo X: Lead Time de Reposicao (Dias) | Eixo Y: Faturamento Mensal (R$) | Tamanho do Ponto: Relevancia & Risco
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
                  className={`px-2 py-1.5 font-mono transition-colors ${
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

        {/* Legenda Interativa com Filtro por Status Operacional */}
        <div className="flex flex-wrap items-center gap-2 py-3 text-[11px] font-mono border-b dark:border-white/5 border-slate-100">
          <span className="font-sans font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Status:
          </span>

          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`px-2.5 py-1 rounded-full transition-all text-xs border ${
              selectedStatus === "ALL"
                ? "dark:bg-white/15 bg-slate-900 text-white border-transparent font-bold shadow-sm"
                : "border-slate-300 dark:border-white/10 dark:text-slate-400 text-slate-600 hover:border-slate-400"
            }`}
          >
            Todos ({processedPoints.length})
          </button>

          {/* Botão Ruptura com destaque visual neon */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === "RUPTURA" ? "ALL" : "RUPTURA")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs border ${
              selectedStatus === "RUPTURA"
                ? "bg-rose-500 text-white border-rose-400 font-bold shadow-[0_0_12px_rgba(255,30,86,0.6)] scale-105"
                : "border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span>Ruptura ({statusCounts.RUPTURA})</span>
          </button>

          {/* Botão Crítico */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === "CRITICO" ? "ALL" : "CRITICO")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs border ${
              selectedStatus === "CRITICO"
                ? "bg-orange-500 text-white border-orange-400 font-bold shadow-sm scale-105"
                : "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span>Critico ({statusCounts.CRITICO})</span>
          </button>

          {/* Botão Atenção */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === "ATENCAO" ? "ALL" : "ATENCAO")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs border ${
              selectedStatus === "ATENCAO"
                ? "bg-amber-400 text-slate-900 border-amber-300 font-bold shadow-sm scale-105"
                : "border-amber-400/30 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Atencao ({statusCounts.ATENCAO})</span>
          </button>

          {/* Botão Saudável */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === "NORMAL" ? "ALL" : "NORMAL")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs border ${
              selectedStatus === "NORMAL"
                ? "bg-emerald-500 text-white border-emerald-400 font-bold shadow-sm scale-105"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Saudavel ({statusCounts.NORMAL})</span>
          </button>

          {/* Botão Excesso */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === "EXCESSO" ? "ALL" : "EXCESSO")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs border ${
              selectedStatus === "EXCESSO"
                ? "bg-purple-500 text-white border-purple-400 font-bold shadow-sm scale-105"
                : "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span>Excesso ({statusCounts.EXCESSO})</span>
          </button>
        </div>

        {/* Container do Scatter Chart */}
        <div className="h-[430px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />

              <XAxis
                type="number"
                dataKey="lead_time"
                name="Lead Time"
                unit="d"
                domain={[0, 38]}
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

              {/* ZAxis baseado em tamanho visual inteligente */}
              <ZAxis
                type="number"
                dataKey="tamanho_visual"
                range={[55, 230]}
                name="Relevancia & Risco"
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
                    const isRuptura = d.status === "RUPTURA";
                    return (
                      <div className="obsidian-drawer p-3.5 rounded-xl border dark:border-white/10 border-slate-200 text-xs shadow-2xl space-y-1.5 max-w-[280px]">
                        <div className="font-bold text-cyan-500 font-mono flex items-center justify-between">
                          <span>{d.sku}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-sans ${
                              isRuptura ? "bg-rose-500 text-white" : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300"
                            }`}
                          >
                            {isRuptura ? "EM RUPTURA" : `Classe ${d.classe_abc}`}
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
                            <span className="dark:text-white text-slate-800 font-semibold">
                              {formatCurrency(d.faturamento_mensal)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">D-Day:</span>
                            <span className={d.dias_para_dday <= 0 ? "text-rose-500 font-bold" : "text-amber-500"}>
                              {d.dias_para_dday <= 0 ? "HOJE (Atrasado)" : `${d.dias_para_dday} dias`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Capital Estoque:</span>
                            <span className="dark:text-white text-slate-800 font-semibold">
                              {d.capital_estoque === 0 ? "R$ 0,00 (Zerado)" : formatCurrency(d.capital_estoque)}
                            </span>
                          </div>
                        </div>

                        {onDiagnoseSku && (
                          <button
                            onClick={() => onDiagnoseSku(d.sku)}
                            className="w-full mt-2 py-1 px-2 text-[10px] rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center justify-center gap-1 transition-colors shadow-sm"
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

              <Scatter data={sortedRenderPoints} onClick={(node) => setHighlightPoint(node.payload)}>
                {sortedRenderPoints.map((entry, index) => {
                  const isRuptura = entry.status === "RUPTURA";
                  return (
                    <Cell
                      key={`cell-${entry.sku}-${index}`}
                      fill={getColorByStatus(entry.status)}
                      stroke={isRuptura ? "#FFFFFF" : "rgba(255,255,255,0.45)"}
                      strokeWidth={isRuptura ? 2.2 : 0.6}
                      style={{
                        filter: isRuptura ? "drop-shadow(0 0 6px rgba(255, 30, 86, 0.9))" : undefined,
                      }}
                      className="hover:scale-135 transition-transform cursor-pointer"
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Rodapé com Insight Executivo */}
        <div className="mt-4 p-3 rounded-lg dark:bg-obsidian-850/60 bg-slate-100/80 border dark:border-white/5 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs dark:text-slate-400 text-slate-600 gap-2">
          <span>
            <strong>Interpretacao Executiva:</strong> Os pontos vermelhos representam SKUs em <strong>Ruptura Imediata</strong>. Itens em Q1 (Alto Giro & Lead Time Dilatado) exigem intervenção emergencial de compras para conter perda de faturamento.
          </span>
          <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 shrink-0">
            {sortedRenderPoints.length} SKUs renderizados
          </span>
        </div>
      </div>
    </div>
  );
}
