const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSummary() {
  const res = await fetch(`${API_BASE_URL}/api/analytics/summary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar indicadores executivos");
  return res.json();
}

export async function fetchInventory(params?: { categoria?: string; status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.categoria && params.categoria !== "ALL") query.append("categoria", params.categoria);
  if (params?.status && params.status !== "ALL") query.append("status", params.status);
  if (params?.search) query.append("search", params.search);

  const url = `${API_BASE_URL}/api/inventory/d-day${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar inventario e D-Day");
  return res.json();
}

export async function fetchAbcCurve() {
  const res = await fetch(`${API_BASE_URL}/api/analytics/abc`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar curva ABC");
  return res.json();
}

export async function fetchSuppliersSla() {
  const res = await fetch(`${API_BASE_URL}/api/suppliers/sla`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar SLA de fornecedores");
  return res.json();
}

export async function sendCopilotChat(message: string) {
  const res = await fetch(`${API_BASE_URL}/api/intelligence/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Falha na comunicacao com RN Intelligence");
  return res.json();
}

export async function runSimulation(sku: string, demandMultiplier: number, delayDays: number) {
  const res = await fetch(`${API_BASE_URL}/api/intelligence/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sku,
      demand_multiplier: demandMultiplier,
      delay_days: delayDays,
    }),
  });
  if (!res.ok) throw new Error("Falha na simulacao de cenario");
  return res.json();
}
