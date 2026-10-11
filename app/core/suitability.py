import pandas as pd


# ============================================================
# 1. LOAD CROP REQUIREMENT DATA
# ============================================================

requirements = pd.read_csv(
    "dataset/crop_requirements1.csv"
)


# ============================================================
# 2. CALCULATE SCORE FOR A VALUE
# ============================================================

def range_score(value, minimum, maximum):

    # If value is inside the required range
    if minimum <= value <= maximum:
        return 100

    # If value is outside the range,
    # reduce the score based on distance
    range_size = maximum - minimum

    if value < minimum:
        distance = minimum - value
    else:
        distance = value - maximum

    score = 100 - (distance / range_size * 100)

    # Score cannot be negative
    return max(0, round(score, 2))


# ============================================================
# 3. CHECK SOIL
# ============================================================

def soil_score(farmer_soil, required_soil):

    farmer_soil = farmer_soil.lower().strip()

    required_soil = required_soil.lower()

    # Example:
    # Required soil = "Loam/Clay"
    # becomes:
    # ["loam", "clay"]

    accepted_soils = required_soil.split("/")

    for soil in accepted_soils:

        soil = soil.strip()

        if farmer_soil == soil:
            return 100

    return 0


# ============================================================
# 4. CALCULATE CROP SUITABILITY
# ============================================================

def get_suitability(
    crop,
    soil,
    ph,
    temperature,
    rainfall
):

    # Find crop in requirement dataset

    crop_data = requirements[
        requirements["Crop"].str.lower().str.strip()
        == crop.lower().strip()
    ]


    # If crop is not available
    if crop_data.empty:

        return {
            "Suitability_Score": 0,
            "Soil_Score": 0,
            "pH_Score": 0,
            "Temperature_Score": 0,
            "Rainfall_Score": 0
        }


    # Get first matching row

    row = crop_data.iloc[0]


    # Calculate individual scores

    soil = soil_score(
        soil,
        row["Soil_Type"]
    )


    ph = range_score(
        ph,
        row["Min_pH"],
        row["Max_pH"]
    )


    temperature = range_score(
        temperature,
        row["Min_Temperature"],
        row["Max_Temperature"]
    )


    rainfall = range_score(
        rainfall,
        row["Min_Rainfall"],
        row["Max_Rainfall"]
    )


    # ========================================================
    # FINAL SUITABILITY SCORE
    # ========================================================

    suitability = (
        soil * 0.30
        + ph * 0.25
        + temperature * 0.25
        + rainfall * 0.20
    )


    return {
        "Suitability_Score": round(suitability, 2),

        "Soil_Score": soil,

        "pH_Score": ph,

        "Temperature_Score": temperature,

        "Rainfall_Score": rainfall
    }


# ============================================================
# 5. COMBINE ML SCORE + SUITABILITY SCORE
# ============================================================

def rank_crops(
    candidates,
    soil,
    ph,
    temperature,
    rainfall
):

    results = []


    # Check every ML recommended crop

    for _, crop in candidates.iterrows():

        crop_name = crop["Crop"]

        ml_score = crop["ML_Score"]


        # Get agricultural suitability

        suitability = get_suitability(
            crop_name,
            soil,
            ph,
            temperature,
            rainfall
        )


        # ====================================================
        # FINAL SCORE
        # ====================================================

        final_score = (
            ml_score * 0.65
            + suitability["Suitability_Score"] * 0.35
        )


        # Save result

        results.append({

            "Crop": crop_name,

            "ML_Score": round(
                ml_score,
                2
            ),

            "Suitability_Score": suitability[
                "Suitability_Score"
            ],

            "Soil_Score": suitability[
                "Soil_Score"
            ],

            "pH_Score": suitability[
                "pH_Score"
            ],

            "Temperature_Score": suitability[
                "Temperature_Score"
            ],

            "Rainfall_Score": suitability[
                "Rainfall_Score"
            ],

            "Final_Score": round(
                final_score,
                2
            )
        })


    # Convert results into DataFrame

    results = pd.DataFrame(results)


    # Highest score first

    results = results.sort_values(
        "Final_Score",
        ascending=False
    )


    return results.reset_index(
        drop=True
    )