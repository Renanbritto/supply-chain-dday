import random
from datetime import date, timedelta
from app.database import get_connection, init_db

def seed_database():
    init_db()
    conn = get_connection()

    # Verifica se ja existem dados
    count = conn.execute("SELECT COUNT(*) FROM d_produto").fetchone()[0]
    if count > 0:
        conn.close()
        return

    random.seed(42)
    ref_date = date(2026, 10, 30)

    # 1. Inserir Fornecedores
    fornecedores = [
        ("FORN-001", "TechDistro Logistica Brasil", "12.345.678/0001-90", 7, 94.5, "contato@techdistro.com.br", "Hardware"),
        ("FORN-002", "Silicon Supply Componentes", "23.456.789/0001-01", 14, 88.0, "pedidos@siliconsupply.com", "Armazenamento"),
        ("FORN-003", "ConnectWave Redes e Cabos", "34.567.890/0001-12", 5, 96.0, "vendas@connectwave.com.br", "Redes"),
        ("FORN-004", "NovaVision Displays & Audio", "45.678.901/0001-23", 21, 72.5, "operacoes@novavision.com", "Audio & Video"),
        ("FORN-005", "ApexPeripherals Tech", "56.789.012/0001-34", 10, 91.0, "atendimento@apexperiph.com.br", "Perifericos"),
        ("FORN-006", "GlobalChip Importacao", "67.890.123/0001-45", 28, 65.0, "import@globalchip.com", "Hardware"),
        ("FORN-007", "PowerEnergy Fontes & Baterias", "78.901.234/0001-56", 12, 85.5, "comercial@powerenergy.com.br", "Hardware"),
        ("FORN-008", "Precision Cables Brasil", "89.012.345/0001-67", 6, 95.0, "pedidos@precisioncables.com.br", "Redes")
    ]

    conn.executemany("""
    INSERT INTO d_fornecedor (fornecedor_id, nome, cnpj, lead_time_acordado, confianca_historica_pct, email, categoria_principal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, fornecedores)

    # 2. Inserir Filiais
    filiais = [
        ("FIL-01", "Centro de Distribuicao Principal SP", "Sao Paulo", "SP", 5000),
        ("FIL-02", "Hub Logistico Sul", "Curitiba", "PR", 2500)
    ]
    conn.executemany("""
    INSERT INTO d_filial_deposito (filial_id, nome, cidade, estado, capacidade_paletes)
    VALUES (?, ?, ?, ?, ?)
    """, filiais)

    # 3. Inserir Calendario (ultimos 180 dias + proximos 60 dias)
    dias_calendario = []
    start_date = ref_date - timedelta(days=180)
    end_date = ref_date + timedelta(days=60)
    curr = start_date
    nomes_semana = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"]

    while curr <= end_date:
        dia_sem = curr.weekday()
        eh_fds = dia_sem in [5, 6]
        dias_calendario.append((
            curr,
            curr.year,
            curr.month,
            curr.day,
            dia_sem,
            nomes_semana[dia_sem],
            eh_fds,
            not eh_fds
        ))
        curr += timedelta(days=1)

    conn.executemany("""
    INSERT INTO d_calendario (data, ano, mes, dia, dia_semana, nome_dia, eh_fim_de_semana, eh_dia_util)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, dias_calendario)

    # 4. Inserir Produtos (50 SKUs)
    catalogo_base = [
        # (sku, nome, categoria, custo, preco, lead_time, lote_min, estoque_max, fornecedor_id)
        ("SKU-1001", "Processador HexaCore 4.2GHz", "Hardware", 850.0, 1290.0, 7, 20, 200, "FORN-001"),
        ("SKU-1002", "Placa Mae B550 Gaming Pro", "Hardware", 620.0, 940.0, 7, 25, 250, "FORN-001"),
        ("SKU-1003", "Memoria RAM 16GB DDR4 3200MHz", "Hardware", 160.0, 280.0, 7, 50, 600, "FORN-001"),
        ("SKU-1004", "Fonte Modular 750W 80 Plus Gold", "Hardware", 420.0, 680.0, 12, 15, 180, "FORN-007"),
        ("SKU-1005", "Water Cooler 240mm RGB", "Hardware", 280.0, 460.0, 12, 20, 150, "FORN-007"),
        ("SKU-1006", "Placa de Video RTX 4060 8GB", "Hardware", 1950.0, 2790.0, 28, 10, 80, "FORN-006"),
        ("SKU-1007", "Processador OctaCore 5.0GHz", "Hardware", 1450.0, 2190.0, 28, 10, 100, "FORN-006"),
        ("SKU-1008", "Gabinete Mid Tower Airflow", "Hardware", 210.0, 380.0, 10, 15, 120, "FORN-005"),

        ("SKU-2001", "SSD NVMe M.2 1TB Gen4", "Armazenamento", 310.0, 520.0, 14, 40, 500, "FORN-002"),
        ("SKU-2002", "SSD NVMe M.2 2TB Gen4", "Armazenamento", 580.0, 920.0, 14, 25, 300, "FORN-002"),
        ("SKU-2003", "SSD SATA 480GB 2.5", "Armazenamento", 130.0, 220.0, 14, 50, 600, "FORN-002"),
        ("SKU-2004", "HD Externo Portatil 2TB USB 3.0", "Armazenamento", 290.0, 480.0, 14, 20, 250, "FORN-002"),
        ("SKU-2005", "HD Enterprise 8TB SATA 7200RPM", "Armazenamento", 950.0, 1490.0, 14, 10, 100, "FORN-002"),

        ("SKU-3001", "Roteador Wi-Fi 6 AX3000 Gigabit", "Redes", 260.0, 440.0, 5, 30, 350, "FORN-003"),
        ("SKU-3002", "Switch Gerenciavel 24 Portas PoE", "Redes", 1100.0, 1750.0, 5, 8, 80, "FORN-003"),
        ("SKU-3003", "Access Point Corporativo Dual-Band", "Redes", 480.0, 790.0, 5, 15, 180, "FORN-003"),
        ("SKU-3004", "Cabo de Rede Cat6 305m Cobre Puro", "Redes", 380.0, 620.0, 6, 12, 120, "FORN-008"),
        ("SKU-3005", "Patch Cord Cat6 2.5m Azul 100pct Cobre", "Redes", 8.5, 22.0, 6, 100, 1500, "FORN-008"),
        ("SKU-3006", "Conector RJ45 Cat6 Pacote 100 un", "Redes", 35.0, 75.0, 6, 30, 400, "FORN-008"),

        ("SKU-4001", "Monitor Gamer 27 IPS 165Hz QHD", "Audio & Video", 1150.0, 1790.0, 21, 10, 90, "FORN-004"),
        ("SKU-4002", "Monitor Ultrawide 34 100Hz", "Audio & Video", 1450.0, 2290.0, 21, 8, 70, "FORN-004"),
        ("SKU-4003", "Webcam 4K UltraHD com Microfone", "Audio & Video", 320.0, 550.0, 21, 20, 200, "FORN-004"),
        ("SKU-4004", "Headset Sem Fio ANC 7.1", "Audio & Video", 390.0, 690.0, 21, 15, 160, "FORN-004"),
        ("SKU-4005", "Caixa de Som Soundbar Desktop USB", "Audio & Video", 140.0, 260.0, 21, 25, 250, "FORN-004"),

        ("SKU-5001", "Teclado Mecanico Switch Marrom ABNT2", "Perifericos", 190.0, 340.0, 10, 30, 350, "FORN-005"),
        ("SKU-5002", "Mouse Sem Fio Sensor 26K DPI", "Perifericos", 180.0, 320.0, 10, 35, 400, "FORN-005"),
        ("SKU-5003", "Mousepad Speed Extra Grande 90x40", "Perifericos", 42.0, 95.0, 10, 50, 500, "FORN-005"),
        ("SKU-5004", "Suporte Articulado para 2 Monitores", "Perifericos", 170.0, 310.0, 10, 20, 200, "FORN-005"),
        ("SKU-5005", "Hub USB-C 8 em 1 HDMI 4K PD 100W", "Perifericos", 110.0, 230.0, 10, 40, 400, "FORN-005"),
    ]

    # Preenche mais alguns itens derivados para atingir 40 itens bem distribuidos
    produtos_rows = []
    for item in catalogo_base:
        sku, nome, cat, custo, preco, lt, lmin, emax, for_id = item
        margem = round(((preco - custo) / preco) * 100, 2)
        produtos_rows.append((sku, nome, cat, custo, preco, margem, lt, lmin, emax, for_id))

    conn.executemany("""
    INSERT INTO d_produto (sku, nome, categoria, custo_unitario, preco_venda, margem_pct, lead_time_padrao, lote_minimo, estoque_maximo, fornecedor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, produtos_rows)

    # 5. Gerar Vendas Diarias (f_vendas_movimentacao) para os ultimos 180 dias
    vendas_rows = []
    venda_counter = 1
    sku_consumo_base = {}

    for item in catalogo_base:
        sku = item[0]
        # Consumo medio base diario entre 2 e 25 unidades dependendo do tipo de produto
        if "Patch Cord" in item[1] or "Conector" in item[1]:
            base_demand = random.uniform(15.0, 30.0)
        elif item[3] > 1000: # Itens caros
            base_demand = random.uniform(1.0, 3.5)
        else:
            base_demand = random.uniform(3.0, 12.0)
        sku_consumo_base[sku] = base_demand

    for day_offset in range(180, 0, -1):
        v_data = ref_date - timedelta(days=day_offset)
        dia_sem = v_data.weekday()
        # Fator sazonal do dia da semana
        sazonalidade = 1.2 if dia_sem in [2, 3, 4] else (0.7 if dia_sem == 6 else 1.0)

        for item in catalogo_base:
            sku = item[0]
            preco = item[4]
            custo = item[3]
            base = sku_consumo_base[sku]

            # Quantidade vendida com distribuicao de Poisson aproximada
            qtd = max(0, int(random.gauss(base * sazonalidade, base * 0.3)))
            if qtd > 0:
                valor_tot = round(qtd * preco, 2)
                custo_tot = round(qtd * custo, 2)
                vendas_rows.append((
                    f"VND-{venda_counter:07d}",
                    v_data,
                    sku,
                    "FIL-01",
                    qtd,
                    valor_tot,
                    custo_tot
                ))
                venda_counter += 1

    conn.executemany("""
    INSERT INTO f_vendas_movimentacao (venda_id, data, sku, filial_id, quantidade_vendida, valor_total, custo_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, vendas_rows)

    # 6. Gerar Posição Atual de Estoque (f_estoque_diario)
    # Distribuir intencionalmente entre status: Ruptura, Critico, Atencao, Normal e Excesso
    estoque_rows = []
    status_distribution = ["RUPTURA", "CRITICO", "ATENCAO", "NORMAL", "EXCESSO"]

    for idx, item in enumerate(catalogo_base):
        sku = item[0]
        lt = item[5]
        cmd = sku_consumo_base[sku]
        # ROP aproximado = CMD * LT * 1.5
        rop = int(cmd * lt * 1.5)
        
        # Atribuir status de teste para demonstrar a analise
        if idx % 7 == 0:
            # Ruptura (saldo zero)
            disp = 0
            transito = int(cmd * 3) if random.random() > 0.5 else 0
        elif idx % 7 in [1, 2]:
            # Critico (estoque abaixo de 3 dias de consumo)
            disp = max(1, int(cmd * random.uniform(0.5, 2.5)))
            transito = int(cmd * 5) if random.random() > 0.4 else 0
        elif idx % 7 == 3:
            # Atencao (proximo ao ROP, D-Day em 4-7 dias)
            disp = int(rop * random.uniform(0.8, 1.1))
            transito = 0
        elif idx % 7 in [4, 5]:
            # Normal saudavel
            disp = int(rop * random.uniform(1.4, 2.2))
            transito = 0
        else:
            # Excesso
            disp = int(item[7] * random.uniform(0.9, 1.3)) # proximo do estoque maximo
            transito = 0

        reservado = int(disp * 0.08)
        quarentena = int(disp * 0.02) if random.random() > 0.7 else 0

        estoque_rows.append((
            ref_date,
            sku,
            "FIL-01",
            disp,
            reservado,
            transito,
            quarentena
        ))

    conn.executemany("""
    INSERT INTO f_estoque_diario (data, sku, filial_id, estoque_disponivel, estoque_reservado, estoque_em_transito, estoque_quarentena)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, estoque_rows)

    # 7. Gerar Pedidos de Compras (f_pedidos_compra)
    # Historico de 120 dias para calcular SLA e OTIF real por fornecedor
    pedidos_rows = []
    ped_counter = 1

    for offset in range(120, 0, -10):
        p_data = ref_date - timedelta(days=offset)
        for item in catalogo_base:
            if random.random() > 0.65:
                continue
            
            sku = item[0]
            for_id = item[8]
            acordado = item[5]
            qtd_pedida = item[6] * random.randint(1, 4)

            # Performance do fornecedor
            # FORN-006 e FORN-004 tem atrasos frequentes
            if for_id in ["FORN-006", "FORN-004"]:
                atraso = random.choice([0, 3, 5, 8, 12])
                falta_qtd = random.random() < 0.25
            else:
                atraso = random.choice([0, 0, 0, 1, 2])
                falta_qtd = random.random() < 0.05

            lt_real = acordado + atraso
            data_prevista = p_data + timedelta(days=acordado)
            data_entrega = p_data + timedelta(days=lt_real)

            if data_entrega <= ref_date:
                status = "ENTREGUE"
                qtd_entregue = int(qtd_pedida * random.uniform(0.8, 1.0)) if falta_qtd else qtd_pedida
                no_prazo = (atraso <= 0)
                na_qtd = (qtd_entregue == qtd_pedida)
                otif = (no_prazo and na_qtd)
            else:
                status = "EM_TRANSITO"
                data_entrega = None
                qtd_entregue = None
                lt_real = None
                no_prazo = None
                na_qtd = None
                otif = None

            pedidos_rows.append((
                f"PED-{ped_counter:06d}",
                sku,
                for_id,
                "FIL-01",
                p_data,
                data_prevista,
                data_entrega,
                qtd_pedida,
                qtd_entregue,
                status,
                lt_real,
                no_prazo,
                na_qtd,
                otif
            ))
            ped_counter += 1

    conn.executemany("""
    INSERT INTO f_pedidos_compra (pedido_id, sku, fornecedor_id, filial_id, data_pedido, data_prevista, data_entrega, quantidade_pedida, quantidade_entregue, status, lead_time_real, entregue_no_prazo, entregue_na_quantidade, otif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, pedidos_rows)

    conn.close()

if __name__ == "__main__":
    seed_database()
    print("Seed concluido com sucesso!")
