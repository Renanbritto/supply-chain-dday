"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Truck,
  Plane,
  Ship,
  Building2,
  Package,
  RotateCcw,
  ArrowRight,
  Layers,
  Globe2,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import "leaflet/dist/leaflet.css";

interface Hub {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  lat: number;
  lng: number;
  capacidade_paletes: number;
  paletes_ocupados: number;
  ocupacao_pct: number;
  total_skus: number;
  capital_estoque: number;
  rupturas_locais: number;
}

interface FornecedorGeo {
  id: string;
  nome: string;
  categoria: string;
  cidade: string;
  estado: string;
  lat: number;
  lng: number;
  lead_time_acordado: number;
  confianca_pct: number;
  remessas_em_transito: number;
}

interface Rota {
  rota_id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  origem: {
    cidade: string;
    estado: string;
    lat: number;
    lng: number;
  };
  filial_id: string;
  filial_nome: string;
  destino: {
    cidade: string;
    estado: string;
    lat: number;
    lng: number;
  };
  modal: string;
  pedidos_count: number;
  volume_unidades: number;
  valor_carga: number;
  dias_em_transito: number;
  status_rota: "ON_TIME" | "DELAYED" | "CRITICAL";
}

interface GeoSupplyMapProps {
  data: {
    hubs?: Hub[];
    fornecedores?: FornecedorGeo[];
    rotas?: Rota[];
    resumo?: {
      total_hubs: number;
      total_fornecedores: number;
      total_corredores_ativos: number;
      volume_total_transito: number;
      valor_total_transito: number;
    };
  };
}

export function GeoSupplyMap({ data }: GeoSupplyMapProps) {
  const { theme } = useTheme();
  const [selectedHub, setSelectedHub] = useState<string>("ALL");
  const [selectedModal, setSelectedModal] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [mapLayerType, setMapLayerType] = useState<"osm" | "satellite" | "dark">(
    theme === "dark" ? "dark" : "osm"
  );
  const [activeRouteInfo, setActiveRouteInfo] = useState<Rota | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const polylinesLayerRef = useRef<any>(null);

  const hubs = data?.hubs || [];
  const fornecedores = data?.fornecedores || [];
  const rotas = data?.rotas || [];
  const resumo = data?.resumo || {
    total_hubs: 5,
    total_fornecedores: 12,
    total_corredores_ativos: 42,
    volume_total_transito: 18500,
    valor_total_transito: 3450000.0,
  };

  // Sincroniza camada padrao ao alternar entre tema claro e escuro
  useEffect(() => {
    if (theme === "dark" && mapLayerType === "osm") {
      setMapLayerType("dark");
    } else if (theme === "light" && mapLayerType === "dark") {
      setMapLayerType("osm");
    }
  }, [theme]);

  // Filtragem dos corredores
  const filteredRotas = rotas.filter((r) => {
    if (selectedHub !== "ALL" && r.filial_id !== selectedHub) return false;
    if (selectedModal !== "ALL" && !r.modal.toLowerCase().includes(selectedModal.toLowerCase())) return false;
    if (selectedStatus !== "ALL" && r.status_rota !== selectedStatus) return false;
    return true;
  });

  const getModalIcon = (modal: string) => {
    if (modal.includes("Aereo")) return <Plane className="h-3 w-3 text-cyan-500" />;
    if (modal.includes("Cabotagem") || modal.includes("Maritima")) return <Ship className="h-3 w-3 text-blue-500" />;
    return <Truck className="h-3 w-3 text-amber-500" />;
  };

  const getRouteColor = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return "#EF4444"; // Vermelho
      case "DELAYED":
        return "#F59E0B"; // Ambar
      default:
        return "#10B981"; // Verde esmeralda (No prazo)
    }
  };

  const getTileConfig = (type: "osm" | "satellite" | "dark") => {
    switch (type) {
      case "satellite":
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution: '&copy; Esri World Imagery',
          maxZoom: 18,
        };
      case "dark":
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          attribution: '&copy; Esri Dark Canvas &mdash; OpenStreetMap',
          maxZoom: 16,
        };
      case "osm":
      default:
        return {
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        };
    }
  };

  // Inicializacao do Leaflet
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      const L = (await import("leaflet")).default;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Inicializa o mapa com foco total no territorio brasileiro
        const map = L.map(mapContainerRef.current, {
          center: [-14.5, -52.0],
          zoom: 4,
          minZoom: 3,
          maxZoom: 14,
          scrollWheelZoom: true,
          zoomControl: true,
        });

        const tileCfg = getTileConfig(mapLayerType);
        const tileLayer = L.tileLayer(tileCfg.url, {
          attribution: tileCfg.attribution,
          maxZoom: tileCfg.maxZoom,
        }).addTo(map);

        tileLayerRef.current = tileLayer;
        markersLayerRef.current = L.layerGroup().addTo(map);
        polylinesLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        // Auto-enquadramento preciso do Brasil
        map.fitBounds(
          [
            [-2.5, -61.0], // Norte / Manaus
            [-30.0, -34.5], // Sul / Recife
          ],
          { padding: [35, 35] }
        );
      }

      if (isMounted) {
        renderMapFeatures(L);
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
    };
  }, []);

  // Troca dinamica de camada do mapa
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileCfg = getTileConfig(mapLayerType);
    tileLayerRef.current.setUrl(tileCfg.url);
  }, [mapLayerType]);

  // Atualiza Marcadores e Polilinhas ao alterar filtros
  useEffect(() => {
    async function updateFeatures() {
      if (typeof window === "undefined" || !mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      renderMapFeatures(L);
    }
    updateFeatures();
  }, [selectedHub, selectedModal, selectedStatus, filteredRotas.length, mapLayerType]);

  const renderMapFeatures = (L: any) => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !polylinesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    polylinesLayerRef.current.clearLayers();

    // 1. Polilinhas dos Corredores Logísticos
    filteredRotas.forEach((rota) => {
      const color = getRouteColor(rota.status_rota);
      const isSelected = activeRouteInfo?.rota_id === rota.rota_id;

      const polyline = L.polyline(
        [
          [rota.origem.lat, rota.origem.lng],
          [rota.destino.lat, rota.destino.lng],
        ],
        {
          color,
          weight: isSelected ? 4.5 : Math.min(3.5, Math.max(1.8, rota.volume_unidades / 400)),
          opacity: isSelected ? 1 : 0.7,
          dashArray: rota.modal === "AEREO" ? "6, 6" : rota.modal === "CABOTAGEM" ? "8, 4" : undefined,
        }
      );

      polyline.bindTooltip(
        `
        <div style="font-family:'Comfortaa', sans-serif; padding:3px; font-size:11px;">
          <div style="font-weight:700; color:#06B6D4;">${rota.rota_id} • ${rota.modal}</div>
          <div style="margin-top:2px;"><strong>Origem:</strong> ${rota.fornecedor_nome} (${rota.origem.cidade}/${rota.origem.estado})</div>
          <div><strong>Destino:</strong> ${rota.filial_nome}</div>
          <div style="margin-top:2px;"><strong>Carga:</strong> ${formatNumber(rota.volume_unidades)} un (${formatCurrency(rota.valor_carga)})</div>
          <div style="color:${color}; font-weight:700; margin-top:2px;">Status: ${rota.status_rota} (${rota.dias_em_transito} dias em transito)</div>
        </div>
        `,
        { sticky: true }
      );

      polyline.on("click", () => {
        setActiveRouteInfo(rota);
      });

      polyline.addTo(polylinesLayerRef.current);
    });

    // 2. Polos Fabris / Fornecedores (Marcadores circulares limpos e discretos)
    fornecedores.forEach((forn) => {
      const factoryIcon = L.divIcon({
        className: "custom-factory-dot",
        html: `
          <div style="width:12px; height:12px; border-radius:50%; background:#2563EB; border:2px solid #FFFFFF; box-shadow:0 0 6px rgba(37,99,235,0.8); cursor:pointer;"></div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([forn.lat, forn.lng], { icon: factoryIcon });
      marker.bindTooltip(
        `
        <div style="font-family:'Comfortaa', sans-serif; font-size:11px; padding:2px;">
          <div style="font-weight:700; color:#3B82F6;">Fabrica: ${forn.nome}</div>
          <div>${forn.cidade}/${forn.estado} • ${forn.categoria}</div>
          <div>Lead time acordado: ${forn.lead_time_acordado} dias</div>
          <div>Confiabilidade SLA: ${forn.confianca_pct}%</div>
          <div style="color:#06B6D4; font-weight:600; margin-top:2px;">${forn.remessas_em_transito} remessas ativas</div>
        </div>
        `,
        { direction: "top", offset: [0, -6] }
      );
      marker.addTo(markersLayerRef.current);
    });

    // 3. Centros de Distribuição (Hubs - Badges Executivos Destacados)
    hubs.forEach((hub) => {
      const isSelected = selectedHub === hub.id;
      const isDark = theme === "dark" || mapLayerType === "satellite" || mapLayerType === "dark";

      const hubIcon = L.divIcon({
        className: "custom-hub-marker",
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); cursor:pointer;">
            <div style="background:${isDark ? (isSelected ? "#083344" : "#0F172A") : (isSelected ? "#E0F2FE" : "#FFFFFF")}; color:${isDark ? "#FFFFFF" : "#0F172A"}; border:2px solid ${isSelected ? "#38BDF8" : "#06B6D4"}; border-radius:6px; padding:3px 7px; font-weight:700; font-size:11px; font-family:monospace; box-shadow:0 4px 14px rgba(6,182,212,0.45); display:flex; align-items:center; gap:5px; white-space:nowrap;">
              <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:${hub.rupturas_locais > 0 ? '#EF4444' : '#10B981'};"></span>
              ${hub.id}
            </div>
            <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #06B6D4;"></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([hub.lat, hub.lng], { icon: hubIcon });
      marker.bindPopup(
        `
        <div style="font-family:'Comfortaa', sans-serif; min-width:210px; padding:2px;">
          <div style="font-weight:700; font-size:13px; color:#06B6D4; margin-bottom:2px;">${hub.nome}</div>
          <div style="font-size:11px; color:#64748B; margin-bottom:6px;">${hub.cidade} - ${hub.estado}</div>
          <div style="font-size:11px; margin-bottom:3px;"><strong>Ocupacao:</strong> ${hub.paletes_ocupados.toLocaleString('pt-BR')} / ${hub.capacidade_paletes.toLocaleString('pt-BR')} paletes (${hub.ocupacao_pct}%)</div>
          <div style="font-size:11px; margin-bottom:3px;"><strong>SKUs Ativos:</strong> ${hub.total_skus}</div>
          <div style="font-size:11px; margin-bottom:3px;"><strong>Capital em Estoque:</strong> R$ ${hub.capital_estoque.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
          <div style="font-size:11px; color:${hub.rupturas_locais > 0 ? '#EF4444' : '#10B981'}; font-weight:600; margin-top:4px;">
            ${hub.rupturas_locais > 0 ? `${hub.rupturas_locais} rupturas registradas` : 'Sem rupturas ativas'}
          </div>
        </div>
        `
      );

      marker.on("click", () => {
        setSelectedHub(hub.id);
      });

      marker.addTo(markersLayerRef.current);
    });
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(
        [
          [-2.5, -61.0],
          [-30.0, -34.5],
        ],
        { padding: [35, 35], duration: 1.2 }
      );
      setSelectedHub("ALL");
      setSelectedModal("ALL");
      setSelectedStatus("ALL");
      setActiveRouteInfo(null);
    }
  };

  const handleFocusHub = (hub: Hub) => {
    setSelectedHub(hub.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hub.lat, hub.lng], 6, { duration: 1 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior de Indicadores da Malha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="obsidian-card p-4 rounded-xl">
          <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 uppercase">
            Centros de Distribuicao
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono dark:text-white text-slate-900">
              {resumo.total_hubs} Hubs
            </span>
            <span className="text-xs text-emerald-500 font-semibold">100% ativos</span>
          </div>
          <span className="text-[10px] text-slate-400">Capacidade: 32.000 paletes</span>
        </div>

        <div className="obsidian-card p-4 rounded-xl">
          <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 uppercase">
            Polos Fornecedores
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono dark:text-white text-slate-900">
              {resumo.total_fornecedores} Industrias
            </span>
            <span className="text-xs text-cyan-500 font-semibold">8 estados</span>
          </div>
          <span className="text-[10px] text-slate-400">PIM Manaus, SP, Sul, Nordeste</span>
        </div>

        <div className="obsidian-card p-4 rounded-xl">
          <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 uppercase">
            Corredores Ativos
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {filteredRotas.length} Rotas
            </span>
            <span className="text-xs text-slate-400">em transito</span>
          </div>
          <span className="text-[10px] text-slate-400">Rodoviario, Aereo e Maritimo</span>
        </div>

        <div className="obsidian-card p-4 rounded-xl">
          <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 uppercase">
            Volume em Transito
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-mono dark:text-white text-slate-900">
              {formatNumber(resumo.volume_total_transito)} un
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Abastecendo os 5 CDs</span>
        </div>

        <div className="obsidian-card p-4 rounded-xl">
          <span className="text-[11px] font-mono dark:text-slate-400 text-slate-500 uppercase">
            Capital em Transito
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-500">
              {formatCurrency(resumo.valor_total_transito)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Mercadoria faturada a caminho</span>
        </div>
      </div>

      {/* Grid Principal do Mapa Interativo Leaflet */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Painel do Mapa */}
        <div className="lg:col-span-3 obsidian-card p-5 rounded-xl relative overflow-hidden transition-all flex flex-col justify-between">
          {/* Header de Filtros Operacionais e Selecao de Camada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b dark:border-white/10 border-slate-200 z-10">
            <div>
              <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-500" />
                Malha Geografica de Suprimentos Brasil
              </h3>
              <p className="text-xs dark:text-slate-400 text-slate-500">
                Visualizacao geografica real de corredores de carga interestaduais e centros de distribuicao
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor de Camada Cartográfica Oficial */}
              <div className="flex items-center rounded-lg border dark:border-white/10 border-slate-300 dark:bg-obsidian-850 bg-white p-0.5">
                <button
                  onClick={() => setMapLayerType("dark")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    mapLayerType === "dark"
                      ? "bg-cyan-600 text-white font-medium"
                      : "dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Modo Noturno (Esri Dark Canvas)"
                >
                  Noturno
                </button>
                <button
                  onClick={() => setMapLayerType("osm")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    mapLayerType === "osm"
                      ? "bg-cyan-600 text-white font-medium"
                      : "dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Mapa Padrão OpenStreetMap"
                >
                  Padrao
                </button>
                <button
                  onClick={() => setMapLayerType("satellite")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    mapLayerType === "satellite"
                      ? "bg-cyan-600 text-white font-medium"
                      : "dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Satelite de Alta Definicao (Esri Imagery)"
                >
                  Satelite
                </button>
              </div>

              {/* Filtro por Hub */}
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg dark:bg-obsidian-850 bg-white border dark:border-white/10 border-slate-300 dark:text-slate-300 text-slate-700 focus:outline-none"
              >
                <option value="ALL">Todos os Hubs</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nome} ({h.estado})
                  </option>
                ))}
              </select>

              {/* Filtro por Modal */}
              <select
                value={selectedModal}
                onChange={(e) => setSelectedModal(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg dark:bg-obsidian-850 bg-white border dark:border-white/10 border-slate-300 dark:text-slate-300 text-slate-700 focus:outline-none"
              >
                <option value="ALL">Todos os Modais</option>
                <option value="Rodoviario">Rodoviario</option>
                <option value="Aereo">Aereo Cargo</option>
                <option value="Cabotagem">Cabotagem Maritima</option>
              </select>

              {/* Filtro por Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg dark:bg-obsidian-850 bg-white border dark:border-white/10 border-slate-300 dark:text-slate-300 text-slate-700 focus:outline-none"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ON_TIME">No Prazo</option>
                <option value="DELAYED">Atraso Moderado</option>
                <option value="CRITICAL">Atraso Critico</option>
              </select>

              {/* Resetar Enquadramento */}
              <button
                onClick={handleResetView}
                className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-lg dark:bg-obsidian-850 bg-slate-100 hover:bg-slate-200 dark:hover:bg-obsidian-800 border dark:border-white/10 border-slate-300 transition-colors dark:text-slate-300 text-slate-700"
                title="Enquadrar territorio brasileiro"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Enquadrar Brasil</span>
              </button>
            </div>
          </div>

          {/* Container do Mapa Real Leaflet */}
          <div className="w-full h-[510px] my-3 rounded-lg overflow-hidden border dark:border-white/10 border-slate-200 relative z-0">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Legenda Informativa */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono dark:text-slate-400 text-slate-600 pt-3 border-t dark:border-white/10 border-slate-200">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-cyan-500" /> Centros de Distribuicao (Hubs)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 border border-white" /> Polos Fabris / Fornecedores
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-4 rounded-full bg-emerald-500" /> No Prazo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-4 rounded-full bg-amber-500" /> Atraso Moderado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-4 rounded-full bg-rose-500" /> Atraso Critico
              </span>
            </div>
          </div>
        </div>

        {/* Painel Lateral: Hubs & Corredores */}
        <div className="space-y-4">
          <div className="obsidian-card p-4 rounded-xl">
            <h4 className="text-xs font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold mb-3 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Centros de Distribuicao ({hubs.length} Hubs)
            </h4>

            <div className="space-y-2.5">
              {hubs.map((hub) => (
                <div
                  key={hub.id}
                  onClick={() => handleFocusHub(hub)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    selectedHub === hub.id
                      ? "dark:bg-cyan-500/15 bg-cyan-50 border-cyan-400 shadow-sm"
                      : "dark:bg-obsidian-850 bg-slate-100 dark:border-white/5 border-slate-200 hover:border-cyan-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold dark:text-white text-slate-900 font-mono">
                      {hub.id} - {hub.cidade}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-500 font-bold">
                      {hub.ocupacao_pct}% paletes
                    </span>
                  </div>
                  <div className="w-full bg-slate-300 dark:bg-obsidian-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${
                        hub.ocupacao_pct > 85 ? "bg-red-500" : hub.ocupacao_pct > 65 ? "bg-cyan-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${hub.ocupacao_pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{hub.total_skus} SKUs • {formatCurrency(hub.capital_estoque)}</span>
                    <span className={hub.rupturas_locais > 0 ? "text-red-500 font-semibold" : "text-emerald-500"}>
                      {hub.rupturas_locais > 0 ? `${hub.rupturas_locais} rupturas` : "0 rupturas"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="obsidian-card p-4 rounded-xl">
            <h4 className="text-xs font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold mb-3 flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              Corredores em Transito ({filteredRotas.length})
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredRotas.slice(0, 8).map((rota) => (
                <div
                  key={rota.rota_id}
                  onClick={() => {
                    setActiveRouteInfo(rota);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo(
                        [(rota.origem.lat + rota.destino.lat) / 2, (rota.origem.lng + rota.destino.lng) / 2],
                        5
                      );
                    }
                  }}
                  className={`p-2 rounded-lg text-[11px] border transition-all cursor-pointer ${
                    activeRouteInfo?.rota_id === rota.rota_id
                      ? "dark:bg-cyan-500/15 bg-cyan-50 border-cyan-400"
                      : "dark:bg-obsidian-850 bg-slate-100 dark:border-white/5 border-slate-200 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="dark:text-white text-slate-900 font-bold">{rota.rota_id}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        rota.status_rota === "CRITICAL"
                          ? "text-red-500"
                          : rota.status_rota === "DELAYED"
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {rota.status_rota}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    {getModalIcon(rota.modal)}
                    <span>{rota.origem.cidade}</span>
                    <ArrowRight className="h-2.5 w-2.5 text-cyan-500" />
                    <span>{rota.destino.cidade}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{formatNumber(rota.volume_unidades)} un</span>
                    <span className="text-cyan-500 font-medium">{formatCurrency(rota.valor_carga)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
