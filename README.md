# Gestao Estrategica de Estoque, Ruptura e Pedidos de Compras com RN Intelligence

Plataforma analitica de tomada de decisao em Supply Chain, unindo modelagem dimensional em DuckDB, backend em FastAPI, interface Next.js com shadcn/ui (design system Obsidian Glass) e o assistente de inteligencia contextual RN Intelligence Copilot.

Referencia do projeto: [renannocelli.com.br/projetos/gestao-estoque](https://www.renannocelli.com.br/projetos/gestao-estoque#prototipo)

---

## 1. Visao Geral da Arquitetura

O sistema e estruturado em quatro camadas complementares:

1. **Camada de Dados (Star Schema em DuckDB)**:
   - Fatos: `f_estoque_diario`, `f_vendas_movimentacao`, `f_pedidos_compra`
   - Dimensoes: `d_produto`, `d_fornecedor`, `d_calendario`, `d_filial_deposito`
2. **Motor Analitico e Regras de Negocio (Python / FastAPI)**:
   - Motor Preditivo D-Day (calculo da data limite de recompra antes de ruptura)
   - Estoque de Seguranca (SS) e Ponto de Pedido (ROP) com variabilidade de demanda e lead time
   - Estratificacao por Curva ABC multivariada (Giro, Faturamento e Margem)
   - Indicadores de SLA e performance de fornecedores (Lead time real vs. acordado, taxa OTIF)
3. **RN Intelligence (Camada de Copilot e Agente Analitico)**:
   - Diagnostico automatizado de causa-raiz para itens em risco de ruptura
   - Simulacao de cenarios what-if (variacao de demanda e atrasos de entrega)
   - Recomendador inteligente e geracao de minutas para pedidos de compra
4. **Camada de Apresentacao (Next.js + shadcn/ui)**:
   - Cockpit com indicadores executivos de ruptura, cobertura e capital imobilizado
   - Grid dinamico para acompanhamento de D-Day e ponto de pedido
   - Drawer retratil flutuante do RN Intelligence (Obsidian Glass UI)

---

## 2. Pilares de Negocio e Formulacao Matematica

### Motor Preditivo D-Day
Calcula a data exata limite para emissao do pedido de compra de forma a garantir que a mercadoria chegue antes que o estoque atinja o nivel critico:

- Consumo Medio Diario (CMD): Media ponderada do consumo historico de saidas.
- Cobertura de Estoque (dias): `Estoque Atual / CMD`
- Dias ate o Ponto de Pedido: `(Estoque Atual - ROP) / CMD`
- D-Day: `Data Atual + max(0, floor(Dias ate o Ponto de Pedido))`

### Ponto de Pedido (ROP) e Estoque de Seguranca (SS)
Incorpora a incerteza combinada do consumo e do prazo de entrega:

- `SS = Z * sqrt(LeadTime_Medio * Var_Demanda + Demanda_Media^2 * Var_LeadTime)`
- `ROP = (CMD * LeadTime_Medio) + SS`

### Controle de SLA e OTIF de Fornecedores
- On-Time: Percentual de pedidos entregues rigorosamente dentro da data limite acordada.
- In-Full: Percentual de pedidos entregues com a quantidade integral faturada.
- OTIF: Percentual de entregas que cumpriram ambos os criterios simultaneamente.

---

## 3. Estrutura do Repositorio

```text
supply-chain-dday/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── seed_data.py
│   │   ├── engine/
│   │   │   ├── dday.py
│   │   │   ├── abc_curve.py
│   │   │   ├── rop.py
│   │   │   └── sla.py
│   │   ├── intelligence/
│   │   │   ├── agent.py
│   │   │   └── tools.py
│   │   └── routers/
│   │       ├── inventory.py
│   │       ├── analytics.py
│   │       ├── suppliers.py
│   │       └── intelligence.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   └── rn-intelligence/
│   │   └── lib/
│   └── package.json
└── README.md
```

---

## 4. Requisitos do Sistema

- Python 3.11 ou superior
- Node.js 18 ou superior
- npm ou pnpm

---

## 5. Como Executar o Projeto

### Backend (FastAPI + DuckDB)

1. Acesse o diretorio do backend:
   ```bash
   cd backend
   ```
2. Instale as dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicialize o servidor da API com recarregamento automatico:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   A documentacao interativa ficara disponivel em: `http://localhost:8000/docs`.

### Frontend (Next.js + shadcn/ui)

1. Acesse o diretorio do frontend:
   ```bash
   cd frontend
   ```
2. Instale os pacotes:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicacao estara acessivel em: `http://localhost:3000`.

---

## 6. RN Intelligence Copilot

O drawer do RN Intelligence opera de forma integrada aos dados em memoria no DuckDB. Ele oferece suporte para:
- Diagnostico instantaneo de SKUs criticos.
- Analise de sensibilidade de compras por fornecedor.
- Simulacoes em tempo real de alteracao de demanda sazonal.
