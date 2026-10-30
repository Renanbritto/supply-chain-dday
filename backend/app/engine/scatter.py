from app.database import get_connection
from app.engine.dday import calculate_dday_inventory
from app.engine.abc_curve import calculate_abc_curve

def calculate_scatter_risk_matrix():
    inventory = calculate_dday_inventory()
    abc_data = calculate_abc_curve()
    
    # Mapeia classe ABC
    abc_map = {item["sku"]: item["classe_faturamento"] for item in abc_data.get("items", [])}
    fat_map = {item["sku"]: item["faturamento_total"] for item in abc_data.get("items", [])}

    if not inventory:
        return {"skus": [], "quadrantes_resumo": {}}

    # Determina medianas/medias para divisao dos 4 quadrantes
    lead_times = [item["lead_time_medio"] for item in inventory]
    faturamentos = [fat_map.get(item["sku"], 1000.0) for item in inventory]

    median_lt = sorted(lead_times)[len(lead_times) // 2] if lead_times else 10.0
    median_fat = sorted(faturamentos)[len(faturamentos) // 2] if faturamentos else 50000.0

    points = []
    q_counts = {"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0}
    q_valor = {"Q1": 0.0, "Q2": 0.0, "Q3": 0.0, "Q4": 0.0}

    for item in inventory:
        sku = item["sku"]
        lt = item["lead_time_medio"]
        fat = fat_map.get(sku, round(item["cmd"] * item["preco_venda"] * 90, 2))
        classe = abc_map.get(sku, "B")
        status = item["status_urgencia"]
        capital = item["valor_estoque_atual"]

        # Logica 4 Quadrantes:
        # Q1: Alto Giro (Y >= median_fat) & Alto Lead Time (X >= median_lt) -> Estrategico / Alto Risco
        # Q2: Alto Giro (Y >= median_fat) & Baixo Lead Time (X < median_lt) -> Fluxo Continuo
        # Q3: Baixo Giro (Y < median_fat) & Baixo Lead Time (X < median_lt) -> Rotineiro
        # Q4: Baixo Giro (Y < median_fat) & Alto Lead Time (X >= median_lt) -> Cauda Longa / Obsolescencia
        if fat >= median_fat and lt >= median_lt:
            q_id = "Q1"
            q_nome = "Estrategico / Alto Risco"
        elif fat >= median_fat and lt < median_lt:
            q_id = "Q2"
            q_nome = "Fluxo Continuo / Eficiente"
        elif fat < median_fat and lt < median_lt:
            q_id = "Q3"
            q_nome = "Operacao Rotineira"
        else:
            q_id = "Q4"
            q_nome = "Cauda Longa / Risco Obsolescencia"

        q_counts[q_id] += 1
        q_valor[q_id] += capital

        points.append({
            "sku": sku,
            "nome": item["nome"],
            "categoria": item["categoria"],
            "fornecedor": item["fornecedor_nome"],
            "lead_time": lt,
            "faturamento_90d": fat,
            "faturamento_mensal": round(fat / 3, 2),
            "capital_estoque": capital,
            "cmd": item["cmd"],
            "dias_cobertura": item["dias_cobertura"],
            "dias_para_dday": item["dias_para_dday"],
            "classe_abc": classe,
            "status": status,
            "quadrante_id": q_id,
            "quadrante_nome": q_nome,
            "sugestao_compra_qtd": item["sugestao_compra_qtd"],
            "sugestao_compra_valor": item["sugestao_compra_valor"]
        })

    # Resumo executivo dos quadrantes
    resumo_quadrantes = {
        "Q1": {
            "id": "Q1",
            "titulo": "Estrategico / Alto Risco",
            "descricao": "Alto faturamento com lead time longo. SKUs que exigem monitoramento diario de ruptura.",
            "total_skus": q_counts["Q1"],
            "capital_total": round(q_valor["Q1"], 2),
            "prioridade": "CRITICA"
        },
        "Q2": {
            "id": "Q2",
            "titulo": "Fluxo Continuo / Eficiente",
            "descricao": "Alto faturamento e reposicao agil. Operacao com alto giro e baixo capital parado.",
            "total_skus": q_counts["Q2"],
            "capital_total": round(q_valor["Q2"], 2),
            "prioridade": "ALTA"
        },
        "Q3": {
            "id": "Q3",
            "titulo": "Operacao Rotineira",
            "descricao": "Baixo faturamento e reposicao rapida. Itens estaveis com minimo impacto operacional.",
            "total_skus": q_counts["Q3"],
            "capital_total": round(q_valor["Q3"], 2),
            "prioridade": "MEDIA"
        },
        "Q4": {
            "id": "Q4",
            "titulo": "Cauda Longa / Risco Obsolescencia",
            "descricao": "Baixo giro com lead time dilatado. Risco de capital estagnado e quebras de lote.",
            "total_skus": q_counts["Q4"],
            "capital_total": round(q_valor["Q4"], 2),
            "prioridade": "ATENCAO"
        }
    }

    return {
        "total_pontos": len(points),
        "eixos": {
            "mediana_lead_time": median_lt,
            "mediana_faturamento": median_fat
        },
        "pontos": points,
        "quadrantes": resumo_quadrantes
    }

