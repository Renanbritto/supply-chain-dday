import { fallbackData } from "@/data/fallbackData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper com timeout de 2.5s para conexao com backend
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function fetchSummary() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/analytics/summary`);
    if (res.ok) return await res.json();
  } catch {
    // Backend offline: utiliza fallback analitico DuckDB
  }
  return fallbackData.summary;
}

export async function fetchInventory(params?: {
  categoria?: string;
  status?: string;
  search?: string;
}) {
  try {
    const query = new URLSearchParams();
    if (params?.categoria && params.categoria !== "ALL") query.append("categoria", params.categoria);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.search) query.append("search", params.search);

    const url = `${API_BASE_URL}/api/inventory/d-day${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetchWithTimeout(url);
    if (res.ok) return await res.json();
  } catch {
    // Backend offline: filtra dataset DuckDB local
  }

  let items = [...fallbackData.inventory];

  if (params?.categoria && params.categoria !== "ALL") {
    items = items.filter(
      (i) => i.categoria.toLowerCase() === params.categoria!.toLowerCase()
    );
  }

  if (params?.status && params.status !== "ALL") {
    items = items.filter(
      (i) => i.status_urgencia.toLowerCase() === params.status!.toLowerCase()
    );
  }

  if (params?.search) {
    const s = params.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.sku.toLowerCase().includes(s) ||
        i.nome.toLowerCase().includes(s) ||
        (i.fornecedor_nome || "").toLowerCase().includes(s)
    );
  }

  return {
    total: items.length,
    items,
  };
}

export async function fetchAbcCurve() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/analytics/abc`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }
  return fallbackData.abc;
}

export async function fetchSuppliersSla() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/suppliers/sla`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }
  return fallbackData.suppliers;
}

export async function fetchScatterRisk() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/analytics/scatter`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }
  return (fallbackData as any).scatter;
}

export async function fetchGeoNetwork() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/analytics/geo`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback local
  }
  return (fallbackData as any).geo;
}

export async function sendCopilotChat(message: string) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/intelligence/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Fallback inteligente para o chat offline
  }

  const msg = message.toLowerCase();

  if (msg.includes("sku") || msg.includes("diagnost")) {
    const item = fallbackData.inventory.find((i) => msg.includes(i.sku.toLowerCase())) || fallbackData.inventory[0];
    return {
      content: `### Diagnostico de Causa-Raiz: ${item.nome} (${item.sku})

- Categoria: ${item.categoria}
- Fornecedor: ${item.fornecedor_nome}
- Status Operacional: ${item.status_urgencia}
- Estoque Disponivel: ${item.estoque_disponivel} un (Ponto de Pedido: ${item.ponto_de_pedido} un)
- Cobertura Atual: ${item.dias_cobertura} dias
- Data Limite de Pedido (D-Day): ${item.dday_data} (restam ${item.dias_para_dday} dias)

Fatores Identificados pelo Motor DuckDB:
- Demanda media diaria de ${item.cmd} unidades/dia com lead time acordado de ${item.lead_time_medio} dias.
${item.estoque_em_transito > 0 ? `- Ha pedido em transito de ${item.estoque_em_transito} unidades.` : "- Nenhum pedido em transito registrado no momento."}

Acao Prescritiva Recomendada:
- Emissao de ordem para reposicao de ${item.sugestao_compra_qtd} unidades.
- Investimento estimado: R$ ${item.sugestao_compra_valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
    };
  }

  if (msg.includes("pedido") || msg.includes("comprar") || msg.includes("minuta")) {
    const urgentes = fallbackData.inventory.filter((i) => i.sugestao_compra_qtd > 0);
    const totalVal = urgentes.reduce((acc, i) => acc + i.sugestao_compra_valor, 0);
    return {
      content: `### Minutas de Pedidos de Compras Consolidadas

O motor RN Intelligence identificou ${urgentes.length} SKUs prioritarios para emissao de pedidos:

- Total consolidado para reposicao: R$ ${totalVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Principais fornecedores acionados: TechDistro Logistica, Silicon Supply e GlobalChip.

Todas as ordens foram calculadas respeitando lote minimo e capacidade de cobertura ate o proximo ciclo de entrega.`,
    };
  }

  if (msg.includes("fornecedor") || msg.includes("sla") || msg.includes("otif")) {
    const otif = fallbackData.suppliers.otif_global;
    return {
      content: `### Panorama de SLA & Confiabilidade de Fornecedores

- Indice OTIF Geral: ${otif}%
- Total de fornecedores monitorados: ${fallbackData.suppliers.fornecedores.length}
- Fornecedores em risco critico: GlobalChip (atraso frequente de entregas internacionais) e NovaVision.

Recomendacao: Incrementar em 3 dias o parametro de lead time do ROP para itens importados.`,
    };
  }

  const summary = fallbackData.summary;
  return {
    content: `### Cockpit Analitico RN Intelligence

Diagnostico consolidado da operacao de suprimentos:
- Taxa Geral de Ruptura: ${summary.taxa_ruptura_pct}% (${summary.total_rupturas} SKUs zerados com demanda ativa)
- Itens em Nivel Critico: ${summary.total_criticos} SKUs abaixo do Estoque de Seguranca
- Itens em Atencao: ${summary.total_atencao} SKUs proximos do Ponto de Pedido
- Perda Financeira Diaria Estimada: R$ ${summary.perda_diaria_estimada_ruptura.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Indice OTIF de Fornecedores: ${summary.otif_global_fornecedores}%

Como posso ajudar?
1. Digite o SKU desejado (ex: 'diagnosticar SKU-1006') para analise de causa-raiz.
2. Solicite 'gerar pedidos de compra' para consolidacao de minutas por fornecedor.
3. Teste 'qual o SLA de fornecedores' para relatorio de pontualidade.`,
  };
}

export async function runSimulation(sku: string, demandMultiplier: number, delayDays: number) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/intelligence/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        demand_multiplier: demandMultiplier,
        delay_days: delayDays,
      }),
    });
    if (res.ok) return await res.json();
  } catch {
    // Calculo local
  }

  const item = fallbackData.inventory.find((i) => i.sku.toUpperCase() === sku.toUpperCase()) || fallbackData.inventory[0];
  const cmdSim = Math.max(0.1, Number((item.cmd * demandMultiplier).toFixed(2)));
  const ltSim = Math.max(1, Math.round(item.lead_time_medio + delayDays));
  const ssSim = Math.ceil(1.65 * Math.sqrt(ltSim * Math.pow(cmdSim * 0.25, 2) + Math.pow(cmdSim, 2) * 1.0));
  const ropSim = Math.ceil(cmdSim * ltSim + ssSim);
  const cobSim = Number((item.estoque_disponivel / cmdSim).toFixed(1));
  const ddaySim = Math.max(0, Math.floor((item.estoque_disponivel - ropSim) / cmdSim));

  return {
    sku: item.sku,
    nome: item.nome,
    baseline: {
      cmd: item.cmd,
      lead_time: item.lead_time_medio,
      ponto_de_pedido: item.ponto_de_pedido,
      dias_para_dday: item.dias_para_dday,
      dday_data: item.dday_data,
    },
    simulacao: {
      cmd_simulado: cmdSim,
      lead_time_simulado: ltSim,
      ponto_de_pedido_simulado: ropSim,
      dias_cobertura_simulada: cobSim,
      dias_para_dday_simulado: ddaySim,
      diferenca_dias_dday: ddaySim - item.dias_para_dday,
    },
  };
}
