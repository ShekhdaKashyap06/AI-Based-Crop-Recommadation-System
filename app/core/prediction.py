import joblib
import pandas as pd


# ------------------------------------------------------------
# 1. LOAD SAVED MODEL
# ------------------------------------------------------------

model = joblib.load(
    "models/crop_model.pkl"
)

scaler = joblib.load(
    "models/scaler.pkl"
)

model_info = joblib.load(
    "models/model_info.pkl"
)


best_algorithm = model_info["best_algorithm"]


# ------------------------------------------------------------
# 2. PREDICT TOP 3 CROPS
# ------------------------------------------------------------

def predict_top_3(
    nitrogen,
    phosphorus,
    potassium,
    temperature,
    humidity,
    ph,
    rainfall
):

    input_data = [[
        nitrogen,
        phosphorus,
        potassium,
        temperature,
        humidity,
        ph,
        rainfall
    ]]

    # Scale only when the selected model needs scaling.
    if best_algorithm in [
        "KNN",
        "SVM",
        "Logistic Regression"
    ]:
        input_data = scaler.transform(
            input_data
        )

    probabilities = model.predict_proba(
        input_data
    )[0]

    crops = model.classes_

    results = pd.DataFrame({
        "Crop": crops,
        "ML_Score": probabilities * 100
    })

    results = results.sort_values(
        by="ML_Score",
        ascending=False
    )

    return results.head(3).reset_index(drop=True)


# ------------------------------------------------------------
# 3. TEST PREDICTION DIRECTLY
# ------------------------------------------------------------

if __name__ == "__main__":

    print("\n==========================================")
    print("       TOP 3 CROP PREDICTION")
    print("==========================================")

    N = float(input("Enter Nitrogen (N): "))
    P = float(input("Enter Phosphorus (P): "))
    K = float(input("Enter Potassium (K): "))
    temperature = float(input("Enter Temperature (°C): "))
    humidity = float(input("Enter Humidity (%): "))
    ph = float(input("Enter Soil pH: "))
    rainfall = float(input("Enter Rainfall (mm): "))

    top_3 = predict_top_3(
        N, P, K,
        temperature,
        humidity,
        ph,
        rainfall
    )

    print("\nTop 3 Recommended Crops:")

    for i, row in top_3.iterrows():
        print(
            f"{i + 1}. {row['Crop']} "
            f"- {row['ML_Score']:.2f}%"
        )
