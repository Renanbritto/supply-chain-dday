"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { Truck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

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
      <div className="obsidian-card p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-cyan-500">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              Controle de Confiabilidade & SLA de Fornecedores
            </h4>
            <p className="text-xs text-slate-400">
              Auditagem de prazos de entrega (On-Time) e quantidades faturadas (In-Full)
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-2 bg-obsidian-850 px-4 py-2 rounded-lg border border-white/10">
          <span className="text-xs text-slate-400 font-mono">OTIF Global:</span>
          <span className="text-lg font-bold font-mono text-cyan-400">
            {otifGlobal.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Tabela de Fornecedores */}
      <div className="obsidian-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-obsidian-900/90 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4">Categoria Principal</th>
                <th className="py-3 px-4 text-center">LT Acordado</th>
                <th className="py-3 px-4 text-center">LT Real Medio</th>
                <th className="py-3 px-4 text-center">Desvio (Gap)</th>
                <th className="py-3 px-4 text-center">On-Time %</th>
                <th className="py-3 px-4 text-center">In-Full %</th>
                <th className="py-3 px-4 text-center">OTIF %</th>
                <th className="py-3 px-4 text-center">Status SLA</th>
                <th className="py-3 px-4 text-right">Pedidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {suppliers.map((f) => (
                <tr key={f.fornecedor_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="text-white font-medium">{f.nome}</div>
                    <div className="font-mono text-[10px] text-slate-500">{f.fornecedor_id}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{f.categoria}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {f.lead_time_acordado}d
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-white font-medium">
                    {f.lead_time_real}d
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className={f.gap_lead_time_dias > 2 ? "text-red-400 font-bold" : f.gap_lead_time_dias > 0 ? "text-amber-400" : "text-emerald-400"}>
                      {f.gap_lead_time_dias > 0 ? `+${f.gap_lead_time_dias}d` : "No Prazo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {f.on_time_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {f.in_full_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className={`font-semibold ${f.otif_pct >= 90 ? "text-emerald-400" : f.otif_pct >= 80 ? "text-amber-400" : "text-red-400"}`}>
                      {f.otif_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getSlaBadge(f.status_sla)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    <div>{f.pedidos_entregues} entregues</div>
                    {f.pedidos_em_transito > 0 && (
                      <div className="text-[10px] text-cyan-400">
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
