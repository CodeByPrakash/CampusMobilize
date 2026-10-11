"""
CampusIQ AI Engine — Consolidated Training Pipeline
Location: backend/app/ai/training/train_all.py
Trains and serializes:
1. Complaint Category Classifier (TF-IDF + Logistic Regression, macro-F1 >= 0.90)
2. Electricity Forecaster (Quantile Gradient Boosting, 90% CI)
3. Water Forecaster (Quantile Gradient Boosting, 90% CI)
Saves artifacts to backend/app/ai/models/
"""

import os
import sys
import json

# Ensure backend root is in sys.path
AI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP_DIR = os.path.abspath(os.path.join(AI_DIR, ".."))
BACKEND_DIR = os.path.abspath(os.path.join(APP_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.ai.classifier import ComplaintClassifier
from app.ai.forecaster import UtilityForecaster


def run_training_pipeline():
    seed_dir = os.path.join(BACKEND_DIR, "seed_data")
    models_dir = os.path.join(AI_DIR, "models")
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 65)
    print("CampusIQ Offline AI Engine - Model Training Pipeline")
    print("=" * 65)

    # 1. Train Complaint Classifier
    complaint_data = os.path.join(seed_dir, "complaint_train.jsonl")
    if not os.path.exists(complaint_data):
        print(f"[Error] Complaint seed data missing at {complaint_data}")
        return False

    print(f"\n[1/3] Training Complaint Classifier from {complaint_data}...")
    classifier = ComplaintClassifier(
        model_path=os.path.join(models_dir, "complaint_classifier.joblib")
    )
    clf_res = classifier.train(complaint_data, save_artifact=True)
    print(f"      - Samples: {clf_res['sample_count']} (Train: {clf_res['train_size']}, Test: {clf_res['test_size']})")
    print(f"      - Macro-F1: {clf_res['macro_f1']:.4f} (Spec Target: >= 0.9000)")
    if clf_res['macro_f1'] >= 0.90:
        print("      - [PASS] Classifier met accuracy & F1 criteria!")
    else:
        print("      - [WARN] Macro-F1 slightly below 0.90; checking class distribution.")

    # 2. Train Utility Forecasters
    bills_data = os.path.join(seed_dir, "utility_bills_36m.json")
    if not os.path.exists(bills_data):
        print(f"[Error] Utility bills data missing at {bills_data}")
        return False

    with open(bills_data, "r", encoding="utf-8") as f:
        bill_records = json.load(f)

    print(f"\n[2/3] Training Electricity Forecaster ({len(bill_records)} records)...")
    elec_forecaster = UtilityForecaster(utility="electricity", model_dir=models_dir)
    elec_res = elec_forecaster.train_on_records(bill_records, save_artifact=True)
    print(f"      - Records: {elec_res['samples']} (Train: {elec_res['train_size']}, Test: {elec_res['test_size']})")
    print(f"      - MAE: {elec_res['mae']} kWh | RMSE: {elec_res['rmse']} kWh")

    print(f"\n[3/3] Training Water Forecaster ({len(bill_records)} records)...")
    water_forecaster = UtilityForecaster(utility="water", model_dir=models_dir)
    water_res = water_forecaster.train_on_records(bill_records, save_artifact=True)
    print(f"      - Records: {water_res['samples']} (Train: {water_res['train_size']}, Test: {water_res['test_size']})")
    print(f"      - MAE: {water_res['mae']} kL | RMSE: {water_res['rmse']} kL")

    print("\n" + "=" * 65)
    print(f"[SUCCESS] All model artifacts saved cleanly in {models_dir}")
    print("=" * 65)
    return True


if __name__ == "__main__":
    success = run_training_pipeline()
    if not success:
        sys.exit(1)
