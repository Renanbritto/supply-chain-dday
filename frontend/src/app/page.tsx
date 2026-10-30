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
import { fallbackData } from "@/data/fallbackData";
import { MessageSquare } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("inventory");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [diagnoseSku, setDiagnoseSku] = useState<string | null>(null);

  // Estados dos Dados - Inicializados diretamente com a base DuckDB
  const [summary, setSummary] = useState<any>(fallbackData.summary);
  const [inventoryItems, setInventoryItems] = useState<any[]>(fallbackData.inventory);
  const [abcData, setAbcData] = useState<any>(fallbackData.abc);
  const [suppliersData, setSuppliersData] = useState<any>(fallbackData.suppliers);

  // Filtros da Tabela
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
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

      if (sum) setSummary(sum);
      if (inv && inv.items) setInventoryItems(inv.items);
      if (abc) setAbcData(abc);
      if (sup) setSuppliersData(sup);
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

      {/* Floating Action Button no canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => {
            setDiagnoseSku(null);
            setIsCopilotOpen(true);
          }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-xs shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:scale-105 transition-all"
        >
          <MessageSquare className="h-4 w-4" />
          <span>RN Intelligence</span>
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
