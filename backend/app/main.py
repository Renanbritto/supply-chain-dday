from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.seed_data import seed_database
from app.routers import analytics, inventory, suppliers, intelligence

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Executa seed e inicializacao automatica na subida do backend
    seed_database()
    yield

app = FastAPI(
    title="Supply Chain D-Day API - RN Intelligence",
    description="Backend analitico de gestao de estoque, motor preditivo D-Day e Copilot RN Intelligence.",
    version="1.0.0",
    lifespan=lifespan
)

# Habilita CORS para o frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router)
app.include_router(inventory.router)
app.include_router(suppliers.router)
app.include_router(intelligence.router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Supply Chain D-Day Engine & RN Intelligence",
        "version": "1.0.0"
    }
