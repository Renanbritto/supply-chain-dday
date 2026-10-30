"use client";

import React, { useState } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Truck, Plane, Ship, ShieldCheck, AlertTriangle, ArrowRight, Building2, Package } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

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
  const [activeHoverNode, setActiveHoverNode] = useState<any>(null);

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

  // Funcao de Projecao de Coordenadas para SVG (Brasil Mercator ajustado)
  // Longitude: -74 (Oeste AM/AC) a -34 (Leste RN/PB) -> delta 40
  // Latitude: 5.2 (Norte RR/AP) a -33.7 (Sul RS) -> delta 38.9
  const projectCoordinates = (lat: number, lng: number) => {
    const minLng = -73.5;
    const maxLng = -34.0;
    const maxLat = 5.2;
    const minLat = -33.5;

    const width = 760;
    const height = 580;

    const x = ((lng - minLng) / (maxLng - minLng)) * width + 20;
    const y = ((maxLat - lat) / (maxLat - minLat)) * height + 20;
    return { x, y };
  };

  // Filtra rotas com base nos filtros
  const filteredRotas = rotas.filter((r) => {
    if (selectedHub !== "ALL" && r.filial_id !== selectedHub) return false;
    if (selectedModal !== "ALL" && !r.modal.toLowerCase().includes(selectedModal.toLowerCase())) return false;
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
        return "#06B6D4"; // Ciano
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Metricas da Malha Logistica */}
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

      {/* Container Principal do Mapa e Painel Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mapa SVG Georreferenciado */}
        <div className="lg:col-span-3 obsidian-card p-5 rounded-xl relative overflow-hidden transition-all flex flex-col justify-between">
          {/* Header do Mapa e Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b dark:border-white/10 border-slate-200 z-10">
            <div>
              <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
                Malha Geografica de Suprimentos & Rotas Interestaduais
              </h3>
              <p className="text-xs dark:text-slate-400 text-slate-500">
                Visualizacao em tempo real de fluxos fabris e recebimento fisico nos centros de distribuicao
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg dark:bg-obsidian-850 bg-white border dark:border-white/10 border-slate-300 dark:text-slate-300 text-slate-700 focus:outline-none"
              >
                <option value="ALL">Todos os Hubs Destino</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nome} ({h.estado})
                  </option>
                ))}
              </select>

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
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="w-full relative h-[480px] my-2 select-none">
            <svg
              viewBox="0 0 800 620"
              className="w-full h-full"
              style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.15))" }}
            >
              {/* Contorno Silhueta Estilizada do Brasil */}
              <path
                d="M 120 110 L 260 70 L 380 90 L 460 75 L 530 110 L 610 130 L 710 180 L 740 220 L 720 270 L 660 300 L 630 350 L 590 380 L 580 430 L 530 480 L 480 540 L 450 610 L 410 600 L 410 530 L 370 480 L 320 440 L 280 410 L 230 390 L 160 360 L 120 320 L 90 260 L 80 200 Z"
                fill={theme === "dark" ? "rgba(14, 20, 34, 0.7)" : "rgba(241, 245, 249, 0.8)"}
                stroke={theme === "dark" ? "rgba(6, 182, 212, 0.25)" : "rgba(203, 213, 225, 0.9)"}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />

              {/* Grade de Meridianos / Paralelos Sutis */}
              <line x1="20" y1="200" x2="780" y2="200" stroke={theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} strokeDasharray="3 3" />
              <line x1="20" y1="400" x2="780" y2="400" stroke={theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} strokeDasharray="3 3" />
              <line x1="300" y1="20" x2="300" y2="600" stroke={theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} strokeDasharray="3 3" />
              <line x1="550" y1="20" x2="550" y2="600" stroke={theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} strokeDasharray="3 3" />

              {/* Corredores Logísticos / Arcos de Carga */}
              {filteredRotas.map((rota) => {
                const orig = projectCoordinates(rota.origem.lat, rota.origem.lng);
                const dest = projectCoordinates(rota.destino.lat, rota.destino.lng);
                const color = getRouteColor(rota.status_rota);

                // Ponto de Controle Bezier curvado para dar profundidade estética
                const dx = dest.x - orig.x;
                const dy = dest.y - orig.y;
                const cx = (orig.x + dest.x) / 2 - dy * 0.15;
                const cy = (orig.y + dest.y) / 2 + dx * 0.15;

                return (
                  <g key={rota.rota_id} className="cursor-pointer group" onMouseEnter={() => setActiveHoverNode({ type: "ROTA", data: rota })}>
                    <path
                      d={`M ${orig.x} ${orig.y} Q ${cx} ${cy} ${dest.x} ${dest.y}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={Math.min(3.5, Math.max(1.2, rota.volume_unidades / 400))}
                      strokeOpacity={0.65}
                      className="group-hover:stroke-opacity-100 group-hover:stroke-white transition-all"
                    />
                    {/* Partícula de Fluxo em Trânsito */}
                    <circle
                      cx={(orig.x + dest.x) / 2}
                      cy={(orig.y + dest.y) / 2}
                      r={2}
                      fill={color}
                      className="animate-ping"
                    />
                  </g>
                );
              })}

              {/* Fornecedores / Fábricas */}
              {fornecedores.map((forn) => {
                const pos = projectCoordinates(forn.lat, forn.lng);
                return (
                  <g
                    key={forn.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group"
                    onMouseEnter={() => setActiveHoverNode({ type: "FORNECEDOR", data: forn })}
                  >
                    <rect
                      x="-5"
                      y="-5"
                      width="10"
                      height="10"
                      rx="2"
                      fill="#3B82F6"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      className="group-hover:scale-125 transition-transform"
                    />
                    <text
                      x="8"
                      y="3"
                      fontSize="9"
                      fill={theme === "dark" ? "#94A3B8" : "#475569"}
                      fontFamily="monospace"
                      className="opacity-75 group-hover:opacity-100 transition-opacity select-none font-semibold"
                    >
                      {forn.cidade}/{forn.estado}
                    </text>
                  </g>
                );
              })}

              {/* Centros de Distribuição (Hubs) com Glow e Balizas Pulsantes */}
              {hubs.map((hub) => {
                const pos = projectCoordinates(hub.lat, hub.lng);
                return (
                  <g
                    key={hub.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedHub(hub.id)}
                    onMouseEnter={() => setActiveHoverNode({ type: "HUB", data: hub })}
                  >
                    {/* Anel Pulsante */}
                    <circle r="14" fill="rgba(6, 182, 212, 0.25)" className="animate-ping" />
                    <circle r="10" fill="rgba(6, 182, 212, 0.4)" />
                    <circle r="6" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="2" className="group-hover:scale-125 transition-transform" />
                    
                    <text
                      x="14"
                      y="-4"
                      fontSize="10"
                      fill={theme === "dark" ? "#FFFFFF" : "#0F172A"}
                      fontFamily="Comfortaa"
                      fontWeight="bold"
                      className="select-none"
                    >
                      {hub.id}
                    </text>
                    <text
                      x="14"
                      y="8"
                      fontSize="8"
                      fill="#06B6D4"
                      fontFamily="monospace"
                      className="select-none"
                    >
                      {hub.cidade} ({hub.ocupacao_pct}%)
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip Dinâmico Flutuante */}
            {activeHoverNode && (
              <div className="absolute bottom-3 left-3 obsidian-drawer p-3 rounded-lg border dark:border-white/10 border-slate-200 text-xs shadow-xl max-w-[260px] pointer-events-none z-20">
                {activeHoverNode.type === "HUB" && (
                  <div>
                    <div className="font-bold text-cyan-500 font-mono flex items-center justify-between">
                      <span>{activeHoverNode.data.nome}</span>
                      <span className="text-[10px] text-emerald-500 font-bold">{activeHoverNode.data.ocupacao_pct}% cap</span>
                    </div>
                    <div className="text-[11px] dark:text-slate-300 text-slate-700 mt-1">
                      {activeHoverNode.data.cidade} - {activeHoverNode.data.estado}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Estoque: {formatCurrency(activeHoverNode.data.capital_estoque)} | {activeHoverNode.data.total_skus} SKUs
                    </div>
                    <div className="text-[10px] text-red-500 font-semibold mt-0.5">
                      Rupturas locais: {activeHoverNode.data.rupturas_locais} SKUs zerados
                    </div>
                  </div>
                )}

                {activeHoverNode.type === "FORNECEDOR" && (
                  <div>
                    <div className="font-bold text-blue-500 font-mono">
                      {activeHoverNode.data.nome}
                    </div>
                    <div className="text-[11px] dark:text-slate-300 text-slate-700 mt-1">
                      {activeHoverNode.data.cidade} - {activeHoverNode.data.estado} ({activeHoverNode.data.categoria})
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Lead Time: {activeHoverNode.data.lead_time_acordado}d | Confianca SLA: {activeHoverNode.data.confianca_pct}%
                    </div>
                    <div className="text-[10px] text-cyan-500 font-medium mt-0.5">
                      {activeHoverNode.data.remessas_em_transito} pedidos em rota de entrega
                    </div>
                  </div>
                )}

                {activeHoverNode.type === "ROTA" && (
                  <div>
                    <div className="font-bold text-cyan-500 font-mono flex items-center justify-between">
                      <span>{activeHoverNode.data.rota_id}</span>
                      <span className="text-[10px] text-slate-400">{activeHoverNode.data.modal}</span>
                    </div>
                    <div className="text-[11px] dark:text-slate-200 text-slate-800 font-medium mt-1 flex items-center gap-1">
                      <span>{activeHoverNode.data.origem.cidade}</span>
                      <ArrowRight className="h-3 w-3 text-cyan-500" />
                      <span>{activeHoverNode.data.destino.cidade}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Carga: {formatNumber(activeHoverNode.data.volume_unidades)} un ({formatCurrency(activeHoverNode.data.valor_carga)})
                    </div>
                    <div className="text-[10px] text-amber-500 font-semibold mt-0.5">
                      Tempo na rota: {activeHoverNode.data.dias_em_transito} dias ({activeHoverNode.data.status_rota})
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legenda do Mapa */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono dark:text-slate-400 text-slate-600 pt-3 border-t dark:border-white/10 border-slate-200">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-cyan-500" /> Centro de Distribuicao (Hub)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Fabrica Fornecedor
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-cyan-400" /> No Prazo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-amber-400" /> Atraso Moderado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-red-400" /> Atraso Critico
              </span>
            </div>
          </div>
        </div>

        {/* Painel Lateral de Detalhes dos Hubs e Corredores */}
        <div className="space-y-4">
          <div className="obsidian-card p-4 rounded-xl">
            <h4 className="text-xs font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold mb-3 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Centros de Distribuicao (5 Hubs)
            </h4>

            <div className="space-y-2.5">
              {hubs.map((hub) => (
                <div
                  key={hub.id}
                  onClick={() => setSelectedHub(hub.id === selectedHub ? "ALL" : hub.id)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    selectedHub === hub.id
                      ? "dark:bg-cyan-500/15 bg-cyan-50 border-cyan-400"
                      : "dark:bg-obsidian-850 bg-slate-100 dark:border-white/5 border-slate-200 hover:border-cyan-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold dark:text-white text-slate-900 font-mono">
                      {hub.id} - {hub.cidade}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-500">
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
                    <span>{hub.total_skus} SKUs</span>
                    <span className={hub.rupturas_locais > 0 ? "text-red-500 font-semibold" : "text-emerald-500"}>
                      {hub.rupturas_locais > 0 ? `${hub.rupturas_locais} rupturas` : "0 faltas"}
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

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {filteredRotas.slice(0, 6).map((rota) => (
                <div key={rota.rota_id} className="p-2 rounded-lg dark:bg-obsidian-850 bg-slate-100 text-[11px] border dark:border-white/5 border-slate-200">
                  <div className="flex items-center justify-between font-mono">
                    <span className="dark:text-white text-slate-900 font-bold">{rota.rota_id}</span>
                    <span className={`text-[10px] font-bold ${rota.status_rota === "CRITICAL" ? "text-red-500" : rota.status_rota === "DELAYED" ? "text-amber-500" : "text-emerald-500"}`}>
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

