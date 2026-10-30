"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Search, MessageSquare, ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";
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

  // Referência do container com rolagem horizontal e suporte a arrastar com mouse
  const tableRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScrollState = useCallback(() => {
    if (!tableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, Math.round((scrollLeft / maxScroll) * 100))));
    } else {
      setScrollProgress(0);
    }
  }, []);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    updateScrollState();

    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [updateScrollState, items]);

  // Handlers para clique e arraste com mouse (Drag-to-Scroll)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("a")
    ) {
      return;
    }
    if (!tableRef.current) return;

    setIsMouseDown(true);
    setIsDragging(false);
    setStartX(e.pageX - tableRef.current.offsetLeft);
    setScrollLeftState(tableRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown || !tableRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      setIsDragging(true);
    }
    tableRef.current.scrollLeft = scrollLeftState - walk;
    updateScrollState();
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
    setTimeout(() => setIsDragging(false), 60);
  };

  const scrollByDirection = (dir: "left" | "right") => {
    if (!tableRef.current) return;
    const step = 340;
    tableRef.current.scrollBy({
      left: dir === "left" ? -step : step,
      behavior: "smooth",
    });
  };

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
    <div className="obsidian-card rounded-xl overflow-hidden transition-all shadow-lg">
      {/* Controles de Filtros, Busca e Navegação Horizontal */}
      <div className="p-4 border-b dark:border-white/10 border-slate-200/80 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU, nome do produto ou fornecedor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg dark:bg-obsidian-850 bg-white border dark:border-white/10 border-slate-300 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/70 shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg dark:bg-obsidian-850 bg-white border dark:border-white/10 border-slate-300 dark:text-slate-300 text-slate-700 focus:outline-none focus:border-cyan-500/70 shadow-sm"
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
            className="text-xs py-2 px-3 rounded-lg dark:bg-obsidian-850 bg-white border dark:border-white/10 border-slate-300 dark:text-slate-300 text-slate-700 focus:outline-none focus:border-cyan-500/70 shadow-sm"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "Todos os Status" : s}
              </option>
            ))}
          </select>

          {/* Controles de Navegação Horizontal e Dica UX */}
          <div className="flex items-center gap-1.5 pl-1 border-l dark:border-white/10 border-slate-200">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono dark:bg-cyan-500/10 bg-cyan-50 text-cyan-700 dark:text-cyan-300 border dark:border-cyan-500/20 border-cyan-200 select-none">
              <MoveHorizontal className="h-3.5 w-3.5 text-cyan-500 animate-pulse" />
              <span>Arraste ou role</span>
            </div>

            <div className="flex items-center gap-1 border dark:border-white/10 border-slate-200 rounded-lg p-0.5 dark:bg-obsidian-900 bg-slate-100">
              <button
                type="button"
                onClick={() => scrollByDirection("left")}
                disabled={!canScrollLeft}
                className={`p-1.5 rounded-md transition-all ${
                  canScrollLeft
                    ? "text-slate-700 dark:text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-500"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-30"
                }`}
                title="Rolar para esquerda"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 font-semibold text-cyan-600 dark:text-cyan-400">
                {scrollProgress}%
              </span>
              <button
                type="button"
                onClick={() => scrollByDirection("right")}
                disabled={!canScrollRight}
                className={`p-1.5 rounded-md transition-all ${
                  canScrollRight
                    ? "text-slate-700 dark:text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-500"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-30"
                }`}
                title="Rolar para direita"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Container com drag-to-scroll e sombras indicativas */}
      <div className="relative">
        {/* Sombra suave à esquerda quando houver rolagem */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-3 w-8 bg-gradient-to-r dark:from-obsidian-950/80 from-white/90 to-transparent z-10 transition-opacity" />
        )}

        {/* Sombra suave à direita quando houver mais conteúdo */}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-12 bg-gradient-to-l dark:from-obsidian-950/90 from-white/95 to-transparent z-10 flex items-center justify-end pr-1 transition-opacity">
            <span className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center shadow-md animate-pulse">
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        )}

        {/* Tabela com rolagem horizontal e arraste via mouse */}
        <div
          ref={tableRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`overflow-x-auto custom-horizontal-scrollbar pb-3 select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          title="Clique e arraste com o mouse para navegar horizontalmente"
        >
          <table className="w-full min-w-[1180px] text-left text-xs dark:text-slate-300 text-slate-700 border-collapse">
            <thead className="dark:bg-obsidian-900/95 bg-slate-100/95 dark:text-slate-400 text-slate-600 uppercase tracking-wider font-mono text-[10px] border-b dark:border-white/10 border-slate-200 sticky top-0 z-20 backdrop-blur-sm">
              <tr>
                <th className="py-3.5 pl-6 pr-4 whitespace-nowrap min-w-[240px]">SKU / Produto</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[190px]">Categoria / Fornecedor</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[120px]">Estoque Fisico</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[110px]">CMD (un/dia)</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[140px]">Ponto Pedido (ROP)</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[110px]">Cobertura</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Motor D-Day</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">Sugestao Compra</th>
                <th className="py-3.5 pl-4 pr-6 text-center whitespace-nowrap min-w-[130px]">Acao</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/5 divide-slate-200/70 font-sans">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Nenhum SKU encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.sku}
                    className="dark:hover:bg-white/[0.03] hover:bg-slate-100/60 transition-colors group"
                  >
                    {/* SKU e Produto (com padding à esquerda ampliado para nunca cortar o texto) */}
                    <td className="py-3.5 pl-6 pr-4">
                      <div className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold tracking-wide">
                        {item.sku}
                      </div>
                      <div className="dark:text-white text-slate-900 text-xs font-medium truncate max-w-[220px]" title={item.nome}>
                        {item.nome}
                      </div>
                    </td>

                    {/* Categoria e Fornecedor */}
                    <td className="py-3.5 px-4">
                      <div className="dark:text-slate-300 text-slate-800 text-xs font-medium">
                        {item.categoria}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[170px]" title={item.fornecedor_nome}>
                        {item.fornecedor_nome}
                      </div>
                    </td>

                    {/* Estoque Físico */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className={item.estoque_disponivel === 0 ? "text-red-500 font-bold" : "dark:text-white text-slate-900"}>
                        {formatNumber(item.estoque_disponivel)}
                      </span>
                      {item.estoque_em_transito > 0 && (
                        <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                          +{item.estoque_em_transito} transito
                        </div>
                      )}
                    </td>

                    {/* Consumo Médio Diário */}
                    <td className="py-3.5 px-4 text-right font-mono dark:text-slate-300 text-slate-700">
                      {item.cmd.toFixed(1)}
                    </td>

                    {/* ROP e Estoque de Segurança */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="dark:text-white text-slate-900 font-medium">
                        {formatNumber(item.ponto_de_pedido)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        SS: {item.estoque_seguranca}
                      </div>
                    </td>

                    {/* Cobertura */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className={item.dias_cobertura <= 5 ? "text-red-500 font-semibold" : "dark:text-slate-300 text-slate-700"}>
                        {item.dias_cobertura > 90 ? ">90d" : `${item.dias_cobertura}d`}
                      </span>
                    </td>

                    {/* Motor D-Day */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <div className="dark:text-white text-slate-900 text-xs font-semibold">
                        {formatDate(item.dday_data)}
                      </div>
                      <div className={`text-[10px] ${item.dias_para_dday <= 0 ? "text-red-500 font-bold" : item.dias_para_dday <= 5 ? "text-amber-500" : "text-slate-500"}`}>
                        {item.dias_para_dday <= 0 ? "HOJE (Atrasado)" : `em ${item.dias_para_dday} dias`}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(item.status_urgencia)}
                    </td>

                    {/* Sugestão de Compra */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      {item.sugestao_compra_qtd > 0 ? (
                        <div>
                          <div className="text-cyan-600 dark:text-cyan-400 font-semibold">
                            +{formatNumber(item.sugestao_compra_qtd)} un
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formatCurrency(item.sugestao_compra_valor)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Ação: Copilot */}
                    <td className="py-3.5 pl-4 pr-6 text-center">
                      <button
                        onClick={(e) => {
                          if (isDragging) {
                            e.stopPropagation();
                            return;
                          }
                          onDiagnoseSku(item.sku);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 px-2.5 py-1 rounded-md border dark:border-cyan-500/20 border-cyan-300 dark:bg-cyan-500/10 bg-cyan-50 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors shadow-sm"
                        title="Diagnosticar causa-raiz no RN Intelligence"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Diagnosticar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rodapé da tabela com totais e status UX */}
      <div className="p-3 border-t dark:border-white/10 border-slate-200/80 dark:bg-obsidian-900/50 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs dark:text-slate-400 text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span>Exibindo {items.length} SKUs com parâmetros dinâmicos de D-Day</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-cyan-600 dark:text-cyan-400 text-[11px]">
            Arraste com o mouse para navegar
          </span>
          <span className="font-mono text-slate-500 text-[11px] hidden md:inline">
            Fórmula D-Day: (Estoque Líquido - ROP) / CMD
          </span>
        </div>
      </div>
    </div>
  );
}
