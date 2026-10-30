"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { Sidebar, NavTab } from "@/components/dashboard/Sidebar";
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
import { Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("inventory");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    <div className="min-h-screen flex bg-obsidian-950 text-slate-100">
      {/* Menu Retrátil à Esquerda */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        inventoryCount={inventoryItems.length}
        suppliersCount={suppliersData.fornecedores?.length || 0}
        onOpenCopilot={() => {
          setDiagnoseSku(null);
          setIsCopilotOpen(true);
        }}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 pb-16">
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

          {/* Conteúdo Dinâmico por Aba selecionada no menu retrátil */}
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
      </div>

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
