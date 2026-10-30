import math
from app.database import get_connection

def calculate_rop_for_all_skus(service_level_z=1.65): # 1.65 equivale a ~95% de nivel de servico
    conn = get_connection()
    
    # 1. Consulta metricas de vendas dos ultimos 90 dias por SKU
    query_vendas = """
    SELECT 
        v.sku,
        AVG(v.quantidade_vendida) as media_demanda_diaria,
        STDDEV_SAMP(v.quantidade_vendida) as desvio_demanda_diaria
    FROM f_vendas_movimentacao v
    WHERE v.data >= DATE '2026-10-30' - INTERVAL 90 DAY
    GROUP BY v.sku
    """
    df_vendas = conn.execute(query_vendas).df()

    # 2. Consulta historico de lead time de entregas dos ultimos 120 dias
    query_lt = """
    SELECT 
        sku,
        AVG(lead_time_real) as media_lead_time_real,
        STDDEV_SAMP(lead_time_real) as desvio_lead_time_real
    FROM f_pedidos_compra
    WHERE status = 'ENTREGUE' AND lead_time_real IS NOT NULL
    GROUP BY sku
    """
    df_lt = conn.execute(query_lt).df()

    # 3. Consulta dados cadastrais do produto e fornecedor
    query_prod = """
    SELECT 
        p.sku,
        p.nome,
        p.categoria,
        p.custo_unitario,
        p.preco_venda,
        p.margem_pct,
        p.lead_time_padrao,
        p.lote_minimo,
        p.estoque_maximo,
        p.fornecedor_id,
        f.nome as fornecedor_nome,
        f.lead_time_acordado
    FROM d_produto p
    LEFT JOIN d_fornecedor f ON p.fornecedor_id = f.fornecedor_id
    """
    df_prod = conn.execute(query_prod).df()
    conn.close()

    # Mescla tabelas em Python
    merged = df_prod.merge(df_vendas, on="sku", how="left")
    merged = merged.merge(df_lt, on="sku", how="left")

    results = {}
    for _, row in merged.iterrows():
        sku = row["sku"]
        cmd = float(row["media_demanda_diaria"]) if row["media_demanda_diaria"] and not math.isnan(row["media_demanda_diaria"]) else 1.0
        sigma_d = float(row["desvio_demanda_diaria"]) if row["desvio_demanda_diaria"] and not math.isnan(row["desvio_demanda_diaria"]) else (cmd * 0.25)
        
        # Lead time real medio ou padrao cadastrado
        lt_medio = float(row["media_lead_time_real"]) if row["media_lead_time_real"] and not math.isnan(row["media_lead_time_real"]) else float(row["lead_time_acordado"])
        sigma_lt = float(row["desvio_lead_time_real"]) if row["desvio_lead_time_real"] and not math.isnan(row["desvio_lead_time_real"]) else 1.0

        # Formula de Estoque de Seguranca com dupla incerteza:
        # SS = Z * sqrt( (LT * sigma_D^2) + (D^2 * sigma_LT^2) )
        variancia_total = (lt_medio * (sigma_d ** 2)) + ((cmd ** 2) * (sigma_lt ** 2))
        ss = int(math.ceil(service_level_z * math.sqrt(max(0.1, variancia_total))))

        # Ponto de Pedido:
        # ROP = (CMD * LT) + SS
        rop = int(math.ceil((cmd * lt_medio) + ss))

        results[sku] = {
            "sku": sku,
            "cmd": round(cmd, 2),
            "sigma_d": round(sigma_d, 2),
            "lead_time_medio": round(lt_medio, 1),
            "sigma_lt": round(sigma_lt, 2),
            "estoque_seguranca": ss,
            "ponto_de_pedido": rop,
            "lote_minimo": int(row["lote_minimo"]),
            "estoque_maximo": int(row["estoque_maximo"]),
            "fornecedor_id": row["fornecedor_id"],
            "fornecedor_nome": row["fornecedor_nome"]
        }

    return results
