import random
from datetime import date, timedelta
from app.database import get_connection, init_db

def seed_database(force=False):
    init_db(force_recreate=force)
    conn = get_connection()

    if not force:
        count = conn.execute("SELECT COUNT(*) FROM d_produto").fetchone()[0]
        if count >= 80:
            conn.close()
            return

    random.seed(42)
    ref_date = date(2026, 10, 30)

    # 1. 12 Fornecedores Nacionais e Polos Industriais com Coordenadas Reais
    fornecedores = [
        # (id, nome, cnpj, lt, confianca, email, cat, cidade, estado, lat, lng)
        ("FORN-001", "TechDistro Logistica Brasil", "12.345.678/0001-90", 7, 94.5, "contato@techdistro.com.br", "Hardware", "Campinas", "SP", -22.9056, -47.0608),
        ("FORN-002", "Silicon Supply Componentes", "23.456.789/0001-01", 14, 88.0, "pedidos@siliconsupply.com", "Armazenamento", "Joinville", "SC", -26.3045, -48.8487),
        ("FORN-003", "ConnectWave Redes e Cabos", "34.567.890/0001-12", 5, 96.0, "vendas@connectwave.com.br", "Redes", "Curitiba", "PR", -25.4284, -49.2733),
        ("FORN-004", "NovaVision Displays & Audio", "45.678.901/0001-23", 21, 72.5, "operacoes@novavision.com", "Audio & Video", "Manaus", "AM", -3.1190, -60.0217),
        ("FORN-005", "ApexPeripherals Tech", "56.789.012/0001-34", 10, 91.0, "atendimento@apexperiph.com.br", "Perifericos", "Ilheus", "BA", -14.7889, -39.0494),
        ("FORN-006", "GlobalChip Importacao Portuaria", "67.890.123/0001-45", 28, 65.0, "import@globalchip.com", "Hardware", "Santos", "SP", -23.9608, -46.3339),
        ("FORN-007", "PowerEnergy Fontes & Nobreaks", "78.901.234/0001-56", 12, 85.5, "comercial@powerenergy.com.br", "Energia", "Betim", "MG", -19.9678, -44.1983),
        ("FORN-008", "Precision Cables Brasil", "89.012.345/0001-67", 6, 95.0, "pedidos@precisioncables.com.br", "Redes", "Porto Alegre", "RS", -30.0346, -51.2177),
        ("FORN-009", "Amazonia Chipset PIM", "90.123.456/0001-78", 18, 79.0, "vendas@amchipset.com.br", "Hardware", "Manaus", "AM", -3.1415, -59.9825),
        ("FORN-010", "Nordeste Cablagens Especiais", "01.234.567/0001-89", 9, 93.0, "contato@nordestecabos.com.br", "Redes", "Recife", "PE", -8.0476, -34.8770),
        ("FORN-011", "OpticFiber Transmissores Brasil", "11.222.333/0001-99", 8, 92.0, "suporte@opticfiber.com.br", "Redes", "Vitoria", "ES", -20.3155, -40.3128),
        ("FORN-012", "ThermalCooling Dissipadores", "22.333.444/0001-11", 11, 89.0, "pedidos@thermalcool.com.br", "Hardware", "Caxias do Sul", "RS", -29.1678, -51.1794)
    ]

    conn.executemany("""
    INSERT INTO d_fornecedor (fornecedor_id, nome, cnpj, lead_time_acordado, confianca_historica_pct, email, categoria_principal, cidade, estado, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, fornecedores)

    # 2. 5 Centros de Distribuicao Estrategicos (Hubs Nacionais)
    filiais = [
        ("CD-SP", "CD Central Cajamar", "Cajamar", "SP", 12000, -23.3556, -46.8778),
        ("HUB-SUL", "Hub Sul Curitiba", "Curitiba", "PR", 6500, -25.5000, -49.3000),
        ("HUB-NE", "Hub Nordeste Cabo", "Cabo de Santo Agostinho", "PE", 5800, -8.2833, -35.0333),
        ("HUB-CO", "Hub Centro-Oeste Aparecida", "Aparecida de Goiania", "GO", 4200, -16.8228, -49.2481),
        ("HUB-NO", "Hub Norte Manaus", "Manaus", "AM", 3500, -3.1000, -60.0000)
    ]
    conn.executemany("""
    INSERT INTO d_filial_deposito (filial_id, nome, cidade, estado, capacidade_paletes, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, filiais)

    # 3. Calendario (ultimos 180 dias + 60 dias a frente)
    dias_calendario = []
    start_date = ref_date - timedelta(days=180)
    end_date = ref_date + timedelta(days=60)
    curr = start_date
    nomes_semana = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"]

    while curr <= end_date:
        dia_sem = curr.weekday()
        eh_fds = dia_sem in [5, 6]
        dias_calendario.append((
            curr, curr.year, curr.month, curr.day, dia_sem,
            nomes_semana[dia_sem], eh_fds, not eh_fds
        ))
        curr += timedelta(days=1)

    conn.executemany("""
    INSERT INTO d_calendario (data, ano, mes, dia, dia_semana, nome_dia, eh_fim_de_semana, eh_dia_util)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, dias_calendario)

    # 4. Catalogo Rico e Densely Populated (120 SKUs em 6 Categorias)
    categorias_specs = {
        "Hardware": {
            "fornecedores": ["FORN-001", "FORN-006", "FORN-007", "FORN-009", "FORN-012"],
            "nomes": [
                ("Processador HexaCore 4.2GHz", 850.0, 1290.0, 7, 20, 200),
                ("Processador OctaCore 5.0GHz", 1450.0, 2190.0, 28, 10, 100),
                ("Processador DecaCore 5.4GHz Extreme", 2350.0, 3490.0, 28, 5, 50),
                ("Placa Mae B550 Gaming Pro", 620.0, 940.0, 7, 25, 250),
                ("Placa Mae X670E Carbon WiFi", 1750.0, 2690.0, 28, 10, 80),
                ("Placa Mae H610M Micro-ATX", 380.0, 580.0, 7, 30, 300),
                ("Memoria RAM 8GB DDR4 3200MHz", 95.0, 165.0, 7, 60, 800),
                ("Memoria RAM 16GB DDR4 3200MHz", 160.0, 280.0, 7, 50, 600),
                ("Memoria RAM 32GB DDR5 6000MHz RGB", 520.0, 850.0, 14, 20, 250),
                ("Placa de Video RTX 4060 8GB", 1950.0, 2790.0, 28, 10, 80),
                ("Placa de Video RTX 4070 Super 12GB", 3650.0, 5190.0, 28, 6, 60),
                ("Placa de Video RTX 4080 16GB OC", 6800.0, 9490.0, 28, 4, 30),
                ("Placa de Video RX 7600 XT 16GB", 1850.0, 2650.0, 18, 10, 70),
                ("Water Cooler 240mm RGB Black", 280.0, 460.0, 11, 20, 150),
                ("Water Cooler 360mm LCD Display", 590.0, 980.0, 11, 10, 90),
                ("Air Cooler Dual Tower 6 Heatpipes", 160.0, 280.0, 11, 25, 200),
                ("Gabinete Mid Tower Mesh Airflow", 210.0, 380.0, 7, 15, 120),
                ("Gabinete Full Tower Vidro Temperado", 450.0, 780.0, 7, 10, 80),
                ("Pasta Termica Alta Condutividade 4g", 25.0, 59.0, 7, 100, 1000),
                ("Kit 3 Fans 120mm PWM ARGB", 85.0, 160.0, 11, 40, 350)
            ]
        },
        "Armazenamento": {
            "fornecedores": ["FORN-002", "FORN-009"],
            "nomes": [
                ("SSD NVMe M.2 500GB PCIe 3.0", 160.0, 270.0, 14, 50, 600),
                ("SSD NVMe M.2 1TB Gen4 7000MBs", 310.0, 520.0, 14, 40, 500),
                ("SSD NVMe M.2 2TB Gen4 com Heatsink", 580.0, 920.0, 14, 25, 300),
                ("SSD NVMe M.2 4TB Gen4 Pro Enterprise", 1450.0, 2290.0, 14, 8, 80),
                ("SSD SATA 240GB 2.5 Basico", 75.0, 139.0, 14, 80, 900),
                ("SSD SATA 480GB 2.5", 130.0, 220.0, 14, 50, 600),
                ("SSD SATA 960GB 2.5", 220.0, 370.0, 14, 30, 400),
                ("HD Externo Portatil 1TB USB 3.0", 195.0, 320.0, 14, 30, 350),
                ("HD Externo Portatil 2TB USB 3.0", 290.0, 480.0, 14, 20, 250),
                ("HD Externo Portatil 4TB USB-C", 520.0, 830.0, 14, 15, 180),
                ("HD Enterprise 4TB SATA 7200RPM", 540.0, 890.0, 14, 15, 150),
                ("HD Enterprise 8TB SATA 7200RPM 256MB", 950.0, 1490.0, 14, 10, 100),
                ("HD Enterprise 16TB SATA 512MB Helium", 1750.0, 2790.0, 14, 6, 60),
                ("Storage NAS 4 Baias Quad-Core 2.5GbE", 2800.0, 4290.0, 18, 4, 30),
                ("Cartao MicroSD 128GB High Endurance", 45.0, 95.0, 14, 80, 800),
                ("Cartao MicroSD 256GB V30 4K", 85.0, 175.0, 14, 60, 600),
                ("Pen Drive USB 3.2 64GB Metalico", 18.0, 42.0, 14, 120, 1500),
                ("Pen Drive USB 3.2 128GB Dual Type-C", 38.0, 85.0, 14, 80, 1000),
                ("Gaveta Externa M.2 NVMe USB-C 10Gbps", 72.0, 149.0, 14, 30, 300),
                ("Docking Station 2 Baias Clonador HD/SSD", 160.0, 290.0, 14, 15, 150)
            ]
        },
        "Redes": {
            "fornecedores": ["FORN-003", "FORN-008", "FORN-010", "FORN-011"],
            "nomes": [
                ("Roteador Wi-Fi 6 AX1800 Gigabit", 180.0, 310.0, 5, 40, 400),
                ("Roteador Wi-Fi 6 AX3000 Gigabit Dual Band", 260.0, 440.0, 5, 30, 350),
                ("Roteador Wi-Fi 7 BE9300 Tri-Band Gamer", 890.0, 1490.0, 8, 10, 100),
                ("Sistema Mesh Wi-Fi 6 Kit 2 Unidades", 420.0, 690.0, 5, 20, 250),
                ("Sistema Mesh Wi-Fi 6 Kit 3 Unidades", 580.0, 940.0, 5, 15, 180),
                ("Switch Nao-Gerenciavel 8 Portas Gigabit", 65.0, 120.0, 5, 50, 500),
                ("Switch Nao-Gerenciavel 16 Portas Gigabit", 170.0, 290.0, 5, 25, 250),
                ("Switch Nao-Gerenciavel 24 Portas Gigabit", 260.0, 430.0, 5, 15, 180),
                ("Switch Gerenciavel 24 Portas PoE+ L2+", 1100.0, 1750.0, 5, 8, 80),
                ("Switch Gerenciavel 48 Portas SFP+ 10Gbps", 2800.0, 4390.0, 8, 4, 40),
                ("Access Point Corporativo Dual-Band PoE", 480.0, 790.0, 5, 15, 180),
                ("Access Point Wi-Fi 6 Outdoor Long Range", 720.0, 1190.0, 8, 10, 120),
                ("Cabo de Rede Cat6 305m Cobre Puro Azul", 380.0, 620.0, 6, 12, 120),
                ("Cabo de Rede Cat6A Blindado 305m 10Gbps", 680.0, 1090.0, 6, 8, 80),
                ("Patch Cord Cat6 1.5m Azul 100% Cobre", 5.5, 15.0, 6, 150, 2000),
                ("Patch Cord Cat6 2.5m Azul 100% Cobre", 8.5, 22.0, 6, 100, 1500),
                ("Patch Cord Cat6 5.0m Cinza 100% Cobre", 14.0, 34.0, 6, 80, 1000),
                ("Conector RJ45 Cat6 Pacote 100 un", 35.0, 75.0, 6, 30, 400),
                ("Patch Panel 24 Portas Cat6 Carregado", 115.0, 210.0, 6, 15, 150),
                ("Transceiver SFP+ 10GBase-SR 850nm 300m", 85.0, 160.0, 8, 25, 300)
            ]
        },
        "Audio & Video": {
            "fornecedores": ["FORN-004", "FORN-005"],
            "nomes": [
                ("Monitor Gamer 24 IPS 144Hz FHD 1ms", 720.0, 1140.0, 21, 15, 150),
                ("Monitor Gamer 27 IPS 165Hz QHD 1ms", 1150.0, 1790.0, 21, 10, 90),
                ("Monitor Gamer 27 OLED 240Hz 0.03ms", 3400.0, 4990.0, 21, 5, 40),
                ("Monitor Ultrawide 34 100Hz Curvo HDR", 1450.0, 2290.0, 21, 8, 70),
                ("Monitor Profissional 32 4K 99% sRGB", 2100.0, 3290.0, 21, 6, 50),
                ("Webcam Full HD 1080p com Microfone", 110.0, 210.0, 21, 30, 300),
                ("Webcam 4K UltraHD com Microfone Stereo", 320.0, 550.0, 21, 20, 200),
                ("Microfone Condensador USB com Pop Filter", 180.0, 330.0, 21, 25, 250),
                ("Microfone Dinamico Podcast XLR/USB", 420.0, 730.0, 21, 15, 150),
                ("Braco Articulado Profissional para Mic", 120.0, 230.0, 10, 20, 200),
                ("Headset Gamer USB 7.1 Surround RGB", 160.0, 290.0, 21, 30, 300),
                ("Headset Sem Fio ANC 7.1 Drivers 50mm", 390.0, 690.0, 21, 15, 160),
                ("Fone In-Ear TWS Bluetooth 5.3 ANC", 140.0, 270.0, 21, 40, 400),
                ("Placa de Captura de Video 4K60 HDR USB", 480.0, 820.0, 21, 12, 120),
                ("Ring Light 26cm com Tripe e Suporte Celular", 45.0, 98.0, 10, 40, 400),
                ("Iluminador Painel LED Softlight Bi-Color", 195.0, 360.0, 21, 15, 150),
                ("Caixa de Som Desktop 2.0 Madeira 42W", 240.0, 420.0, 21, 15, 160),
                ("Caixa de Som Soundbar Desktop USB", 140.0, 260.0, 21, 25, 250),
                ("Cabo HDMI 2.1 Ultra High Speed 8K 2m", 28.0, 65.0, 6, 60, 600),
                ("Cabo DisplayPort 1.4 8K 60Hz 2m", 32.0, 72.0, 6, 50, 500)
            ]
        },
        "Perifericos": {
            "fornecedores": ["FORN-005", "FORN-001"],
            "nomes": [
                ("Teclado Mecanico Switch Marrom ABNT2", 190.0, 340.0, 10, 30, 350),
                ("Teclado Mecanico Switch Vermelho RGB", 210.0, 370.0, 10, 25, 300),
                ("Teclado Sem Fio Low Profile Bluetooth", 260.0, 450.0, 10, 20, 220),
                ("Teclado Membrana Silencioso Escritorio", 48.0, 95.0, 10, 60, 600),
                ("Mouse Gamer Sensor 16K DPI RGB", 120.0, 220.0, 10, 40, 450),
                ("Mouse Sem Fio Sensor 26K DPI Ultraleve", 180.0, 320.0, 10, 35, 400),
                ("Mouse Ergonomico Vertical Sem Fio", 95.0, 180.0, 10, 30, 300),
                ("Mousepad Speed Grande 45x40cm", 25.0, 58.0, 10, 80, 800),
                ("Mousepad Speed Extra Grande 90x40cm", 42.0, 95.0, 10, 50, 500),
                ("Suporte Articulado a Gas para 1 Monitor", 110.0, 210.0, 10, 25, 250),
                ("Suporte Articulado para 2 Monitores USB", 170.0, 310.0, 10, 20, 200),
                ("Hub USB 3.0 4 Portas de Aluminio", 35.0, 75.0, 10, 50, 500),
                ("Hub USB-C 8 em 1 HDMI 4K PD 100W", 110.0, 230.0, 10, 40, 400),
                ("Docking Station USB-C Triplo Display", 380.0, 690.0, 10, 15, 150),
                ("Base Refrigerada para Notebook 17 pol", 65.0, 130.0, 10, 30, 300),
                ("Leitor Biometrico de Impressao Digital USB", 75.0, 149.0, 10, 20, 200),
                ("Tapete Protetor de Cadeira Gamer 120cm", 55.0, 120.0, 10, 20, 180),
                ("Apoio de Pulso Ergonomico em Gel Teclado", 22.0, 49.0, 10, 60, 600),
                ("Gamepad Sem Fio Hall Effect com Trigger", 160.0, 290.0, 10, 25, 250),
                ("Volante Gamer com Pedais Force Feedback", 1250.0, 1990.0, 21, 6, 60)
            ]
        },
        "Energia": {
            "fornecedores": ["FORN-007", "FORN-001"],
            "nomes": [
                ("Fonte 500W 80 Plus Bronze PFC Ativo", 180.0, 310.0, 12, 30, 300),
                ("Fonte 650W 80 Plus Bronze Modular", 270.0, 440.0, 12, 25, 250),
                ("Fonte Modular 750W 80 Plus Gold ATX 3.0", 420.0, 680.0, 12, 15, 180),
                ("Fonte Modular 850W 80 Plus Gold PCIe 5.0", 540.0, 890.0, 12, 12, 140),
                ("Fonte Modular 1000W 80 Plus Platinum", 880.0, 1420.0, 12, 8, 80),
                ("Nobreak Interativo 600VA Bivolt", 260.0, 430.0, 12, 20, 200),
                ("Nobreak Interativo 1200VA com Engate Bateria", 520.0, 860.0, 12, 12, 120),
                ("Nobreak Senoidal Online 2000VA Rack/Torre", 1850.0, 2890.0, 12, 6, 50),
                ("Filtro de Linha 8 Tomadas Clamper DPS", 45.0, 95.0, 7, 60, 600),
                ("Filtro de Linha 5 Tomadas Bivolt com USB", 32.0, 68.0, 7, 80, 800),
                ("Bateria Selada VRLA 12V 7Ah Nobreak", 65.0, 125.0, 12, 40, 400),
                ("Bateria Estacionaria 12V 45Ah Nobreak", 290.0, 490.0, 12, 10, 100),
                ("Carregador GaN 65W 3 Portas USB-C/USB-A", 75.0, 159.0, 10, 40, 400),
                ("Carregador GaN 100W USB-C PD 4 Portas", 130.0, 260.0, 10, 30, 300),
                ("Power Bank 20000mAh 65W Carregamento Rapido", 140.0, 270.0, 10, 25, 250),
                ("Power Bank 10000mAh Magnetico Sem Fio", 95.0, 190.0, 10, 30, 300),
                ("Cabo de Forca Tripolar 3x0.75mm 1.5m 10A", 6.5, 18.0, 7, 100, 1200),
                ("Cabo de Forca C13 para C14 1.8m para Servidor", 12.0, 29.0, 7, 50, 600),
                ("Inversor de Tensao 12V para 110V 500W Onda Pura", 190.0, 350.0, 12, 15, 150),
                ("Modulo de Tomadas Inteligente Wi-Fi com Medidor", 48.0, 99.0, 10, 40, 400)
            ]
        }
    }

    produtos_rows = []
    sku_consumo_base = {}
    sku_counter = 1001

    for cat_name, cat_data in categorias_specs.items():
        for prod_info in cat_data["nomes"]:
            nome, custo, preco, lt, lmin, emax = prod_info
            sku = f"SKU-{sku_counter}"
            sku_counter += 1
            for_id = random.choice(cat_data["fornecedores"])
            margem = round(((preco - custo) / preco) * 100, 2)
            produtos_rows.append((sku, nome, cat_name, custo, preco, margem, lt, lmin, emax, for_id))

            # Definicao do consumo base
            if "Cabo" in nome or "Patch Cord" in nome or "Filtro" in nome or "Pasta" in nome:
                base = random.uniform(18.0, 35.0)
            elif custo > 2000:
                base = random.uniform(0.8, 2.5)
            elif custo > 800:
                base = random.uniform(2.0, 6.0)
            else:
                base = random.uniform(5.0, 15.0)
            sku_consumo_base[sku] = (base, preco, custo)

    conn.executemany("""
    INSERT INTO d_produto (sku, nome, categoria, custo_unitario, preco_venda, margem_pct, lead_time_padrao, lote_minimo, estoque_maximo, fornecedor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, produtos_rows)

    # 5. Geracao de Vendas Historicas (15.000+ linhas nos ultimos 180 dias)
    vendas_rows = []
    venda_id_num = 1
    filiais_ids = ["CD-SP", "HUB-SUL", "HUB-NE", "HUB-CO", "HUB-NO"]

    for offset in range(180, 0, -1):
        v_data = ref_date - timedelta(days=offset)
        dia_sem = v_data.weekday()
        sazonalidade = 1.25 if dia_sem in [2, 3, 4] else (0.65 if dia_sem == 6 else 1.0)

        for prod in produtos_rows:
            sku = prod[0]
            base_demand, preco, custo = sku_consumo_base[sku]

            # Vendas em cada um dos 5 hubs
            for f_id in filiais_ids:
                if f_id == "CD-SP":
                    hub_weight = 0.45
                elif f_id in ["HUB-SUL", "HUB-NE"]:
                    hub_weight = 0.20
                else:
                    hub_weight = 0.075

                qtd = max(0, int(random.gauss(base_demand * hub_weight * sazonalidade, base_demand * 0.25)))
                if qtd > 0:
                    val_tot = round(qtd * preco, 2)
                    cus_tot = round(qtd * custo, 2)
                    vendas_rows.append((
                        f"VND-{venda_id_num:08d}",
                        v_data,
                        sku,
                        f_id,
                        qtd,
                        val_tot,
                        cus_tot
                    ))
                    venda_id_num += 1

    conn.executemany("""
    INSERT INTO f_vendas_movimentacao (venda_id, data, sku, filial_id, quantidade_vendida, valor_total, custo_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, vendas_rows)

    # 6. Gerar Posição Atual de Estoque em Todos os Hubs
    estoque_rows = []
    for idx, prod in enumerate(produtos_rows):
        sku = prod[0]
        base_demand, preco, custo = sku_consumo_base[sku]
        lt = prod[6]
        lmin = prod[7]
        emax = prod[8]
        rop_global = int(base_demand * lt * 1.5)

        for f_id in filiais_ids:
            weight = 0.45 if f_id == "CD-SP" else 0.15
            rop = max(5, int(rop_global * weight))
            
            # Distribuicao de status variada
            r_val = (idx + hash(f_id)) % 10
            if r_val == 0:
                # Ruptura completa
                disp = 0
                transito = int(lmin * random.choice([0, 1, 2]))
            elif r_val in [1, 2]:
                # Critico
                disp = max(1, int(rop * random.uniform(0.15, 0.6)))
                transito = int(lmin * random.choice([0, 1]))
            elif r_val in [3, 4]:
                # Atencao
                disp = int(rop * random.uniform(0.8, 1.1))
                transito = 0
            elif r_val in [5, 6, 7]:
                # Normal
                disp = int(rop * random.uniform(1.3, 2.0))
                transito = 0
            else:
                # Excesso
                disp = int(emax * weight * random.uniform(0.9, 1.2))
                transito = 0

            res = int(disp * 0.05)
            quar = int(disp * 0.02) if random.random() > 0.8 else 0

            estoque_rows.append((
                ref_date,
                sku,
                f_id,
                disp,
                res,
                transito,
                quar
            ))

    conn.executemany("""
    INSERT INTO f_estoque_diario (data, sku, filial_id, estoque_disponivel, estoque_reservado, estoque_em_transito, estoque_quarentena)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, estoque_rows)

    # 7. Historico de Pedidos de Compras com Modais Logísticos e SLA Real
    modais = ["Rodoviario Expresso", "Rodoviario Convencional", "Aereo Cargo", "Cabotagem Maritima"]
    pedidos_rows = []
    ped_counter = 1

    for offset in range(120, 0, -8):
        p_data = ref_date - timedelta(days=offset)
        for prod in produtos_rows:
            if random.random() > 0.45:
                continue

            sku = prod[0]
            for_id = prod[9]
            acordado = prod[6]
            lmin = prod[7]
            f_id = random.choice(filiais_ids)
            qtd_pedida = lmin * random.randint(1, 5)

            # Escolhe modal
            if for_id in ["FORN-004", "FORN-009"] and f_id != "HUB-NO":
                modal = "Cabotagem Maritima" if random.random() > 0.4 else "Aereo Cargo"
            else:
                modal = random.choice(modais[:2])

            # Risco por fornecedor
            if for_id in ["FORN-006", "FORN-004", "FORN-009"]:
                atraso = random.choice([0, 2, 5, 8, 14])
                falta_qtd = random.random() < 0.28
            else:
                atraso = random.choice([0, 0, 0, 1, 2])
                falta_qtd = random.random() < 0.05

            lt_real = acordado + atraso
            data_prev = p_data + timedelta(days=acordado)
            data_ent = p_data + timedelta(days=lt_real)

            if data_ent <= ref_date:
                status = "ENTREGUE"
                qtd_entregue = int(qtd_pedida * random.uniform(0.8, 1.0)) if falta_qtd else qtd_pedida
                no_prazo = (atraso <= 0)
                na_qtd = (qtd_entregue == qtd_pedida)
                otif = (no_prazo and na_qtd)
            else:
                status = "EM_TRANSITO"
                data_ent = None
                qtd_entregue = None
                lt_real = None
                no_prazo = None
                na_qtd = None
                otif = None

            pedidos_rows.append((
                f"PED-{ped_counter:06d}",
                sku,
                for_id,
                f_id,
                p_data,
                data_prev,
                data_ent,
                qtd_pedida,
                qtd_entregue,
                status,
                lt_real,
                modal,
                no_prazo,
                na_qtd,
                otif
            ))
            ped_counter += 1

    conn.executemany("""
    INSERT INTO f_pedidos_compra (pedido_id, sku, fornecedor_id, filial_id, data_pedido, data_prevista, data_entrega, quantidade_pedida, quantidade_entregue, status, lead_time_real, modal_transporte, entregue_no_prazo, entregue_na_quantidade, otif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, pedidos_rows)

    conn.close()

if __name__ == "__main__":
    seed_database(force=True)
    print("Seed massivo concluido com sucesso!")
