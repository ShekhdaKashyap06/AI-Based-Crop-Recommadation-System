from fastapi import APIRouter

from core.prediction import predict_top_3
from core.suitability import rank_crops
from core.economic import check_affordability

from schemas.request_models import FarmerInput
from schemas.response_models import RecommendationResponse


router = APIRouter()


# ============================================================
# HOME API
# ============================================================

@router.get("/")
def home():

    return {
        "message": "AI Crop Recommendation API is running"
    }


# ============================================================
# RECOMMEND CROP
# ============================================================

@router.post("/recommend", response_model=RecommendationResponse)
def recommend(data: FarmerInput):

    # ========================================================
    # 1. ML MODEL
    # ========================================================

    top_3 = predict_top_3(
        data.nitrogen,
        data.phosphorus,
        data.potassium,
        data.temperature,
        data.humidity,
        data.ph,
        data.rainfall
    )


    # ========================================================
    # 2. SUITABILITY MODEL
    # ========================================================

    top_3 = rank_crops(
        top_3,
        data.soil_type,
        data.ph,
        data.temperature,
        data.rainfall
    )


    # ========================================================
    # 3. ECONOMIC MODEL
    # ========================================================

    results = []

    for _, row in top_3.iterrows():

        economic = check_affordability(
            row["Crop"],
            data.land_area,
            data.budget
        )


        # ----------------------------------------------------
        # CREATE FINAL RESULT
        # ----------------------------------------------------

        soil_ok = row["Soil_Score"] == 100

        result = {

            "crop": row["Crop"],

            "ml_score": float(
                row["ML_Score"]
            ),

            "suitability_score": float(
                row["Suitability_Score"]
            ),

            "final_score": float(
                row["Final_Score"]
            ),

            "estimated_cost": economic[
                "Estimated_Cost"
            ],

            "status": economic[
                "Status"
            ],

            "soil_status": (
                "Suitable" if soil_ok else "Not Suitable"
            ),

            "soil_message": (
                None if soil_ok else
                "This crop is not suitable for the entered soil type "
                "according to the crop requirements database."
            ),

            "economic_score": float(
                economic[
                    "Economic_Score"
                ]
            )
        }


        results.append(result)


    # ========================================================
    # 4. FIND BEST AFFORDABLE CROP
    # ========================================================

    affordable = []

    for result in results:

        if result["status"] == "Affordable":

            affordable.append(result)


    # ========================================================
    # 5. BEST CROP
    # ========================================================

    if len(affordable) > 0:

        best = max(
            affordable,
            key=lambda x: x["final_score"]
        )

        best_crop = best["crop"]

    else:

        best_crop = None


    # ========================================================
    # 6. RETURN RESPONSE
    # ========================================================

    return {

        "success": True,

        "best_affordable_crop":
            best_crop,

        "recommendations":
            results

    }
