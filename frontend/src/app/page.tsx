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
import { RiskScatterPlot } from "@/components/analytics/RiskScatterPlot";
import dynamic from "next/dynamic";

const GeoSupplyMap = dynamic(
  () => import("@/components/analytics/GeoSupplyMap").then((m) => m.GeoSupplyMap),
  {
    ssr: false,
    loading: () => (
      <div className="obsidian-card p-12 rounded-xl text-center text-xs dark:text-slate-400 text-slate-500 font-mono">
        Carregando mapa logistico interativo do Brasil...
      </div>
    ),
  }
);
import {
  fetchSummary,
  fetchInventory,
  fetchAbcCurve,
  fetchSuppliersSla,
  fetchScatterRisk,
  fetchGeoNetwork,
} from "@/lib/api";
import { fallbackData } from "@/data/fallbackData";

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
  const [scatterData, setScatterData] = useState<any>(fallbackData.scatter);
  const [geoData, setGeoData] = useState<any>(fallbackData.geo);

  // Filtros da Tabela
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      const [sum, inv, abc, sup, scat, geo] = await Promise.all([
        fetchSummary(),
        fetchInventory({
          categoria: selectedCategory,
          status: selectedStatus,
          search: searchQuery,
        }),
        fetchAbcCurve(),
        fetchSuppliersSla(),
        fetchScatterRisk(),
        fetchGeoNetwork(),
      ]);

      if (sum) setSummary(sum);
      if (inv && inv.items) setInventoryItems(inv.items);
      if (abc) setAbcData(abc);
      if (sup) setSuppliersData(sup);
      if (scat) setScatterData(scat);
      if (geo) setGeoData(geo);
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
    <div className="min-h-screen flex dark:bg-obsidian-950 bg-slate-50/70 dark:text-slate-100 text-slate-800 transition-colors">
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
        <Header onRefresh={loadAllData} isRefreshing={refreshing} />

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

          {activeTab === "scatter" && (
            <RiskScatterPlot
              data={scatterData}
              onDiagnoseSku={handleDiagnoseFromTable}
            />
          )}

          {activeTab === "geo" && (
            <GeoSupplyMap
              data={geoData}
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
