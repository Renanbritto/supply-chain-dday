from fastapi import APIRouter
from app.engine.abc_curve import calculate_abc_curve
from app.engine.scatter import calculate_scatter_risk_matrix
from app.engine.geo import calculate_geo_supply_network
from app.intelligence.tools import get_inventory_health_summary

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary")
def get_kpi_summary():
    return get_inventory_health_summary()

@router.get("/abc")
def get_abc_analysis():
    return calculate_abc_curve()

@router.get("/scatter")
def get_scatter_risk():
    return calculate_scatter_risk_matrix()

@router.get("/geo")
def get_geo_network():
    return calculate_geo_supply_network()
