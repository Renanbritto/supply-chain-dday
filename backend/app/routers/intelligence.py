from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.intelligence.agent import process_copilot_message
from app.intelligence.tools import simulate_what_if_scenario, generate_purchase_draft

router = APIRouter(prefix="/api/intelligence", tags=["RN Intelligence"])

class ChatRequest(BaseModel):
    message: str

class SimulateRequest(BaseModel):
    sku: str
    demand_multiplier: Optional[float] = 1.0
    delay_days: Optional[int] = 0

class PurchaseDraftRequest(BaseModel):
    fornecedor_id: Optional[str] = None

@router.post("/chat")
def chat_copilot(req: ChatRequest):
    response = process_copilot_message(req.message)
    return response

@router.post("/simulate")
def simulate_scenario(req: SimulateRequest):
    return simulate_what_if_scenario(
        sku_id=req.sku,
        demand_multiplier=req.demand_multiplier or 1.0,
        additional_delay_days=req.delay_days or 0
    )

@router.post("/purchase-draft")
def get_purchase_orders(req: PurchaseDraftRequest):
    return generate_purchase_draft(fornecedor_id=req.fornecedor_id)
