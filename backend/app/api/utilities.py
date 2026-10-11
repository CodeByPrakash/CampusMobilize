"""
Utilities & Forecasting Router (§7.6, §8.5)
Handles bill parsing & ingestion, quantile consumption forecasting,
and continuous learning predictions.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Header
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import UtilityBill, Hostel, Forecast
from ..ai.bill_parser import BillParser
from ..ai.forecaster import UtilityForecaster
from ..ai.continuous_learning import ContinuousLearningEngine

router = APIRouter(prefix="/utilities", tags=["Utilities & Forecasting"])

bill_parser = BillParser()
forecaster = UtilityForecaster()
continuous_learning = ContinuousLearningEngine()


class BillCreate(BaseModel):
    utility: str = Field(..., description="electricity or water")
    bill_month: str = Field(..., description="YYYY-MM-DD")
    units_consumed: float = Field(..., gt=0)
    amount_inr: float = Field(..., gt=0)
    hostel_code: Optional[str] = "HB-3"
    tariff_rate: Optional[float] = None
    source_file_url: Optional[str] = None


@router.post("/bills", status_code=201)
def create_utility_bill(
    payload: BillCreate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Ingests a utility bill row and feeds it into the continuous learning engine."""
    hostel = None
    if payload.hostel_code:
        hostel = db.query(Hostel).filter(Hostel.code == payload.hostel_code.upper()).first()

    bill_dt = date.fromisoformat(payload.bill_month)

    bill = UtilityBill(
        hostel_id=hostel.id if hostel else None,
        utility=payload.utility.lower(),
        bill_month=bill_dt,
        units_consumed=payload.units_consumed,
        amount_inr=payload.amount_inr,
        tariff_rate=payload.tariff_rate or round(payload.amount_inr / max(1.0, payload.units_consumed), 2),
        source_file_url=payload.source_file_url,
        parsed_confidence=1.0,
        created_at=datetime.now(timezone.utc)
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)

    # Ingest into continuous learning engine buffer
    drift_result = continuous_learning.ingest_real_bills([{
        "hostel_code": payload.hostel_code,
        "utility": payload.utility.lower(),
        "bill_month": payload.bill_month,
        "units_consumed": payload.units_consumed,
        "amount_inr": payload.amount_inr,
        "resident_count": 850
    }])
    drift_detected = len(drift_result.get("drift_alerts", [])) > 0

    return {
        "id": bill.id,
        "hostel_code": payload.hostel_code,
        "utility": bill.utility,
        "bill_month": bill.bill_month.isoformat(),
        "units_consumed": bill.units_consumed,
        "amount_inr": bill.amount_inr,
        "tariff_rate": bill.tariff_rate,
        "source_file_url": bill.source_file_url,
        "drift_detected": drift_detected,
        "created_at": bill.created_at.isoformat()
    }


@router.post("/bills/upload")
def upload_bills_text(
    text_content: Optional[str] = None,
    hostel_code: Optional[str] = "HB-3",
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Parses electricity or water bills from document text using regex/heuristic extractor (§8.5).
    """
    if not text_content:
        # Default mock document test text
        text_content = """
        TPWODL ELECTRICITY BILL - NIT ROURKELA HB-3
        Billing Month: October 2026
        Units Consumed: 98,450.00 kWh
        Total Amount: INR 6,74,382.50
        Tariff: Commercial Educational 6.85 INR/kWh
        """

    parsed = bill_parser.parse_text(text_content)
    if parsed["units_consumed"] <= 0:
        raise HTTPException(status_code=422, detail="Failed to parse utility bill from text")

    hostel_c = hostel_code or parsed["hostel_code"]
    hostel = db.query(Hostel).filter(Hostel.code == hostel_c).first()
    bill_dt = date.fromisoformat(parsed["bill_month"])

    bill = UtilityBill(
        hostel_id=hostel.id if hostel else None,
        utility=parsed["utility"],
        bill_month=bill_dt,
        units_consumed=parsed["units_consumed"],
        amount_inr=parsed["amount_inr"],
        tariff_rate=parsed.get("tariff_rate", 6.85),
        parsed_confidence=parsed["parsed_confidence"],
        created_at=datetime.now(timezone.utc)
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)

    return {
        "id": bill.id,
        "extracted": parsed,
        "confidence": parsed["parsed_confidence"],
        "status": "INGESTED"
    }


@router.get("/bills")
def list_utility_bills(
    utility: Optional[str] = Query(None),
    hostel_code: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Lists utility bills with hostel scoping and utility filters."""
    query = db.query(UtilityBill)

    if hostel_code:
        hostel = db.query(Hostel).filter(Hostel.code == hostel_code.upper()).first()
        if hostel:
            query = query.filter(UtilityBill.hostel_id == hostel.id)

    if utility:
        query = query.filter(UtilityBill.utility == utility.lower())

    bills = query.order_by(desc(UtilityBill.bill_month)).limit(limit).all()

    result = []
    for b in bills:
        h = db.query(Hostel).filter(Hostel.id == b.hostel_id).first() if b.hostel_id else None
        result.append({
            "id": b.id,
            "hostel_code": h.code if h else "CAMPUS",
            "hostel_name": h.name if h else "Campus Wide",
            "utility": b.utility,
            "bill_month": b.bill_month.isoformat(),
            "units_consumed": b.units_consumed,
            "amount_inr": b.amount_inr,
            "tariff_rate": b.tariff_rate,
            "source_file_url": b.source_file_url,
            "parsed_confidence": b.parsed_confidence
        })
    return result


@router.get("/forecasts")
def get_utility_forecasts(
    utility: str = Query("electricity", description="electricity or water"),
    months_ahead: int = Query(3, ge=1, le=12),
    hostel_code: Optional[str] = Query("HB-3"),
    x_actor_role: Optional[str] = Header(None, alias="X-Actor-Role"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns quantile forecast predictions with 90% confidence interval (§8.5).
    """
    if x_actor_role:
        caller_role = x_actor_role.upper()
        if caller_role not in ["ESTATE_OFFICER", "CHIEF_WARDEN", "DIRECTOR", "ADMIN"]:
            raise HTTPException(
                status_code=403,
                detail=f"FORBIDDEN_ROLE: Role {caller_role} is not authorized to access utility forecasts"
            )

    # Fetch historical bills from db
    hostel = db.query(Hostel).filter(Hostel.code == hostel_code.upper()).first() if hostel_code else None
    query = db.query(UtilityBill).filter(UtilityBill.utility == utility.lower())
    if hostel:
        query = query.filter(UtilityBill.hostel_id == hostel.id)

    bills = query.order_by(UtilityBill.bill_month.asc()).all()

    records = [
        {
            "bill_month": b.bill_month.isoformat(),
            "units_consumed": b.units_consumed,
            "amount_inr": b.amount_inr,
            "utility": b.utility
        }
        for b in bills
    ]

    active_forecaster = forecaster if forecaster.utility == utility.lower() else UtilityForecaster(utility=utility.lower())
    predictions = []
    current_date = date.today()
    for i in range(1, months_ahead + 1):
        target_month = (current_date.month + i - 1) % 12 + 1
        year_offset = (current_date.month + i - 1) // 12
        target_year = current_date.year + year_offset
        m_str = f"{target_year}-{target_month:02d}-01"

        res = active_forecaster.predict(month=target_month, resident_count=850)
        predictions.append({
            "target_month": m_str,
            "month": target_month,
            "predicted_units": res["predicted_units"],
            "lower_ci": res["lower_ci"],
            "upper_ci": res["upper_ci"],
            "p10": res["lower_ci"],
            "p50": res["predicted_units"],
            "p90": res["upper_ci"]
        })

    return {
        "utility": utility.lower(),
        "hostel_code": hostel_code.upper() if hostel_code else "CAMPUS",
        "months_ahead": months_ahead,
        "historical_records_used": len(records),
        "predictions": predictions
    }


@router.post("/forecasts/train")
def train_forecaster_endpoint(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Re-trains the quantile gradient boosting forecaster on all historical bills."""
    bills = db.query(UtilityBill).all()
    records = [
        {
            "bill_month": b.bill_month.isoformat(),
            "units_consumed": b.units_consumed,
            "amount_inr": b.amount_inr,
            "utility": b.utility
        }
        for b in bills
    ]
    res = forecaster.train(records)
    return {
        "status": "TRAINED",
        "sample_count": len(records),
        "metrics": res
    }
