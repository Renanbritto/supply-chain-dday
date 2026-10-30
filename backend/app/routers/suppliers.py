from fastapi import APIRouter
from app.engine.sla import calculate_supplier_sla

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("/sla")
def get_suppliers_sla():
    return calculate_supplier_sla()
