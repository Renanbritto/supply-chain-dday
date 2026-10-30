from app.engine.dday import calculate_dday_inventory
from app.engine.sla import calculate_supplier_sla
from app.database import get_connection

def get_inventory_health_summary():
    inventory = calculate_dday_inventory()
    sla_data = calculate_supplier_sla()

    total_skus = len(inventory)
    rupturas = [item for item in inventory if item["status_urgencia"] == "RUPTURA"]
    criticos = [item for item in inventory if item["status_urgencia"] == "CRITICO"]
    atencao = [item for item in inventory if item["status_urgencia"] == "ATENCAO"]
    excesso = [item for item in inventory if item["status_urgencia"] == "EXCESSO"]

    capital_total_estoque = sum(item["valor_estoque_atual"] for item in inventory)
    perda_diaria_ruptura = sum(item["receita_perdida_diaria"] for item in rupturas)
    investimento_sugerido_compras = sum(item["sugestao_compra_valor"] for item in rupturas + criticos)

    return {
        "total_skus": total_skus,
        "total_rupturas": len(rupturas),
        "total_criticos": len(criticos),
        "total_atencao": len(atencao),
        "total_excesso": len(excesso),
        "taxa_ruptura_pct": round((len(rupturas) / max(1, total_skus)) * 100, 1),
        "capital_total_estoque": round(capital_total_estoque, 2),
        "perda_diaria_estimada_ruptura": round(perda_diaria_ruptura, 2),
        "investimento_necessario_compras": round(investimento_sugerido_compras, 2),
        "otif_global_fornecedores": sla_data.get("otif_global", 0.0),
        "skus_urgentes": [
            {
                "sku": item["sku"],
                "nome": item["nome"],
                "status": item["status_urgencia"],
                "dias_para_dday": item["dias_para_dday"],
                "dday_data": item["dday_data"],
                "sugestao_compra_qtd": item["sugestao_compra_qtd"]
            }
            for item in (rupturas + criticos)[:8]
        ]
    }

def explain_sku_root_cause(sku_id: str):
    inventory = calculate_dday_inventory()
    target_item = next((item for item in inventory if item["sku"].upper() == sku_id.upper()), None)

    if not target_item:
        return {"erro": f"SKU {sku_id} nao encontrado no catalogo."}

    conn = get_connection()

    # 1. Historico de vendas recentes (ultimos 15 dias vs anteriores)
    query_vendas_recentes = """
    SELECT 
        AVG(CASE WHEN data >= DATE '2026-10-30' - INTERVAL 15 DAY THEN quantidade_vendida END) as media_15dias,
        AVG(CASE WHEN data < DATE '2026-10-30' - INTERVAL 15 DAY THEN quantidade_vendida END) as media_anterior
    FROM f_vendas_movimentacao
    WHERE sku = ?
    """
    row_vendas = conn.execute(query_vendas_recentes, [target_item["sku"]]).fetchone()
    media_15d = float(row_vendas[0]) if row_vendas and row_vendas[0] else target_item["cmd"]
    media_ant = float(row_vendas[1]) if row_vendas and row_vendas[1] else target_item["cmd"]
    variacao_demanda_pct = round(((media_15d - media_ant) / max(0.1, media_ant)) * 100, 1)

    # 2. Historico de pedidos do fornecedor deste SKU
    query_pedidos = """
    SELECT 
        pedido_id, data_pedido, data_prevista, data_entrega, status, lead_time_real, entregue_no_prazo, otif
    FROM f_pedidos_compra
    WHERE sku = ?
    ORDER BY data_pedido DESC
    LIMIT 5
    """
    pedidos_recentes = conn.execute(query_pedidos, [target_item["sku"]]).df().to_dict(orient="records")
    conn.close()

    # Avaliacao de causas
    fatores = []
    if variacao_demanda_pct > 25.0:
        fatores.append(f"Pico de consumo recente: a demanda nos ultimos 15 dias subiu {variacao_demanda_pct}% acima da media historica.")
    elif variacao_demanda_pct < -25.0:
        fatores.append(f"Queda expressiva de consumo: reducao de {abs(variacao_demanda_pct)}% na saida recente.")

    atrasos_fornecedor = [p for p in pedidos_recentes if p.get("entregue_no_prazo") is False]
    if atrasos_fornecedor:
        fatores.append(f"Instabilidade do fornecedor: {len(atrasos_fornecedor)} dos ultimos {len(pedidos_recentes)} pedidos sofreram atrasos na entrega.")

    if target_item["estoque_em_transito"] > 0:
        fatores.append(f"Ha lote em transito: {target_item['estoque_em_transito']} unidades ja faturadas e aguardando recebimento fisico.")
    else:
        fatores.append("Nenhum pedido de reposicao em aberto no momento.")

    return {
        "sku": target_item["sku"],
        "nome": target_item["nome"],
        "categoria": target_item["categoria"],
        "fornecedor": target_item["fornecedor_nome"],
        "status_urgencia": target_item["status_urgencia"],
        "estoque_disponivel": target_item["estoque_disponivel"],
        "estoque_seguranca": target_item["estoque_seguranca"],
        "ponto_de_pedido": target_item["ponto_de_pedido"],
        "dias_cobertura": target_item["dias_cobertura"],
        "dday_data": target_item["dday_data"],
        "dias_para_dday": target_item["dias_para_dday"],
        "variacao_demanda_pct": variacao_demanda_pct,
        "fatores_identificados": fatores,
        "pedidos_recentes": pedidos_recentes,
        "sugestao_imediata": {
            "comprar_unidades": target_item["sugestao_compra_qtd"],
            "custo_total": target_item["sugestao_compra_valor"]
        }
    }

def simulate_what_if_scenario(sku_id: str, demand_multiplier: float = 1.0, additional_delay_days: int = 0):
    inventory = calculate_dday_inventory()
    target_item = next((item for item in inventory if item["sku"].upper() == sku_id.upper()), None)

    if not target_item:
        return {"erro": f"SKU {sku_id} nao encontrado."}

    cmd_original = target_item["cmd"]
    cmd_simulado = max(0.1, round(cmd_original * demand_multiplier, 2))

    lead_time_original = target_item["lead_time_medio"]
    lead_time_simulado = max(1.0, round(lead_time_original + additional_delay_days, 1))

    disp = target_item["estoque_disponivel"]
    ss_original = target_item["estoque_seguranca"]
    rop_original = target_item["ponto_de_pedido"]

    # Recalcula SS e ROP para o cenario simulado
    ss_simulado = int(math.ceil(1.65 * math.sqrt(lead_time_simulado * (cmd_simulado * 0.25)**2 + (cmd_simulado**2) * 1.0)))
    rop_simulado = int(math.ceil((cmd_simulado * lead_time_simulado) + ss_simulado))

    # Recalcula dias ate ROP e D-Day
    dias_ate_rop_simulado = max(0, int((disp - rop_simulado) / cmd_simulado))
    dias_cobertura_simulada = round(disp / cmd_simulado, 1)

    return {
        "sku": target_item["sku"],
        "nome": target_item["nome"],
        "cenario_parametros": {
            "multiplicador_demanda": demand_multiplier,
            "dias_adicionais_atraso_fornecedor": additional_delay_days
        },
        "baseline": {
            "cmd": cmd_original,
            "lead_time": lead_time_original,
            "ponto_de_pedido": rop_original,
            "dias_para_dday": target_item["dias_para_dday"],
            "dday_data": target_item["dday_data"]
        },
        "simulacao": {
            "cmd_simulado": cmd_simulado,
            "lead_time_simulado": lead_time_simulado,
            "ponto_de_pedido_simulado": rop_simulado,
            "dias_cobertura_simulada": dias_cobertura_simulada,
            "dias_para_dday_simulado": dias_ate_rop_simulado,
            "diferenca_dias_dday": dias_ate_rop_simulado - target_item["dias_para_dday"]
        }
    }

def generate_purchase_draft(fornecedor_id: str = None):
    inventory = calculate_dday_inventory()
    
    # Filtra itens que necessitam compra
    itens_para_compra = [
        item for item in inventory 
        if item["sugestao_compra_qtd"] > 0
    ]

    if fornecedor_id:
        itens_para_compra = [
            item for item in itens_para_compra 
            if item.get("fornecedor_id") == fornecedor_id
        ]

    # Agrupa por fornecedor
    agrupado = {}
    for item in itens_para_compra:
        f_id = item["fornecedor_id"] or "OUTROS"
        f_nome = item["fornecedor_nome"] or "Fornecedor Nao Identificado"
        
        if f_id not in agrupado:
            agrupado[f_id] = {
                "fornecedor_id": f_id,
                "fornecedor_nome": f_nome,
                "total_itens": 0,
                "valor_total_pedido": 0.0,
                "itens": []
            }
        
        agrupado[f_id]["total_itens"] += 1
        agrupado[f_id]["valor_total_pedido"] += item["sugestao_compra_valor"]
        agrupado[f_id]["itens"].append({
            "sku": item["sku"],
            "nome": item["nome"],
            "status": item["status_urgencia"],
            "estoque_atual": item["estoque_disponivel"],
            "ponto_pedido": item["ponto_de_pedido"],
            "dias_cobertura": item["dias_cobertura"],
            "dday_data": item["dday_data"],
            "quantidade_sugerida": item["sugestao_compra_qtd"],
            "custo_unitario": item["custo_unitario"],
            "custo_total": item["sugestao_compra_valor"]
        })

    for f_id in agrupado:
        agrupado[f_id]["valor_total_pedido"] = round(agrupado[f_id]["valor_total_pedido"], 2)

    return list(agrupado.values())
