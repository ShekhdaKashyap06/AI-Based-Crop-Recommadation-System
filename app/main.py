from core.prediction import predict_top_3
from core.economic import check_affordability
from core.suitability import rank_crops


# ------------------------------------------------------------
# 1. GET FARMER INPUT
# ------------------------------------------------------------

print("\n==========================================")
print("      AI CROP RECOMMENDATION SYSTEM")
print("==========================================")

N = float(input("\nEnter Nitrogen (N): "))
P = float(input("Enter Phosphorus (P): "))
K = float(input("Enter Potassium (K): "))
temperature = float(input("Enter Temperature (°C): "))
humidity = float(input("Enter Humidity (%): "))
ph = float(input("Enter Soil pH: "))
rainfall = float(input("Enter Rainfall (mm): "))
soil_type = input("Enter Soil Type (example: Loam, Sandy loam, Clay): ")

land_area = float(
    input("\nEnter Land Area (sq.ft): ")
)

budget = float(
    input("Enter Available Budget (₹): ")
)


# ------------------------------------------------------------
# 2. GET TOP 3 FROM ML MODEL
# ------------------------------------------------------------

top_3 = predict_top_3(
    N, P, K,
    temperature,
    humidity,
    ph,
    rainfall
)

# The requirements CSV refines the ML candidates using soil, pH,
# temperature and rainfall suitability.
top_3 = rank_crops(
    top_3, soil_type, ph, temperature, rainfall
)


# ------------------------------------------------------------
# 3. CHECK ECONOMICS FOR EACH TOP 3 CROP
# ------------------------------------------------------------

results = []

for _, row in top_3.iterrows():

    economic = check_affordability(
        row["Crop"],
        land_area,
        budget
    )

    results.append({
    "Crop": row["Crop"],
    "ML_Score": row["ML_Score"],
    "Suitability_Score": row["Suitability_Score"],
    "Final_Score": row["Final_Score"],
    "Estimated_Cost": economic["Estimated_Cost"],
    "Status": economic["Status"],
    "Economic_Score": economic["Economic_Score"]
})


# ------------------------------------------------------------
# 4. DISPLAY FINAL RESULT
# ------------------------------------------------------------

print("\n==========================================")
print("             FINAL RESULT")
print("==========================================")

for i, result in enumerate(results, start=1):

    print(f"\n{i}. {result['Crop']}")
    print(
        f"   ML Score       : "
        f"{result['ML_Score']:.2f}%"
    )
    print(
        f"   Suitability    : "
        f"{result['Suitability_Score']:.2f}%"
    )
    print(
        f"   Final Score    : "
        f"{result['Final_Score']:.2f}%"
    )

    if result["Estimated_Cost"] is not None:
        print(
            f"   Estimated Cost : "
            f"₹{result['Estimated_Cost']:.2f}"
        )

    print(
        f"   Budget Status  : "
        f"{result['Status']}"
    )

    print(
        f"   Economic Score : "
        f"{result['Economic_Score']:.2f}%"
    )


# ------------------------------------------------------------
# 5. BEST AFFORDABLE CROP
# ------------------------------------------------------------

affordable = [
    result for result in results
    if result["Status"] == "Affordable"
]

print("\n==========================================")

if affordable:

    # Among affordable crops, choose the strongest combined score.
    best = max(
        affordable,
        key=lambda x: x["Final_Score"]
    )

    print(
        f"🏆 BEST AFFORDABLE CROP: "
        f"{best['Crop']}"
    )

else:

    print(
        "⚠ No top-3 crop is affordable "
        "within the entered budget."
    )

print("==========================================")
