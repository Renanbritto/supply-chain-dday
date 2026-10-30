from fastapi import APIRouter
from app.engine.abc_curve import calculate_abc_curve
from app.intelligence.tools import get_inventory_health_summary

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary")
def get_kpi_summary():
    return get_inventory_health_summary()

@router.get("/abc")
def get_abc_analysis():
    return calculate_abc_curve()
