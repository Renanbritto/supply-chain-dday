from app.database import get_connection

def calculate_geo_supply_network():
    conn = get_connection()

    # 1. Centros de Distribuicao (Hubs) com volume em estoque consolidado
    query_hubs = """
    SELECT 
        d.filial_id,
        d.nome,
        d.cidade,
        d.estado,
        d.capacidade_paletes,
        d.lat,
        d.lng,
        COUNT(DISTINCT e.sku) as total_skus,
        SUM(e.estoque_disponivel) as total_unidades,
        SUM(e.estoque_disponivel * p.custo_unitario) as capital_estoque,
        COUNT(CASE WHEN e.estoque_disponivel = 0 THEN 1 END) as rupturas_locais
    FROM d_filial_deposito d
    LEFT JOIN f_estoque_diario e ON d.filial_id = e.filial_id AND e.data = (SELECT MAX(data) FROM f_estoque_diario)
    LEFT JOIN d_produto p ON e.sku = p.sku
    GROUP BY d.filial_id, d.nome, d.cidade, d.estado, d.capacidade_paletes, d.lat, d.lng
    ORDER BY capital_estoque DESC
    """
    df_hubs = conn.execute(query_hubs).df()

    hubs = []
    for _, row in df_hubs.iterrows():
        cap = int(row["capacidade_paletes"])
        unidades = int(row["total_unidades"]) if row["total_unidades"] else 0
        paletes_ocupados = min(cap, max(500, int(unidades / 40)))
        ocupacao_pct = round((paletes_ocupados / cap) * 100, 1)

        hubs.append({
            "id": row["filial_id"],
            "nome": row["nome"],
            "cidade": row["cidade"],
            "estado": row["estado"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "capacidade_paletes": cap,
            "paletes_ocupados": paletes_ocupados,
            "ocupacao_pct": ocupacao_pct,
            "total_skus": int(row["total_skus"]) if row["total_skus"] else 0,
            "capital_estoque": round(float(row["capital_estoque"]), 2) if row["capital_estoque"] else 0.0,
            "rupturas_locais": int(row["rupturas_locais"]) if row["rupturas_locais"] else 0
        })

    # 2. Fornecedores com Coordenadas e Performance
    query_forn = """
    SELECT 
        f.fornecedor_id,
        f.nome,
        f.categoria_principal,
        f.cidade,
        f.estado,
        f.lat,
        f.lng,
        f.lead_time_acordado,
        f.confianca_historica_pct,
        COUNT(CASE WHEN p.status = 'EM_TRANSITO' THEN 1 END) as remessas_em_transito
    FROM d_fornecedor f
    LEFT JOIN f_pedidos_compra p ON f.fornecedor_id = p.fornecedor_id
    GROUP BY f.fornecedor_id, f.nome, f.categoria_principal, f.cidade, f.estado, f.lat, f.lng, f.lead_time_acordado, f.confianca_historica_pct
    """
    df_forn = conn.execute(query_forn).df()

    fornecedores = []
    for _, row in df_forn.iterrows():
        fornecedores.append({
            "id": row["fornecedor_id"],
            "nome": row["nome"],
            "categoria": row["categoria_principal"],
            "cidade": row["cidade"],
            "estado": row["estado"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "lead_time_acordado": int(row["lead_time_acordado"]),
            "confianca_pct": float(row["confianca_historica_pct"]),
            "remessas_em_transito": int(row["remessas_em_transito"]) if row["remessas_em_transito"] else 0
        })

    # 3. Corredores Logísticos Ativos (Rotas em Transito)
    query_rotas = """
    SELECT 
        p.fornecedor_id,
        forn.nome as fornecedor_nome,
        forn.cidade as origem_cidade,
        forn.estado as origem_estado,
        forn.lat as origem_lat,
        forn.lng as origem_lng,
        p.filial_id,
        fil.nome as filial_nome,
        fil.cidade as destino_cidade,
        fil.estado as destino_estado,
        fil.lat as destino_lat,
        fil.lng as destino_lng,
        p.modal_transporte,
        COUNT(p.pedido_id) as total_pedidos_rota,
        SUM(p.quantidade_pedida) as volume_total_unidades,
        SUM(p.quantidade_pedida * prod.custo_unitario) as valor_carga_total,
        AVG(DATE '2026-10-30' - p.data_pedido) as dias_em_transito
    FROM f_pedidos_compra p
    JOIN d_fornecedor forn ON p.fornecedor_id = forn.fornecedor_id
    JOIN d_filial_deposito fil ON p.filial_id = fil.filial_id
    JOIN d_produto prod ON p.sku = prod.sku
    WHERE p.status = 'EM_TRANSITO'
    GROUP BY 
        p.fornecedor_id, forn.nome, forn.cidade, forn.estado, forn.lat, forn.lng,
        p.filial_id, fil.nome, fil.cidade, fil.estado, fil.lat, fil.lng,
        p.modal_transporte
    ORDER BY valor_carga_total DESC
    """
    df_rotas = conn.execute(query_rotas).df()
    conn.close()

    rotas = []
    total_volume_transito = 0
    total_valor_transito = 0.0

    for idx, row in df_rotas.iterrows():
        vol = int(row["volume_total_unidades"])
        val = round(float(row["valor_carga_total"]), 2)
        total_volume_transito += vol
        total_valor_transito += val

        dias_transito = round(float(row["dias_em_transito"]), 1)
        # Classifica status da rota
        if dias_transito > 20:
            status_rota = "CRITICAL" # atraso severo no corredor
        elif dias_transito > 10:
            status_rota = "DELAYED"
        else:
            status_rota = "ON_TIME"

        rotas.append({
            "rota_id": f"ROTA-{idx+1:03d}",
            "fornecedor_id": row["fornecedor_id"],
            "fornecedor_nome": row["fornecedor_nome"],
            "origem": {
                "cidade": row["origem_cidade"],
                "estado": row["origem_estado"],
                "lat": float(row["origem_lat"]),
                "lng": float(row["origem_lng"])
            },
            "filial_id": row["filial_id"],
            "filial_nome": row["filial_nome"],
            "destino": {
                "cidade": row["destino_cidade"],
                "estado": row["destino_estado"],
                "lat": float(row["destino_lat"]),
                "lng": float(row["destino_lng"])
            },
            "modal": row["modal_transporte"],
            "pedidos_count": int(row["total_pedidos_rota"]),
            "volume_unidades": vol,
            "valor_carga": val,
            "dias_em_transito": dias_transito,
            "status_rota": status_rota
        })

    return {
        "hubs": hubs,
        "fornecedores": fornecedores,
        "rotas": rotas,
        "resumo": {
            "total_hubs": len(hubs),
            "total_fornecedores": len(fornecedores),
            "total_corredores_ativos": len(rotas),
            "volume_total_transito": total_volume_transito,
            "valor_total_transito": round(total_valor_transito, 2)
        }
    }

