from app.database import get_connection

def calculate_abc_curve():
    conn = get_connection()
    
    query = """
    SELECT 
        v.sku,
        p.nome,
        p.categoria,
        p.custo_unitario,
        p.preco_venda,
        SUM(v.quantidade_vendida) as volume_total,
        SUM(v.valor_total) as faturamento_total,
        SUM(v.valor_total - v.custo_total) as margem_bruta_total
    FROM f_vendas_movimentacao v
    JOIN d_produto p ON v.sku = p.sku
    WHERE v.data >= DATE '2026-10-30' - INTERVAL 90 DAY
    GROUP BY v.sku, p.nome, p.categoria, p.custo_unitario, p.preco_venda
    ORDER BY faturamento_total DESC
    """
    df = conn.execute(query).df()
    conn.close()

    if df.empty:
        return {"items": [], "resumo": {}}

    total_faturamento = df["faturamento_total"].sum()
    total_volume = df["volume_total"].sum()
    total_margem = df["margem_bruta_total"].sum()

    # 1. Calculo ABC por Faturamento
    df["pct_faturamento"] = (df["faturamento_total"] / total_faturamento) * 100.0
    df["pct_acumulado_fat"] = df["pct_faturamento"].cumsum()

    def classificar_abc(pct):
        if pct <= 80.0:
            return "A"
        elif pct <= 95.0:
            return "B"
        return "C"

    df["classe_faturamento"] = df["pct_acumulado_fat"].apply(classificar_abc)

    # 2. Calculo ABC por Volume (Giro)
    df_vol = df.sort_values(by="volume_total", ascending=False).copy()
    df_vol["pct_vol"] = (df_vol["volume_total"] / total_volume) * 100.0
    df_vol["pct_acumulado_vol"] = df_vol["pct_vol"].cumsum()
    df_vol["classe_volume"] = df_vol["pct_acumulado_vol"].apply(classificar_abc)
    df["classe_volume"] = df_vol["classe_volume"]

    # 3. Montar Resumo Executivo
    resumo_faturamento = {
        "A": {
            "skus_count": int((df["classe_faturamento"] == "A").sum()),
            "faturamento": round(float(df[df["classe_faturamento"] == "A"]["faturamento_total"].sum()), 2),
            "pct_share": round(float(df[df["classe_faturamento"] == "A"]["faturamento_total"].sum() / total_faturamento * 100), 1)
        },
        "B": {
            "skus_count": int((df["classe_faturamento"] == "B").sum()),
            "faturamento": round(float(df[df["classe_faturamento"] == "B"]["faturamento_total"].sum()), 2),
            "pct_share": round(float(df[df["classe_faturamento"] == "B"]["faturamento_total"].sum() / total_faturamento * 100), 1)
        },
        "C": {
            "skus_count": int((df["classe_faturamento"] == "C").sum()),
            "faturamento": round(float(df[df["classe_faturamento"] == "C"]["faturamento_total"].sum()), 2),
            "pct_share": round(float(df[df["classe_faturamento"] == "C"]["faturamento_total"].sum() / total_faturamento * 100), 1)
        }
    }

    items = []
    for _, row in df.iterrows():
        items.append({
            "sku": row["sku"],
            "nome": row["nome"],
            "categoria": row["categoria"],
            "faturamento_total": round(float(row["faturamento_total"]), 2),
            "volume_total": int(row["volume_total"]),
            "margem_bruta_total": round(float(row["margem_bruta_total"]), 2),
            "pct_faturamento": round(float(row["pct_faturamento"]), 2),
            "pct_acumulado_fat": round(float(row["pct_acumulado_fat"]), 2),
            "classe_faturamento": row["classe_faturamento"],
            "classe_volume": row["classe_volume"]
        })

    return {
        "items": items,
        "totais": {
            "faturamento": round(float(total_faturamento), 2),
            "volume": int(total_volume),
            "margem": round(float(total_margem), 2)
        },
        "resumo": resumo_faturamento
    }
