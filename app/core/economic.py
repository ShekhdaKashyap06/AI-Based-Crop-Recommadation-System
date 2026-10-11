import pandas as pd


# ------------------------------------------------------------
# 1. LOAD ECONOMIC DATA
# ------------------------------------------------------------

economic_data = pd.read_csv(
    "dataset/crop_economics1.csv"
)

economic_data["Crop_Key"] = (
    economic_data["Crop"]
    .astype(str)
    .str.strip()
    .str.lower()
)


# 1 acre = 43,560 square feet
SQFT_PER_ACRE = 43560


# ------------------------------------------------------------
# 2. CHECK ONE CROP
# ------------------------------------------------------------

def check_affordability(
    crop,
    land_area_sqft,
    budget
):

    crop_key = str(crop).strip().lower()

    crop_data = economic_data[
        economic_data["Crop_Key"] == crop_key
    ]

    # Do not crash if economic data is missing.
    if crop_data.empty:
        return {
            "Crop": crop,
            "Estimated_Cost": None,
            "Budget": budget,
            "Status": "Data Not Available",
            "Economic_Score": 0
        }

    cost_per_acre = float(
        crop_data.iloc[0]["Cost_Per_Acre_INR"]
    )

    land_acres = (
        land_area_sqft / SQFT_PER_ACRE
    )

    estimated_cost = (
        cost_per_acre * land_acres
    )

    if estimated_cost <= budget:
        status = "Affordable"
    else:
        status = "Not Affordable"

    # 100 = fully within budget.
    # Lower values mean the crop consumes more of the budget.
    if estimated_cost <= 0:
        economic_score = 0
    else:
        economic_score = min(
            (budget / estimated_cost) * 100,
            100
        )

    return {
        "Crop": crop,
        "Estimated_Cost": round(
            estimated_cost,
            2
        ),
        "Budget": budget,
        "Status": status,
        "Economic_Score": round(
            economic_score,
            2
        )
    }


# ------------------------------------------------------------
# 3. TEST ECONOMIC ENGINE DIRECTLY
# ------------------------------------------------------------

if __name__ == "__main__":

    print("\n==========================================")
    print("          ECONOMIC ENGINE")
    print("==========================================")

    crop = input("Enter Crop: ")
    land = float(
        input("Enter Land Area (sq.ft): ")
    )
    budget = float(
        input("Enter Budget (₹): ")
    )

    result = check_affordability(
        crop,
        land,
        budget
    )

    print("\nCrop:", result["Crop"])
    print(
        "Estimated Cost: ₹",
        result["Estimated_Cost"]
    )
    print(
        "Budget: ₹",
        result["Budget"]
    )
    print(
        "Status:",
        result["Status"]
    )
    print(
        "Economic Score:",
        result["Economic_Score"],
        "%"
    )
