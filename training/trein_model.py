import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score


# ------------------------------------------------------------
# 1. LOAD DATA
# ------------------------------------------------------------

data = pd.read_csv(
    "dataset/Crop_Recommendation.csv"
)

print("Dataset loaded successfully!")
print("Dataset shape:", data.shape)


# ------------------------------------------------------------
# 2. FEATURES AND TARGET
# ------------------------------------------------------------

features = [
    "Nitrogen",
    "Phosphorus",
    "Potassium",
    "Temperature",
    "Humidity",
    "pH_Value",
    "Rainfall"
]

X = data[features]
y = data["Crop"]


# ------------------------------------------------------------
# 3. TRAIN / TEST SPLIT
# ------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# ------------------------------------------------------------
# 4. SCALE DATA FOR MODELS THAT NEED IT
# ------------------------------------------------------------

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


# ------------------------------------------------------------
# 5. CREATE MODELS
# ------------------------------------------------------------

models = {
    "Decision Tree": DecisionTreeClassifier(
        random_state=42
    ),

    "Random Forest": RandomForestClassifier(
        n_estimators=100,
        random_state=42
    ),

    "KNN": KNeighborsClassifier(
        n_neighbors=5
    ),

    "SVM": SVC(
        probability=True,
        random_state=42
    ),

    "Logistic Regression": LogisticRegression(
        max_iter=1000
    )
}


# ------------------------------------------------------------
# 6. TRAIN AND COMPARE
# ------------------------------------------------------------

results = []
trained_models = {}

print("\n================ MODEL COMPARISON ================")

for name, model in models.items():

    # Tree models work directly with the original data.
    if name in ["Decision Tree", "Random Forest"]:
        model.fit(X_train, y_train)
        predictions = model.predict(X_test)

    # KNN, SVM and Logistic Regression use scaled data.
    else:
        model.fit(X_train_scaled, y_train)
        predictions = model.predict(X_test_scaled)

    accuracy = accuracy_score(y_test, predictions)
    f1 = f1_score(
        y_test,
        predictions,
        average="macro"
    )

    trained_models[name] = model

    results.append({
        "Algorithm": name,
        "Accuracy": accuracy,
        "F1_Score": f1
    })

results_df = pd.DataFrame(results)

# Accuracy is the main selection metric.
# F1 is used as the tie-breaker.
results_df = results_df.sort_values(
    by=["Accuracy", "F1_Score"],
    ascending=False
)

print(
    results_df.to_string(index=False)
)


# ------------------------------------------------------------
# 7. SELECT BEST MODEL
# ------------------------------------------------------------

best_algorithm = results_df.iloc[0]["Algorithm"]
best_model = trained_models[best_algorithm]

best_accuracy = results_df.iloc[0]["Accuracy"]
best_f1 = results_df.iloc[0]["F1_Score"]

print("\n===================================================")
print("BEST MODEL")
print("===================================================")
print("Algorithm:", best_algorithm)
print("Accuracy :", round(best_accuracy * 100, 2), "%")
print("F1 Score :", round(best_f1 * 100, 2), "%")


# ------------------------------------------------------------
# 8. SAVE MODEL FILES
# ------------------------------------------------------------

os.makedirs("models", exist_ok=True)

joblib.dump(
    best_model,
    "models/crop_model.pkl"
)

joblib.dump(
    scaler,
    "models/scaler.pkl"
)

model_info = {
    "best_algorithm": best_algorithm,
    "accuracy": best_accuracy,
    "f1_score": best_f1,
    "features": features
}

joblib.dump(
    model_info,
    "models/model_info.pkl"
)

# Save comparison table for the project/report.
results_df.to_csv(
    "models/model_comparison.csv",
    index=False
)

print("\nModel saved:")
print("models/crop_model.pkl")
print("models/scaler.pkl")
print("models/model_info.pkl")
print("models/model_comparison.csv")
