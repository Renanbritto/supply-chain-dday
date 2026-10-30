import math
from datetime import date, timedelta
from app.database import get_connection
from app.engine.rop import calculate_rop_for_all_skus

def calculate_dday_inventory(ref_date=date(2026, 10, 30)):
    conn = get_connection()
    rop_data = calculate_rop_for_all_skus()

    # 1. Pega posicao atual de estoque mais recente
    query_estoque = """
    SELECT 
        e.sku,
        p.nome,
        p.categoria,
        p.custo_unitario,
        p.preco_venda,
        p.margem_pct,
        e.estoque_disponivel,
        e.estoque_reservado,
        e.estoque_em_transito,
        e.estoque_quarentena
    FROM f_estoque_diario e
    JOIN d_produto p ON e.sku = p.sku
    WHERE e.data = (SELECT MAX(data) FROM f_estoque_diario)
    """
    df_estoque = conn.execute(query_estoque).df()
    conn.close()

    items = []

    for _, row in df_estoque.iterrows():
        sku = row["sku"]
        rop_info = rop_data.get(sku, {})

        cmd = rop_info.get("cmd", 1.0)
        ss = rop_info.get("estoque_seguranca", 10)
        rop = rop_info.get("ponto_de_pedido", 20)
        lote_min = rop_info.get("lote_minimo", 10)
        estoque_max = rop_info.get("estoque_maximo", 100)
        lt_medio = rop_info.get("lead_time_medio", 7.0)

        disp = int(row["estoque_disponivel"])
        reservado = int(row["estoque_reservado"])
        transito = int(row["estoque_em_transito"])
        quarentena = int(row["estoque_quarentena"])
        
        custo_un = float(row["custo_unitario"])
        preco_un = float(row["preco_venda"])

        # Estoque Liquido / Virtual
        estoque_liquido = max(0, disp - reservado)
        estoque_virtual = estoque_liquido + transito

        # Dias de Cobertura
        dias_cobertura = round(estoque_liquido / cmd, 1) if cmd > 0 else 999.0
        dias_cobertura_virtual = round(estoque_virtual / cmd, 1) if cmd > 0 else 999.0

        # Dias ate atingir o Ponto de Pedido (D-Day countdown)
        dias_ate_rop = (estoque_liquido - rop) / cmd if cmd > 0 else 999.0

        # Determinacao do Status de Urgencia e Calculo da Data D-Day
        if disp == 0:
            status_urgencia = "RUPTURA"
            dias_para_dday = 0
            dday_data = ref_date
        elif estoque_liquido <= ss:
            status_urgencia = "CRITICO"
            dias_para_dday = 0
            dday_data = ref_date
        elif estoque_liquido <= rop:
            status_urgencia = "CRITICO"
            dias_para_dday = max(0, int(math.floor(dias_ate_rop)))
            dday_data = ref_date + timedelta(days=dias_para_dday)
        elif dias_ate_rop <= 5:
            status_urgencia = "ATENCAO"
            dias_para_dday = int(math.ceil(dias_ate_rop))
            dday_data = ref_date + timedelta(days=dias_para_dday)
        elif dias_cobertura > 90 and disp >= estoque_max:
            status_urgencia = "EXCESSO"
            dias_para_dday = 999
            dday_data = ref_date + timedelta(days=90)
        else:
            status_urgencia = "NORMAL"
            dias_para_dday = int(math.ceil(dias_ate_rop))
            dday_data = ref_date + timedelta(days=min(dias_para_dday, 120))

        # Sugestao de Pedido de Compra
        if status_urgencia in ["RUPTURA", "CRITICO", "ATENCAO"]:
            deficit = estoque_max - estoque_virtual
            if deficit > 0:
                lotes = math.ceil(deficit / lote_min)
                sugestao_qtd = lotes * lote_min
            else:
                sugestao_qtd = lote_min if status_urgencia in ["RUPTURA", "CRITICO"] and transito == 0 else 0
        else:
            sugestao_qtd = 0

        custo_sugerido = round(sugestao_qtd * custo_un, 2)
        valor_estoque_atual = round(disp * custo_un, 2)
        receita_potencial_perdida_diaria = round(cmd * preco_un, 2) if status_urgencia == "RUPTURA" else 0.0

        items.append({
            "sku": sku,
            "nome": row["nome"],
            "categoria": row["categoria"],
            "fornecedor_id": rop_info.get("fornecedor_id"),
            "fornecedor_nome": rop_info.get("fornecedor_nome"),
            "custo_unitario": custo_un,
            "preco_venda": preco_un,
            "margem_pct": float(row["margem_pct"]),
            "estoque_disponivel": disp,
            "estoque_reservado": reservado,
            "estoque_em_transito": transito,
            "estoque_quarentena": quarentena,
            "valor_estoque_atual": valor_estoque_atual,
            "cmd": cmd,
            "estoque_seguranca": ss,
            "ponto_de_pedido": rop,
            "estoque_maximo": estoque_max,
            "lead_time_medio": lt_medio,
            "dias_cobertura": dias_cobertura,
            "dias_cobertura_virtual": dias_cobertura_virtual,
            "dias_para_dday": dias_para_dday,
            "dday_data": str(dday_data),
            "status_urgencia": status_urgencia,
            "sugestao_compra_qtd": sugestao_qtd,
            "sugestao_compra_valor": custo_sugerido,
            "receita_perdida_diaria": receita_potencial_perdida_diaria
        })

    # Ordena com base na prioridade: RUPTURA primeiro, depois CRITICO, ATENCAO, etc.
    ordem_prioridade = {"RUPTURA": 0, "CRITICO": 1, "ATENCAO": 2, "NORMAL": 3, "EXCESSO": 4}
    items.sort(key=lambda x: (ordem_prioridade.get(x["status_urgencia"], 5), x["dias_para_dday"]))

    return items
