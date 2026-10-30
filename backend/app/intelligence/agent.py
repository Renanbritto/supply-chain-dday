import re
from app.intelligence.tools import (
    get_inventory_health_summary,
    explain_sku_root_cause,
    simulate_what_if_scenario,
    generate_purchase_draft
)
from app.engine.sla import calculate_supplier_sla

def process_copilot_message(user_message: str):
    msg = user_message.strip().lower()

    # 1. Identificar se o usuario solicitou analise de um SKU especifico
    sku_match = re.search(r"sku[-_ ]?([0-9]{4})", msg, re.IGNORECASE)
    
    # Intencao: Simulacao What-If
    if "simul" in msg or "e se" in msg or "what-if" in msg:
        sku_id = f"SKU-{sku_match.group(1)}" if sku_match else "SKU-1006"
        # Tenta extrair dias de atraso ou aumento de demanda
        atraso_match = re.search(r"(\d+)\s*dias?", msg)
        atraso = int(atraso_match.group(1)) if atraso_match else 5
        
        mult_demanda = 1.0
        if "demanda" in msg and ("dobr" in msg or "100%" in msg):
            mult_demanda = 2.0
        elif "aumento" in msg or "crescimento" in msg:
            mult_demanda = 1.3

        simulacao = simulate_what_if_scenario(sku_id, demand_multiplier=mult_demanda, additional_delay_days=atraso)
        
        if "erro" in simulacao:
            return {"content": f"Erro na simulacao: {simulacao['erro']}", "tool_data": simulacao}

        base = simulacao["baseline"]
        sim = simulacao["simulacao"]
        
        markdown_response = f"""### Simulacao de Cenario: {simulacao['nome']} ({simulacao['sku']})

Parametros aplicados no modelo:
- Fator de Demanda: {mult_demanda}x do historico
- Atraso adicional no fornecedor: +{atraso} dias

Comparativo Direto:
- Consumo Medio Diario (CMD): {base['cmd']} un/dia -> {sim['cmd_simulado']} un/dia
- Lead Time Efetivo: {base['lead_time']} dias -> {sim['lead_time_simulado']} dias
- Novo Ponto de Pedido (ROP): {base['ponto_de_pedido']} un -> {sim['ponto_de_pedido_simulado']} un
- Cobertura Restante: {sim['dias_cobertura_simulada']} dias
- Impacto no D-Day: O D-Day foi antecipado em {abs(sim['diferenca_dias_dday'])} dias.

Recomendacao Estrategica:
Aumentar o lote de seguranca imediatamente para compensar a variabilidade adicional simulada e renegociar o lead time com o fornecedor.
"""
        return {"content": markdown_response, "tool_data": simulacao}

    # Intencao: Diagnostico de SKU
    if sku_match or "por que" in msg or "causa" in msg or "motivo" in msg:
        sku_id = f"SKU-{sku_match.group(1)}" if sku_match else "SKU-1006"
        diagnostico = explain_sku_root_cause(sku_id)

        if "erro" in diagnostico:
            return {"content": f"Nao foi possivel diagnosticar: {diagnostico['erro']}", "tool_data": diagnostico}

        fatores_md = "\n".join([f"- {f}" for f in diagnostico["fatores_identificados"]])
        sugestao = diagnostico["sugestao_imediata"]

        markdown_response = f"""### Diagnostico de Causa-Raiz: {diagnostico['nome']} ({diagnostico['sku']})

- Categoria: {diagnostico['categoria']}
- Fornecedor: {diagnostico['fornecedor']}
- Status Operacional: {diagnostico['status_urgencia']}
- Estoque Disponivel: {diagnostico['estoque_disponivel']} un (Ponto de Pedido: {diagnostico['ponto_de_pedido']} un)
- Cobertura Atual: {diagnostico['dias_cobertura']} dias
- Data Limite de Pedido (D-Day): {diagnostico['dday_data']} (restam {diagnostico['dias_para_dday']} dias)

Fatores Identificados pelo Motor Analitico:
{fatores_md}

Acao Prescritiva Recomendada:
- Emissao de ordem de compra emergencial para {sugestao['comprar_unidades']} unidades.
- Investimento estimado: R$ {sugestao['custo_total']:,.2f}.
"""
        return {"content": markdown_response, "tool_data": diagnostico}

    # Intencao: Minuta de Pedido de Compra
    if "pedido" in msg or "comprar" in msg or "minuta" in msg or "ordem" in msg:
        drafts = generate_purchase_draft()
        
        if not drafts:
            return {
                "content": "Nao ha necessidades criticas de compra identificadas no momento. Todos os itens operam dentro da faixa segura.",
                "tool_data": []
            }

        resumo_pedidos = []
        for d in drafts[:3]:
            resumo_pedidos.append(
                f"- Fornecedor: {d['fornecedor_nome']} | Total Itens: {d['total_itens']} | Valor do Pedido: R$ {d['valor_total_pedido']:,.2f}"
            )

        markdown_response = f"""### Minutas de Pedidos de Compras Geradas

O motor RN Intelligence consolidou as necessidades de reposicao agrupadas por fornecedor para garantir cumprimento de lote minimo e reducao de frete:

{chr(10).join(resumo_pedidos)}

Total de fornecedores acionados: {len(drafts)}
Total consolidado para reposicao: R$ {sum(d['valor_total_pedido'] for d in drafts):,.2f}

Voce pode revisar as ordens detalhadas por SKU na tabela de inventario ou clicar para exportar o pedido formal.
"""
        return {"content": markdown_response, "tool_data": drafts}

    # Intencao: Fornecedores / SLA / OTIF
    if "fornecedor" in msg or "sla" in msg or "otif" in msg or "prazo" in msg:
        sla_data = calculate_supplier_sla()
        top_criticos = [f for f in sla_data["fornecedores"] if f["status_sla"] == "CRITICO"]
        
        criticos_md = "\n".join([
            f"- {f['nome']}: OTIF de {f['otif_pct']}% | Atraso medio de +{f['gap_lead_time_dias']} dias" 
            for f in top_criticos[:3]
        ])

        markdown_response = f"""### Panorama de SLA e Desempenho de Fornecedores

- Indice OTIF Global da Operacao: {sla_data['otif_global']}%
- Total de pedidos auditados: {sla_data['total_pedidos_avaliados']}

Fornecedores com Risco Logistico (SLA Critico):
{criticos_md if criticos_md else '- Nenhum fornecedor em estado critico atualmente.'}

Recomendacao:
Aplicar penalidade de lead time (+3 a +5 dias no calculo de ROP) para fornecedores criticos para blindar os estoques locais contra atrasos cronicos.
"""
        return {"content": markdown_response, "tool_data": sla_data}

    # Resposta padrao: Resumo Geral de Saude de Estoque
    summary = get_inventory_health_summary()
    urgentes_md = "\n".join([
        f"- {item['sku']} ({item['nome']}): {item['status']} | D-Day em {item['dias_para_dday']} dias"
        for item in summary["skus_urgentes"][:4]
    ])

    markdown_response = f"""### Cockpit Analitico RN Intelligence

Diagnostico consolidado da operacao de suprimentos:
- Taxa Geral de Ruptura: {summary['taxa_ruptura_pct']}% ({summary['total_rupturas']} SKUs zerados com demanda ativa)
- Itens em Nivel Critico: {summary['total_criticos']} SKUs abaixo do Estoque de Seguranca
- Itens em Atencao: {summary['total_atencao']} SKUs proximos do Ponto de Pedido
- Perda Financeira Diaria Estimada: R$ {summary['perda_diaria_estimada_ruptura']:,.2f}
- Indice OTIF de Fornecedores: {summary['otif_global_fornecedores']}%

SKUs com Maior Urgencia no Motor D-Day:
{urgentes_md}

Como posso ajudar?
1. Digite o codigo de um SKU (ex: 'diagnosticar SKU-1006') para analise de causa-raiz.
2. Solicite 'gerar pedidos de compra' para consolidacao de minutas por fornecedor.
3. Teste 'simular atraso de 7 dias no fornecedor' para analise de impacto what-if.
"""
    return {"content": markdown_response, "tool_data": summary}
