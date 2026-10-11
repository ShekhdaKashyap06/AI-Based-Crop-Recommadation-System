from pydantic import BaseModel


# ============================================================
# FARMER INPUT
# ============================================================

class FarmerInput(BaseModel):

    nitrogen: float
    phosphorus: float
    potassium: float

    temperature: float
    humidity: float
    ph: float
    rainfall: float

    soil_type: str

    land_area: float
    budget: float
