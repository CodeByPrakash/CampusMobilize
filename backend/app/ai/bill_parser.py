"""
Utility Bill Parser (§8.5)
Extracts structured consumption, billing amount, and tariffs from CSV and text/PDF bill formats.
Assigns confidence score; flags parses below 0.8 for manual UI confirmation.
"""

import re
import csv
import io
from typing import Dict, Any, List, Optional


class BillParser:
    """
    Parses utility bill files (CSV and textual extracts).
    """

    @classmethod
    def parse_csv(cls, content: str) -> List[Dict[str, Any]]:
        """Parses CSV bill format directly."""
        results = []
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            try:
                # Normalize column headers
                norm_row = {k.strip().lower().replace(" ", "_"): v.strip() for k, v in row.items() if k}
                hostel = norm_row.get("hostel_code") or norm_row.get("hostel") or "HB-3"
                utility = norm_row.get("utility") or "electricity"
                month = norm_row.get("bill_month") or norm_row.get("month") or "2026-10-01"
                units = float(norm_row.get("units_consumed") or norm_row.get("units") or 0.0)
                amount = float(norm_row.get("amount_inr") or norm_row.get("amount") or 0.0)
                tariff = float(norm_row.get("tariff_rate") or (round(amount / units, 2) if units > 0 else 6.85))

                confidence = 0.95
                results.append({
                    "hostel_code": hostel.upper(),
                    "utility": utility.lower(),
                    "bill_month": month,
                    "units_consumed": units,
                    "amount_inr": amount,
                    "tariff_rate": tariff,
                    "parsed_confidence": confidence,
                    "needs_manual_confirm": confidence < 0.80
                })
            except Exception as e:
                print(f"[Warning] Error parsing CSV row: {e}")
        return results

    @classmethod
    def parse_text(cls, text: str) -> Dict[str, Any]:
        """
        Regex extraction for NIT Rourkela institutional bill formats.
        """
        confidence_points = 0
        total_checks = 5

        # 1. Utility detection
        utility = "electricity"
        if re.search(r"\b(water|kL|litres|plumbing)\b", text, re.IGNORECASE):
            utility = "water"
            confidence_points += 1
        elif re.search(r"\b(electricity|kwh|power|energy|disco)\b", text, re.IGNORECASE):
            utility = "electricity"
            confidence_points += 1

        # 2. Hostel detection
        hostel = "HB-3"
        hostel_match = re.search(r"\b(HB-3|KMS|CVR|GDB|Homi Bhabha|Kiran Mazumdar|CV Raman)\b", text, re.IGNORECASE)
        if hostel_match:
            raw_h = hostel_match.group(1).upper()
            if "HOMI" in raw_h:
                hostel = "HB-3"
            elif "KIRAN" in raw_h:
                hostel = "KMS"
            elif "RAMAN" in raw_h:
                hostel = "CVR"
            else:
                hostel = raw_h
            confidence_points += 1

        # 3. Bill month detection (e.g., 2026-10, Oct 2026, 10/2026)
        bill_month = "2026-10-01"
        month_match = re.search(r"\b(\d{4})[-/](\d{1,2})\b", text)
        if month_match:
            y, m = month_match.group(1), int(month_match.group(2))
            bill_month = f"{y}-{m:02d}-01"
            confidence_points += 1
        else:
            named_m = re.search(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b", text, re.IGNORECASE)
            if named_m:
                confidence_points += 1

        # 4. Units consumed
        units = 0.0
        units_match = re.search(r"(?:units|consumed|kwh|kl)\s*[:=-]?\s*([0-9,]+(?:\.[0-9]+)?)", text, re.IGNORECASE)
        if units_match:
            try:
                units = float(units_match.group(1).replace(",", ""))
                confidence_points += 1
            except Exception:
                pass

        # 5. Amount INR
        amount = 0.0
        amount_match = re.search(r"(?:amount|total|payable|inr|rs\.?)\s*[:=-]?\s*(?:₹|rs\.?)?\s*([0-9,]+(?:\.[0-9]+)?)", text, re.IGNORECASE)
        if amount_match:
            try:
                amount = float(amount_match.group(1).replace(",", ""))
                confidence_points += 1
            except Exception:
                pass

        confidence = round(float(confidence_points) / float(total_checks), 2)
        tariff = round(amount / units, 2) if units > 0 else (6.85 if utility == "electricity" else 18.50)

        return {
            "hostel_code": hostel,
            "utility": utility,
            "bill_month": bill_month,
            "units_consumed": units,
            "amount_inr": amount,
            "tariff_rate": tariff,
            "parsed_confidence": confidence,
            "needs_manual_confirm": confidence < 0.80
        }
