import os
import json
import joblib
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score
from ai_ml.pipelines.feature_engineering import generate_synthetic_training_data, FEATURE_NAMES

def train_and_export_model():
    print("[AI/ML Training] Generating 2,500 geotechnical training samples for NER...")
    X, y = generate_synthetic_training_data(n_samples=2500)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("[AI/ML Training] Training Gradient Boosted Decision Tree ensemble...")
    model = GradientBoostingClassifier(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.85,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    
    print(f"[AI/ML Training] Model Performance -> Accuracy: {acc * 100:.2f}%, ROC-AUC: {auc:.4f}")

    # Feature importances
    feature_importances = {
        name: float(imp) 
        for name, imp in zip(FEATURE_NAMES, model.feature_importances_)
    }
    sorted_importances = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)
    print("[AI/ML Training] Top Contributing Physical Drivers:")
    for rank, (feat, imp) in enumerate(sorted_importances[:5], 1):
        print(f"   {rank}. {feat}: {imp * 100:.1f}%")

    # Output paths
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "weights")
    os.makedirs(output_dir, exist_ok=True)
    
    model_path = os.path.join(output_dir, "landslide_hazard_gbdt.joblib")
    metadata_path = os.path.join(output_dir, "model_metadata.json")

    joblib.dump(model, model_path)
    
    metadata = {
        "model_type": "GradientBoostingClassifier",
        "n_estimators": 120,
        "max_depth": 4,
        "features": FEATURE_NAMES,
        "metrics": {
            "test_accuracy": round(float(acc), 4),
            "roc_auc": round(float(auc), 4)
        },
        "global_feature_importances": feature_importances,
        "thresholds": {
            "low": 0.30,
            "moderate": 0.60,
            "high": 0.80
        }
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[AI/ML Training] Model successfully saved to {model_path}")
    print(f"[AI/ML Training] Metadata saved to {metadata_path}")
    return model, metadata

if __name__ == "__main__":
    train_and_export_model()
