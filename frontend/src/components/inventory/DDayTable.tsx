"use client";

import React, { useState } from "react";
import { Search, Filter, AlertCircle, Sparkles, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

interface InventoryItem {
  sku: string;
  nome: string;
  categoria: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  custo_unitario: number;
  preco_venda: number;
  margem_pct: number;
  estoque_disponivel: number;
  estoque_reservado: number;
  estoque_em_transito: number;
  valor_estoque_atual: number;
  cmd: number;
  estoque_seguranca: number;
  ponto_de_pedido: number;
  lead_time_medio: number;
  dias_cobertura: number;
  dias_para_dday: number;
  dday_data: string;
  status_urgencia: "RUPTURA" | "CRITICO" | "ATENCAO" | "NORMAL" | "EXCESSO";
  sugestao_compra_qtd: number;
  sugestao_compra_valor: number;
}

interface DDayTableProps {
  items: InventoryItem[];
  onDiagnoseSku: (sku: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function DDayTable({
  items,
  onDiagnoseSku,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
}: DDayTableProps) {
  const categories = ["ALL", "Hardware", "Armazenamento", "Redes", "Audio & Video", "Perifericos"];
  const statuses = ["ALL", "RUPTURA", "CRITICO", "ATENCAO", "NORMAL", "EXCESSO"];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RUPTURA":
        return <Badge variant="ruptura">RUPTURA (0 un)</Badge>;
      case "CRITICO":
        return <Badge variant="critico">CRITICO (D-Day Iminente)</Badge>;
      case "ATENCAO":
        return <Badge variant="atencao">ATENCAO</Badge>;
      case "NORMAL":
        return <Badge variant="normal">SAUDAVEL</Badge>;
      case "EXCESSO":
        return <Badge variant="excesso">SOBRE-ESTOQUE</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="obsidian-card rounded-xl overflow-hidden">
      {/* Controles de Filtros e Busca */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU, nome do produto ou fornecedor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-obsidian-850 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg bg-obsidian-850 border border-white/10 text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "Todas as Categorias" : c}
              </option>
            ))}
          </select>

          {/* Filtro de Status */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg bg-obsidian-850 border border-white/10 text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "Todos os Status" : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela Responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-obsidian-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-white/10">
            <tr>
              <th className="py-3 px-4">SKU / Produto</th>
              <th className="py-3 px-4">Categoria / Fornecedor</th>
              <th className="py-3 px-4 text-right">Estoque Fisico</th>
              <th className="py-3 px-4 text-right">CMD (un/dia)</th>
              <th className="py-3 px-4 text-right">Ponto Pedido (ROP)</th>
              <th className="py-3 px-4 text-right">Cobertura</th>
              <th className="py-3 px-4 text-center">Motor D-Day</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Sugestao Compra</th>
              <th className="py-3 px-4 text-center">Acao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans">
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  Nenhum SKU encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.sku}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {/* SKU e Produto */}
                  <td className="py-3 px-4">
                    <div className="font-mono text-cyan-400 font-semibold">
                      {item.sku}
                    </div>
                    <div className="text-white text-xs font-medium truncate max-w-[220px]">
                      {item.nome}
                    </div>
                  </td>

                  {/* Categoria e Fornecedor */}
                  <td className="py-3 px-4">
                    <div className="text-slate-300 text-xs font-medium">
                      {item.categoria}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                      {item.fornecedor_nome}
                    </div>
                  </td>

                  {/* Estoque Físico */}
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={item.estoque_disponivel === 0 ? "text-red-400 font-bold" : "text-white"}>
                      {formatNumber(item.estoque_disponivel)}
                    </span>
                    {item.estoque_em_transito > 0 && (
                      <div className="text-[10px] text-cyan-400 font-mono">
                        +{item.estoque_em_transito} transito
                      </div>
                    )}
                  </td>

                  {/* Consumo Médio Diário */}
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {item.cmd.toFixed(1)}
                  </td>

                  {/* ROP e Estoque de Segurança */}
                  <td className="py-3 px-4 text-right font-mono">
                    <div className="text-white font-medium">
                      {formatNumber(item.ponto_de_pedido)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      SS: {item.estoque_seguranca}
                    </div>
                  </td>

                  {/* Cobertura */}
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={item.dias_cobertura <= 5 ? "text-red-400 font-semibold" : "text-slate-300"}>
                      {item.dias_cobertura > 90 ? ">90d" : `${item.dias_cobertura}d`}
                    </span>
                  </td>

                  {/* Motor D-Day */}
                  <td className="py-3 px-4 text-center font-mono">
                    <div className="text-white text-xs font-semibold">
                      {formatDate(item.dday_data)}
                    </div>
                    <div className={`text-[10px] ${item.dias_para_dday <= 0 ? "text-red-400 font-bold" : item.dias_para_dday <= 5 ? "text-amber-400" : "text-slate-500"}`}>
                      {item.dias_para_dday <= 0 ? "HOJE (Atrasado)" : `em ${item.dias_para_dday} dias`}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(item.status_urgencia)}
                  </td>

                  {/* Sugestão de Compra */}
                  <td className="py-3 px-4 text-right font-mono">
                    {item.sugestao_compra_qtd > 0 ? (
                      <div>
                        <div className="text-cyan-400 font-semibold">
                          +{formatNumber(item.sugestao_compra_qtd)} un
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatCurrency(item.sugestao_compra_valor)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Ação: Copilot */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onDiagnoseSku(item.sku)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                      title="Diagnosticar causa-raiz no RN Intelligence"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Diagnosticar</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé da tabela com totais */}
      <div className="p-3 border-t border-white/10 bg-obsidian-900/50 flex items-center justify-between text-xs text-slate-400">
        <span>Exibindo {items.length} SKUs com parâmetros dinâmicos de D-Day</span>
        <span className="font-mono text-slate-500 text-[11px]">
          Fórmula D-Day: (Estoque Líquido - ROP) / CMD
        </span>
      </div>
    </div>
  );
}
