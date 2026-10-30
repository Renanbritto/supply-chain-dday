import duckdb
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DB_DIR / "supply_chain.duckdb"

def get_connection():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = duckdb.connect(str(DB_PATH))
    return conn

def init_db():
    conn = get_connection()
    
    # 1. Dimensao Fornecedor
    conn.execute("""
    CREATE TABLE IF NOT EXISTS d_fornecedor (
        fornecedor_id VARCHAR PRIMARY KEY,
        nome VARCHAR NOT NULL,
        cnpj VARCHAR,
        lead_time_acordado INTEGER NOT NULL,
        confianca_historica_pct DOUBLE,
        email VARCHAR,
        categoria_principal VARCHAR
    );
    """)

    # 2. Dimensao Produto (SKU)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS d_produto (
        sku VARCHAR PRIMARY KEY,
        nome VARCHAR NOT NULL,
        categoria VARCHAR NOT NULL,
        custo_unitario DOUBLE NOT NULL,
        preco_venda DOUBLE NOT NULL,
        margem_pct DOUBLE NOT NULL,
        lead_time_padrao INTEGER NOT NULL,
        lote_minimo INTEGER NOT NULL,
        estoque_maximo INTEGER NOT NULL,
        fornecedor_id VARCHAR,
        FOREIGN KEY (fornecedor_id) REFERENCES d_fornecedor(fornecedor_id)
    );
    """)

    # 3. Dimensao Filial / Deposito
    conn.execute("""
    CREATE TABLE IF NOT EXISTS d_filial_deposito (
        filial_id VARCHAR PRIMARY KEY,
        nome VARCHAR NOT NULL,
        cidade VARCHAR NOT NULL,
        estado VARCHAR NOT NULL,
        capacidade_paletes INTEGER
    );
    """)

    # 4. Dimensao Calendario
    conn.execute("""
    CREATE TABLE IF NOT EXISTS d_calendario (
        data DATE PRIMARY KEY,
        ano INTEGER,
        mes INTEGER,
        dia INTEGER,
        dia_semana INTEGER,
        nome_dia VARCHAR,
        eh_fim_de_semana BOOLEAN,
        eh_dia_util BOOLEAN
    );
    """)

    # 5. Fato Estoque Diario
    conn.execute("""
    CREATE TABLE IF NOT EXISTS f_estoque_diario (
        data DATE NOT NULL,
        sku VARCHAR NOT NULL,
        filial_id VARCHAR NOT NULL,
        estoque_disponivel INTEGER NOT NULL,
        estoque_reservado INTEGER NOT NULL,
        estoque_em_transito INTEGER NOT NULL,
        estoque_quarentena INTEGER NOT NULL,
        PRIMARY KEY (data, sku, filial_id)
    );
    """)

    # 6. Fato Vendas e Movimentacao
    conn.execute("""
    CREATE TABLE IF NOT EXISTS f_vendas_movimentacao (
        venda_id VARCHAR PRIMARY KEY,
        data DATE NOT NULL,
        sku VARCHAR NOT NULL,
        filial_id VARCHAR NOT NULL,
        quantidade_vendida INTEGER NOT NULL,
        valor_total DOUBLE NOT NULL,
        custo_total DOUBLE NOT NULL
    );
    """)

    # 7. Fato Pedidos de Compra
    conn.execute("""
    CREATE TABLE IF NOT EXISTS f_pedidos_compra (
        pedido_id VARCHAR PRIMARY KEY,
        sku VARCHAR NOT NULL,
        fornecedor_id VARCHAR NOT NULL,
        filial_id VARCHAR NOT NULL,
        data_pedido DATE NOT NULL,
        data_prevista DATE NOT NULL,
        data_entrega DATE,
        quantidade_pedida INTEGER NOT NULL,
        quantidade_entregue INTEGER,
        status VARCHAR NOT NULL,
        lead_time_real INTEGER,
        entregue_no_prazo BOOLEAN,
        entregue_na_quantidade BOOLEAN,
        otif BOOLEAN
    );
    """)

    conn.close()
