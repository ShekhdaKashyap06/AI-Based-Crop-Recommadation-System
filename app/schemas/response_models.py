from typing import List, Optional
from pydantic import BaseModel


# ============================================================
# ONE CROP RECOMMENDATION
# ============================================================

class CropRecommendation(BaseModel):

    crop: str

    ml_score: float
    suitability_score: float
    final_score: float

    estimated_cost: Optional[float]
    status: str
    economic_score: float

    soil_status: str
    soil_message: Optional[str] = None


# ============================================================
# FULL RECOMMEND RESPONSE
# ============================================================

class RecommendationResponse(BaseModel):

    success: bool
    best_affordable_crop: Optional[str]
    recommendations: List[CropRecommendation]
