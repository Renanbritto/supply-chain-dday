"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { DDayTable } from "@/components/inventory/DDayTable";
import { AbcChart } from "@/components/dashboard/AbcChart";
import { SuppliersTable } from "@/components/dashboard/SuppliersTable";
import { WhatIfSimulator } from "@/components/dashboard/WhatIfSimulator";
import { CopilotDrawer } from "@/components/rn-intelligence/CopilotDrawer";
import {
  fetchSummary,
  fetchInventory,
  fetchAbcCurve,
  fetchSuppliersSla,
} from "@/lib/api";
import { LayoutGrid, BarChart3, Truck, Sliders, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "abc" | "suppliers" | "whatif">("inventory");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [diagnoseSku, setDiagnoseSku] = useState<string | null>(null);

  // Estados dos Dados
  const [summary, setSummary] = useState<any>({});
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [abcData, setAbcData] = useState<any>({ items: [], totais: {}, resumo: {} });
  const [suppliersData, setSuppliersData] = useState<any>({ fornecedores: [], otif_global: 0 });

  // Filtros da Tabela
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      const [sum, inv, abc, sup] = await Promise.all([
        fetchSummary(),
        fetchInventory({
          categoria: selectedCategory,
          status: selectedStatus,
          search: searchQuery,
        }),
        fetchAbcCurve(),
        fetchSuppliersSla(),
      ]);

      setSummary(sum);
      setInventoryItems(inv.items || []);
      setAbcData(abc);
      setSuppliersData(sup);
    } catch (err) {
      console.error("Erro ao carregar dados da API:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const handleDiagnoseFromTable = (sku: string) => {
    setDiagnoseSku(sku);
    setIsCopilotOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 text-slate-100 pb-16">
      {/* Header Fixo */}
      <Header
        onOpenCopilot={() => {
          setDiagnoseSku(null);
          setIsCopilotOpen(true);
        }}
        onRefresh={loadAllData}
        isRefreshing={refreshing}
      />

      <main className="max-w-7xl mx-auto px-6 pt-6 w-full space-y-6">
        {/* Cards de KPIs Principais */}
        <KpiCards summary={summary} />

        {/* Barra de Navegação por Abas */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 font-mono ${
              activeTab === "inventory"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Painel de Ruptura & D-Day ({inventoryItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("abc")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 font-mono ${
              activeTab === "abc"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Curva ABC & Pareto</span>
          </button>

          <button
            onClick={() => setActiveTab("suppliers")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 font-mono ${
              activeTab === "suppliers"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>SLA & Fornecedores ({suppliersData.fornecedores?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("whatif")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 font-mono ${
              activeTab === "whatif"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Simulador What-If</span>
          </button>
        </div>

        {/* Conteúdo Dinâmico por Aba */}
        {activeTab === "inventory" && (
          <DDayTable
            items={inventoryItems}
            onDiagnoseSku={handleDiagnoseFromTable}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {activeTab === "abc" && <AbcChart data={abcData} />}

        {activeTab === "suppliers" && (
          <SuppliersTable
            suppliers={suppliersData.fornecedores || []}
            otifGlobal={suppliersData.otif_global || 0}
          />
        )}

        {activeTab === "whatif" && (
          <WhatIfSimulator
            skus={inventoryItems.map((i) => ({
              sku: i.sku,
              nome: i.nome,
              categoria: i.categoria,
            }))}
          />
        )}
      </main>

      {/* Floating Action Button para o Copilot no canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => {
            setDiagnoseSku(null);
            setIsCopilotOpen(true);
          }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-xs shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:scale-105 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>RN Intelligence Copilot</span>
        </button>
      </div>

      {/* Drawer Lateral do RN Intelligence */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setDiagnoseSku(null);
        }}
        initialSkuToDiagnose={diagnoseSku}
      />
    </div>
  );
}
