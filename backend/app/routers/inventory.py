from fastapi import APIRouter, Query
from typing import Optional
from app.engine.dday import calculate_dday_inventory
from app.intelligence.tools import explain_sku_root_cause

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("/d-day")
def get_inventory_dday(
    categoria: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    items = calculate_dday_inventory()

    if categoria:
        items = [i for i in items if i["categoria"].lower() == categoria.lower()]
    
    if status:
        items = [i for i in items if i["status_urgencia"].lower() == status.lower()]

    if search:
        s = search.lower()
        items = [
            i for i in items 
            if s in i["sku"].lower() or s in i["nome"].lower() or s in (i["fornecedor_nome"] or "").lower()
        ]

    return {
        "total": len(items),
        "items": items
    }

@router.get("/sku/{sku_id}")
def get_sku_detail(sku_id: str):
    return explain_sku_root_cause(sku_id)
