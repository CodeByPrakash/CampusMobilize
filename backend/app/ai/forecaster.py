"""
Campus Utility Demand Forecaster (8.5)
Gradient-boosted quantile regression models with 90% confidence intervals (5th, 50th, 95th percentiles)
predicting monthly electricity (kWh) and water (kL) consumption per hostel.
Includes deterministic heuristic fallback if model artifact is missing.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

DEFAULT_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

# Baseline consumption averages per resident per month at NIT Rourkela
BASE_CONSUMPTION = {
    "electricity": 95.0,  # kWh / resident / month
    "water": 4.2          # kL / resident / month
}


class UtilityForecaster:
    """
    Offline utility consumption forecaster with quantile uncertainty intervals.
    """

    def __init__(self, utility: str = "electricity", model_dir: Optional[str] = None):
        self.utility = utility.lower()
        self.model_dir = model_dir or DEFAULT_MODEL_DIR
        self.model_file = os.path.join(self.model_dir, f"forecaster_{self.utility}.joblib")
        
        self.model_median: Optional[GradientBoostingRegressor] = None
        self.model_lower: Optional[GradientBoostingRegressor] = None
        self.model_upper: Optional[GradientBoostingRegressor] = None
        self.mae: float = 0.0
        
        self._load_if_exists()

    def _load_if_exists(self) -> bool:
        if os.path.exists(self.model_file):
            try:
                bundle = joblib.load(self.model_file)
                self.model_median = bundle.get("median")
                self.model_lower = bundle.get("lower")
                self.model_upper = bundle.get("upper")
                self.mae = bundle.get("mae", 0.0)
                return True
            except Exception as e:
                print(f"[Warning] Failed loading forecaster artifact for {self.utility}: {e}")
        return False

    @staticmethod
    def _extract_features(month: int, resident_count: int, event_multiplier: float = 1.0) -> List[float]:
        """Engineers tabular feature vector for forecasting."""
        is_summer = 1.0 if month in [4, 5, 6] else 0.0
        is_winter = 1.0 if month in [12, 1] else 0.0
        is_vacation = 1.0 if month in [5, 6] else (0.5 if month == 12 else 0.0)
        
        # Month cyclical encoding
        sin_month = np.sin(2 * np.pi * month / 12.0)
        cos_month = np.cos(2 * np.pi * month / 12.0)

        return [
            float(month),
            float(resident_count),
            float(event_multiplier),
            is_summer,
            is_winter,
            is_vacation,
            float(sin_month),
            float(cos_month)
        ]

    def heuristic_predict(
        self,
        month: int,
        resident_count: int,
        event_multiplier: float = 1.0
    ) -> Dict[str, float]:
        """
        Deterministic consumption estimation heuristic (8.5 fallback).
        """
        base = BASE_CONSUMPTION.get(self.utility, 95.0)
        
        # Seasonal multipliers
        if self.utility == "electricity":
            season_mult = 1.35 if month in [4, 5, 6] else (1.18 if month in [12, 1] else 1.0)
        else:
            season_mult = 1.25 if month in [4, 5, 6] else (0.90 if month in [12, 1] else 1.0)

        # Vacation factor
        vacation_factor = 0.45 if month in [5, 6] else (0.70 if month == 12 else 1.0)

        effective_residents = float(resident_count) * vacation_factor
        predicted_median = effective_residents * base * season_mult * float(event_multiplier)
        
        # CI ± 10%
        lower_ci = predicted_median * 0.90
        upper_ci = predicted_median * 1.10

        return {
            "predicted_units": round(predicted_median, 2),
            "lower_ci": round(lower_ci, 2),
            "upper_ci": round(upper_ci, 2),
            "is_heuristic": True
        }

    def predict(
        self,
        month: int,
        resident_count: int,
        event_multiplier: float = 1.0
    ) -> Dict[str, float]:
        """
        Predicts expected utility units and 90% confidence intervals.
        """
        if self.model_median is not None and self.model_lower is not None and self.model_upper is not None:
            try:
                features = np.array([self._extract_features(month, resident_count, event_multiplier)])
                pred = float(self.model_median.predict(features)[0])
                lower = float(self.model_lower.predict(features)[0])
                upper = float(self.model_upper.predict(features)[0])

                # Ensure logical consistency: lower <= median <= upper
                lower = min(lower, pred)
                upper = max(upper, pred)

                return {
                    "predicted_units": round(pred, 2),
                    "lower_ci": round(lower, 2),
                    "upper_ci": round(upper, 2),
                    "is_heuristic": False
                }
            except Exception as e:
                print(f"[Warning] ML forecast failed: {e}. Using deterministic heuristic.")

        return self.heuristic_predict(month, resident_count, event_multiplier)

    def train_on_records(
        self,
        records: List[Dict[str, Any]],
        save_artifact: bool = True
    ) -> Dict[str, Any]:
        """
        Trains Quantile Gradient Boosting models using historical utility bill records.
        Chronological split ensures no temporal leakage.
        """
        # Filter for current utility
        filtered = [r for r in records if r.get("utility", "").lower() == self.utility]
        if len(filtered) < 12:
            raise ValueError(f"Insufficient training records for {self.utility}: {len(filtered)}")

        # Sort chronologically by bill_month
        filtered.sort(key=lambda x: str(x.get("bill_month", "")))

        X_rows = []
        y_rows = []

        for r in filtered:
            month_str = str(r.get("bill_month", "2026-01-01"))
            m = int(month_str.split("-")[1])
            res_count = int(r.get("active_residents") or r.get("resident_count", 500))
            units = float(r.get("units_consumed", 0.0))

            # Event multiplier if event present
            evt_mult = float(r.get("event_multiplier", 1.0))

            features = self._extract_features(month=m, resident_count=res_count, event_multiplier=evt_mult)
            X_rows.append(features)
            y_rows.append(units)

        X = np.array(X_rows)
        y = np.array(y_rows)

        # Chronological split: 80% train, 20% test
        split_idx = int(len(X) * 0.80)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        # 1. Median model (Quantile alpha=0.50)
        med_model = GradientBoostingRegressor(loss="quantile", alpha=0.50, n_estimators=60, max_depth=3, random_state=42)
        med_model.fit(X_train, y_train)

        # 2. Lower bound (alpha=0.05 for 90% CI)
        low_model = GradientBoostingRegressor(loss="quantile", alpha=0.05, n_estimators=60, max_depth=3, random_state=42)
        low_model.fit(X_train, y_train)

        # 3. Upper bound (alpha=0.95 for 90% CI)
        up_model = GradientBoostingRegressor(loss="quantile", alpha=0.95, n_estimators=60, max_depth=3, random_state=42)
        up_model.fit(X_train, y_train)

        # Evaluate on test set
        y_pred = med_model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))

        self.model_median = med_model
        self.model_lower = low_model
        self.model_upper = up_model
        self.mae = mae

        if save_artifact:
            os.makedirs(self.model_dir, exist_ok=True)
            bundle = {
                "median": med_model,
                "lower": low_model,
                "upper": up_model,
                "mae": mae,
                "rmse": rmse
            }
            joblib.dump(bundle, self.model_file)

        return {
            "utility": self.utility,
            "samples": len(X),
            "train_size": len(X_train),
            "test_size": len(X_test),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2)
        }
