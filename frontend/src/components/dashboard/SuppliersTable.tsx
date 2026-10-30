"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

interface SupplierItem {
  fornecedor_id: string;
  nome: string;
  categoria: string;
  lead_time_acordado: number;
  lead_time_real: number;
  gap_lead_time_dias: number;
  variabilidade_lead_time: number;
  total_pedidos: number;
  pedidos_entregues: number;
  pedidos_em_transito: number;
  on_time_pct: number;
  in_full_pct: number;
  otif_pct: number;
  status_sla: "EXCELENTE" | "REGULAR" | "CRITICO";
}

interface SuppliersTableProps {
  suppliers: SupplierItem[];
  otifGlobal: number;
}

export function SuppliersTable({ suppliers, otifGlobal }: SuppliersTableProps) {
  const getSlaBadge = (status: string) => {
    switch (status) {
      case "EXCELENTE":
        return <Badge variant="normal">SLA EXCELENTE</Badge>;
      case "REGULAR":
        return <Badge variant="atencao">SLA REGULAR</Badge>;
      case "CRITICO":
        return <Badge variant="ruptura">RISCO CRITICO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner Informativo OTIF */}
      <div className="obsidian-card p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-cyan-500 transition-all">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold dark:text-white text-slate-900">
              Controle de Confiabilidade & SLA de Fornecedores
            </h4>
            <p className="text-xs dark:text-slate-400 text-slate-500">
              Auditagem de prazos de entrega (On-Time) e quantidades faturadas (In-Full)
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-2 dark:bg-obsidian-850 bg-slate-100 px-4 py-2 rounded-lg border dark:border-white/10 border-slate-200">
          <span className="text-xs dark:text-slate-400 text-slate-600 font-mono">OTIF Global:</span>
          <span className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400">
            {otifGlobal.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Tabela de Fornecedores */}
      <div className="obsidian-card rounded-xl overflow-hidden transition-all shadow-lg">
        <div className="overflow-x-auto custom-horizontal-scrollbar pb-2">
          <table className="w-full min-w-[980px] text-left text-xs dark:text-slate-300 text-slate-700">
            <thead className="dark:bg-obsidian-900/90 bg-slate-100/90 dark:text-slate-400 text-slate-600 uppercase tracking-wider font-mono text-[10px] border-b dark:border-white/10 border-slate-200">
              <tr>
                <th className="py-3.5 pl-6 pr-4 whitespace-nowrap min-w-[200px]">Fornecedor</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">Categoria Principal</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">LT Acordado</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">LT Real Medio</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">Desvio (Gap)</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">On-Time %</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">In-Full %</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">OTIF %</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Status SLA</th>
                <th className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap min-w-[120px]">Pedidos</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/5 divide-slate-200/70 font-sans">
              {suppliers.map((f) => (
                <tr key={f.fornecedor_id} className="dark:hover:bg-white/[0.03] hover:bg-slate-100/60 transition-colors">
                  <td className="py-3.5 pl-6 pr-4">
                    <div className="dark:text-white text-slate-900 font-medium">{f.nome}</div>
                    <div className="font-mono text-[10px] text-slate-500">{f.fornecedor_id}</div>
                  </td>
                  <td className="py-3.5 px-4 dark:text-slate-300 text-slate-700">{f.categoria}</td>
                  <td className="py-3.5 px-4 text-center font-mono dark:text-slate-400 text-slate-500">
                    {f.lead_time_acordado}d
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono dark:text-white text-slate-900 font-medium">
                    {f.lead_time_real}d
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className={f.gap_lead_time_dias > 2 ? "text-red-500 font-bold" : f.gap_lead_time_dias > 0 ? "text-amber-500 font-medium" : "text-emerald-500 font-medium"}>
                      {f.gap_lead_time_dias > 0 ? `+${f.gap_lead_time_dias}d` : "No Prazo"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono dark:text-slate-300 text-slate-700">
                    {f.on_time_pct.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono dark:text-slate-300 text-slate-700">
                    {f.in_full_pct.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className={`font-semibold ${f.otif_pct >= 90 ? "text-emerald-500" : f.otif_pct >= 80 ? "text-amber-500" : "text-red-500"}`}>
                      {f.otif_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getSlaBadge(f.status_sla)}
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-right font-mono dark:text-slate-300 text-slate-700">
                    <div>{f.pedidos_entregues} entregues</div>
                    {f.pedidos_em_transito > 0 && (
                      <div className="text-[10px] text-cyan-600 dark:text-cyan-400">
                        {f.pedidos_em_transito} em aberto
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
