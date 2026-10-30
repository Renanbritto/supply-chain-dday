from app.database import get_connection

def calculate_supplier_sla():
    conn = get_connection()

    query = """
    SELECT 
        f.fornecedor_id,
        f.nome,
        f.cnpj,
        f.lead_time_acordado,
        f.categoria_principal,
        COUNT(p.pedido_id) as total_pedidos,
        COUNT(CASE WHEN p.status = 'ENTREGUE' THEN 1 END) as pedidos_entregues,
        COUNT(CASE WHEN p.status = 'EM_TRANSITO' THEN 1 END) as pedidos_em_transito,
        AVG(CASE WHEN p.status = 'ENTREGUE' THEN p.lead_time_real END) as lead_time_medio_real,
        STDDEV_SAMP(CASE WHEN p.status = 'ENTREGUE' THEN p.lead_time_real END) as variabilidade_lead_time,
        COUNT(CASE WHEN p.entregue_no_prazo = TRUE THEN 1 END) as entregas_no_prazo,
        COUNT(CASE WHEN p.entregue_na_quantidade = TRUE THEN 1 END) as entregas_na_quantidade,
        COUNT(CASE WHEN p.otif = TRUE THEN 1 END) as entregas_otif
    FROM d_fornecedor f
    LEFT JOIN f_pedidos_compra p ON f.fornecedor_id = p.fornecedor_id
    GROUP BY f.fornecedor_id, f.nome, f.cnpj, f.lead_time_acordado, f.categoria_principal
    ORDER BY total_pedidos DESC
    """
    df = conn.execute(query).df()
    conn.close()

    results = []
    total_entregues_geral = 0
    total_otif_geral = 0

    for _, row in df.iterrows():
        entregues = int(row["pedidos_entregues"]) if row["pedidos_entregues"] else 0
        total_entregues_geral += entregues

        if entregues > 0:
            on_time_pct = round((int(row["entregas_no_prazo"]) / entregues) * 100, 1)
            in_full_pct = round((int(row["entregas_na_quantidade"]) / entregues) * 100, 1)
            otif_pct = round((int(row["entregas_otif"]) / entregues) * 100, 1)
            total_otif_geral += int(row["entregas_otif"])
        else:
            on_time_pct = 100.0
            in_full_pct = 100.0
            otif_pct = 100.0

        lt_acordado = int(row["lead_time_acordado"])
        lt_real = round(float(row["lead_time_medio_real"]), 1) if row["lead_time_medio_real"] else float(lt_acordado)
        gap_dias = round(lt_real - lt_acordado, 1)
        var_lt = round(float(row["variabilidade_lead_time"]), 1) if row["variabilidade_lead_time"] else 0.0

        # Classificacao de Risco do Fornecedor
        if otif_pct >= 90.0 and gap_dias <= 1.0:
            status_sla = "EXCELENTE"
        elif otif_pct >= 80.0 and gap_dias <= 3.0:
            status_sla = "REGULAR"
        else:
            status_sla = "CRITICO"

        results.append({
            "fornecedor_id": row["fornecedor_id"],
            "nome": row["nome"],
            "categoria": row["categoria_principal"],
            "lead_time_acordado": lt_acordado,
            "lead_time_real": lt_real,
            "gap_lead_time_dias": gap_dias,
            "variabilidade_lead_time": var_lt,
            "total_pedidos": int(row["total_pedidos"]),
            "pedidos_entregues": entregues,
            "pedidos_em_transito": int(row["pedidos_em_transito"]),
            "on_time_pct": on_time_pct,
            "in_full_pct": in_full_pct,
            "otif_pct": otif_pct,
            "status_sla": status_sla
        })

    otif_global = round((total_otif_geral / max(1, total_entregues_geral)) * 100, 1)

    return {
        "fornecedores": results,
        "otif_global": otif_global,
        "total_pedidos_avaliados": total_entregues_geral
    }
