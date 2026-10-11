"""
AI & Facility Intelligence REST Endpoints (§7.5, §7.6, §8)
Exposes complaint triage, dynamic queue ranking, utility forecasts, and continuous learning.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..ai.engine import CampusAIEngine
from ..models import Complaint, User, Hostel

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

# Shared engine instance
ai_engine = CampusAIEngine()


@router.post("/triage")
def triage_complaint(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Runs full autonomous triage on a complaint draft:
    Classifies category, checks duplicates, scores risk, calculates ranking, matches caretaker.
    """
    hostel_code = payload.get("hostel_code", "HB-3")
    
    # Fetch active complaints in same hostel for duplicate detection
    hostel = db.query(Hostel).filter(Hostel.code == hostel_code).first()
    active_complaints = []
    if hostel:
        db_complaints = db.query(Complaint).filter(
            Complaint.hostel_id == hostel.id,
            Complaint.status.in_(["OPEN", "VERIFIED", "ASSIGNED", "IN_PROGRESS"])
        ).all()
        for c in db_complaints:
            active_complaints.append({
                "id": c.id,
                "ticket_no": c.ticket_no,
                "title": c.title,
                "description": c.description,
                "location_text": c.location_text
            })

    # Fetch available caretakers
    caretakers = []
    db_caretakers = db.query(User).filter(User.role == "CARETAKER").all()
    for ct in db_caretakers:
        ct_hostel = db.query(Hostel).filter(Hostel.id == ct.hostel_id).first() if ct.hostel_id else None
        skills = {}
        for s in ct.caretaker_skills if hasattr(ct, "caretaker_skills") else []:
            skills[s.skill] = s.proficiency
        caretakers.append({
            "id": ct.id,
            "full_name": ct.full_name,
            "hostel_code": ct_hostel.code if ct_hostel else None,
            "skills": skills
        })

    triage_result = ai_engine.triage_complaint(
        complaint_data=payload,
        active_complaints=active_complaints,
        caretakers=caretakers
    )
    return triage_result


@router.get("/queue")
def get_ranked_queue(
    hostel_code: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns active tickets ranked dynamically by priority and SLA urgency."""
    query = db.query(Complaint).filter(
        Complaint.status.in_(["ASSIGNED", "IN_PROGRESS", "ESCALATED"])
    )
    if hostel_code:
        hostel = db.query(Hostel).filter(Hostel.code == hostel_code).first()
        if hostel:
            query = query.filter(Complaint.hostel_id == hostel.id)

    tickets = []
    for c in query.all():
        tickets.append({
            "id": c.id,
            "ticket_no": c.ticket_no,
            "title": c.title,
            "status": c.status,
            "priority": c.priority,
            "risk_score": c.risk_score or 50.0,
            "created_at": c.created_at,
            "assigned_at": c.assigned_at
        })

    ranked = ai_engine.rank_queue(tickets)
    return ranked


@router.get("/continuous-learning/status")
def get_learning_status():
    """Returns active continuous learning status, buffer counts, and drift alerts."""
    return ai_engine.get_learning_status()


@router.post("/continuous-learning/feedback")
def log_operator_feedback(
    payload: Dict[str, Any] = Body(...)
):
    """Logs verified supervisor category or severity correction."""
    ticket_no = payload.get("ticket_no", "UNKNOWN")
    title = payload.get("title", "")
    description = payload.get("description", "")
    category = payload.get("corrected_category", "MISC")
    severity = payload.get("corrected_severity")
    role = payload.get("actor_role", "WARDEN")

    res = ai_engine.ingest_operator_feedback(
        ticket_no=ticket_no,
        title=title,
        description=description,
        corrected_category=category,
        corrected_severity=severity,
        actor_role=role
    )
    return res


@router.post("/utilities/forecast")
def predict_utility_demand(
    payload: Dict[str, Any] = Body(...)
):
    """Predicts next utility consumption, rupee amounts with 90% CI and trend direction."""
    hostel = payload.get("hostel_code", "HB-3")
    utility = payload.get("utility", "electricity")
    month = int(payload.get("target_month", 11))
    residents = int(payload.get("resident_count", 850))
    tariff = float(payload.get("tariff_rate", 6.85 if utility == "electricity" else 18.50))
    event_mult = float(payload.get("event_multiplier", 1.0))

    pred = ai_engine.predict_next_bill(
        hostel_code=hostel,
        utility=utility,
        target_month=month,
        resident_count=residents,
        tariff_rate=tariff,
        event_multiplier=event_mult
    )
    return pred


@router.post("/utilities/bills/upload")
def upload_utility_bill(
    payload: Dict[str, Any] = Body(...)
):
    """
    Ingests utility bills uploaded from frontend, parses records,
    checks for drift/surge anomalies, and updates models continuously.
    """
    records = payload.get("bills", [])
    raw_csv = payload.get("csv_content")

    if raw_csv:
        parsed_records = ai_engine.parse_bill_file(raw_csv, is_csv=True)
        records.extend(parsed_records)

    if not records:
        raise HTTPException(status_code=400, detail="No bill records or CSV content provided")

    ingest_res = ai_engine.ingest_real_bills(records, auto_retrain=True)
    return {
        "status": "SUCCESS",
        "ingest_summary": ingest_res
    }


@router.post("/facility-stress/simulate")
def simulate_facility_stress(
    payload: Dict[str, Any] = Body(...)
):
    """
    AI Facility Stress & Surge Simulator (§7.6, §8.5, §8.6).
    Autonomous physics & predictive intelligence engine evaluating campus-wide
    water, electrical grid, transformer, and hygiene capacity during festival surges.
    """
    import math

    event_id = payload.get("event_id")
    event_name = payload.get("event_name", "Campus Surge Scenario")
    scenario_name = payload.get("scenario_name", "Festival Peak Footfall Surge")
    base_population = int(payload.get("base_population", 8500))
    additional_footfall = int(payload.get("additional_footfall", 4500))
    water_surge_mult = float(payload.get("water_surge_multiplier", 1.38))
    elec_surge_mult = float(payload.get("electricity_surge_multiplier", 1.22))
    hygiene_mult = float(payload.get("hygiene_multiplier", 3.1))
    ambient_temp = float(payload.get("ambient_temp", 34.0))
    is_grid_outage = bool(payload.get("is_grid_outage", False))
    is_pump_failure = bool(payload.get("is_pump_failure", False))
    water_inflow_kl = float(payload.get("water_inflow_kl", 1800.0))
    leakage_percent = float(payload.get("leakage_percent", 12.0))
    solar_offset_percent = float(payload.get("solar_offset_percent", 38.0))
    target_hostels = payload.get("target_hostels", ["HB-3", "CVR", "KMS", "Hall 14"])

    total_population = base_population + additional_footfall

    # 1. Water Demand & Reservoir Physics
    daily_gross_water = (total_population * 135.0 * water_surge_mult) / 1000.0
    effective_water_demand = daily_gross_water * (1.0 + leakage_percent / 100.0)
    actual_water_inflow = water_inflow_kl * (0.50 if is_pump_failure else 1.0)
    net_water_balance = round(actual_water_inflow - effective_water_demand, 1)
    
    campus_storage_capacity = 2400.0  # kL total storage capacity across campus
    reservoir_hours = round(campus_storage_capacity / max(effective_water_demand / 24.0, 10.0), 1)
    
    deficit_kl = max(0.0, -net_water_balance)
    tankers_required_10kl = int(math.ceil(deficit_kl / 10.0))

    water_forecast = ai_engine.forecast_utility(
        utility="water",
        month=11,
        resident_count=total_population,
        event_multiplier=water_surge_mult
    )

    # 2. Electrical Peak & Transformer Physics
    temp_factor = 1.0 + max(0.0, ambient_temp - 28.0) * 0.032
    base_peak_kw = 1250.0
    gross_peak_kw = round(base_peak_kw * temp_factor * (total_population / 8500.0) * elec_surge_mult)
    solar_gen_kw = round(gross_peak_kw * (solar_offset_percent / 100.0))
    net_grid_demand_kw = max(200, gross_peak_kw - solar_gen_kw)
    substation_capacity_kw = 2500.0  # Substation 1 (33kV TPWODL yard)
    transformer_load_pct = round((net_grid_demand_kw / substation_capacity_kw) * 100.0, 1)

    if is_grid_outage:
        dg_burn_rate_l_hr = round(net_grid_demand_kw * 0.24, 1)
        dg_autonomy_hrs = round(800.0 / max(dg_burn_rate_l_hr, 10.0), 1)
    else:
        dg_burn_rate_l_hr = 0.0
        dg_autonomy_hrs = 24.0

    elec_forecast = ai_engine.forecast_utility(
        utility="electricity",
        month=11,
        resident_count=total_population,
        event_multiplier=elec_surge_mult
    )

    # 3. Hygiene & Sanitation Surge
    base_hygiene_tickets_per_day = 12
    projected_hygiene_tickets = round(base_hygiene_tickets_per_day * hygiene_mult)
    flying_squad_teams = max(2, int(math.ceil(projected_hygiene_tickets / 6.0)))

    # 4. Campus Risk Index (CRI)
    p1_ratio = min(100.0, 20.0 + (transformer_load_pct - 70.0) * 1.5 if transformer_load_pct > 70 else 20.0)
    sla_breach_rate = 22.0 + (18.0 if is_grid_outage else 0.0) + (15.0 if is_pump_failure else 0.0)
    util_anomaly = min(100.0, 35.0 + (water_surge_mult - 1.0) * 75.0 + (elec_surge_mult - 1.0) * 60.0)
    hygiene_trend = min(100.0, 25.0 + (hygiene_mult - 1.0) * 25.0)

    cri_res = ai_engine.compute_campus_risk_index(
        open_p1_p2_ratio=p1_ratio,
        sla_breach_rate_30d=sla_breach_rate,
        utility_anomaly_zscore=util_anomaly,
        hygiene_complaint_trend=hygiene_trend
    )

    # 5. Financial Contingency Requisition
    water_tanker_cost = tankers_required_10kl * 1800
    dg_fuel_cost = round(dg_burn_rate_l_hr * 12 * 96) if is_grid_outage else 0
    sanitation_overtime_cost = flying_squad_teams * 650 * 3
    total_contingency_cost = water_tanker_cost + dg_fuel_cost + sanitation_overtime_cost + 15000

    # 6. Hourly 24h Stress Curve Data
    hourly_curve = []
    for h in range(24):
        # Diurnal pattern
        if 6 <= h <= 9:
            w_factor = 1.6
            e_factor = 1.2
        elif 11 <= h <= 15:
            w_factor = 1.0
            e_factor = 1.4
        elif 18 <= h <= 22:
            w_factor = 1.7
            e_factor = 1.55
        else:
            w_factor = 0.5
            e_factor = 0.65

        h_baseline_water = round((8500 * 135 / 1000 / 24) * w_factor, 1)
        h_sim_water = round((effective_water_demand / 24) * w_factor, 1)
        h_baseline_kw = round(850 * e_factor)
        h_sim_kw = round(net_grid_demand_kw * (e_factor / 1.35))
        h_tank_pct = max(15, min(100, round(100 - (h * (100 - (reservoir_hours / 24 * 100)) / 24))))

        hourly_curve.append({
            "hour": f"{h:02d}:00",
            "baseline_water_kl": h_baseline_water,
            "simulated_water_kl": h_sim_water,
            "baseline_grid_kw": h_baseline_kw,
            "simulated_grid_kw": h_sim_kw,
            "reservoir_pct": h_tank_pct
        })

    # 7. Hostel Impact Breakdown
    hostel_matrix = [
        {
            "code": "HB-3",
            "name": "Homi Bhabha Hall (HB-3)",
            "primary_role": "Primary Guest & Participant Accommodation",
            "footfall_surge": "+1,450",
            "water_status": "CRITICAL" if net_water_balance < -200 else "ELEVATED",
            "power_status": "HIGH" if transformer_load_pct > 80 else "NORMAL",
            "assigned_squad": "Flying Sanitation Squad Alpha + 1 Dedicated Plumber",
            "action": "Pre-fill 50,000L overhead sumps 12h prior. Stage 1 standby PHED tanker."
        },
        {
            "code": "CVR",
            "name": "C.V. Raman Hall (CVR)",
            "primary_role": "Central Dining & Refreshment Hub",
            "footfall_surge": "+980",
            "water_status": "ELEVATED",
            "power_status": "NORMAL",
            "assigned_squad": "Mess Cleanliness Rapid Response Team",
            "action": "Mess RO plant operating on 24h continuous filtration schedule."
        },
        {
            "code": "KMS",
            "name": "Kiran Mazumdar-Shaw Hall (KMS)",
            "primary_role": "Girls Hostel Guest Wing & Delegations",
            "footfall_surge": "+820",
            "water_status": "ELEVATED",
            "power_status": "NORMAL",
            "assigned_squad": "Sanitation Squad Beta",
            "action": "Direct booster pump bypass active during 06:30–09:30 morning peak."
        },
        {
            "code": "Hall 14",
            "name": "Hall of Residence 14 (Mega Hostel)",
            "primary_role": "Mega Event Staging & Overfill Quarters",
            "footfall_surge": "+1,250",
            "water_status": "CRITICAL" if is_pump_failure else "ELEVATED",
            "power_status": "WARNING" if transformer_load_pct > 85 else "ELEVATED",
            "assigned_squad": "Emergency Substation & Plumber Response Unit",
            "action": "Dual-feeder automatic transfer switch verified with Estate Officer."
        }
    ]

    # 8. Synthesized AI Executive Markdown Report
    assessment_md = f"""## Executive Facility Engineering Assessment: {scenario_name}

### 1. Primary Vulnerability & Digital Twin Telemetry
| Facility Subsystem | Nominal Baseline | Simulated Surge Trajectory | Critical Stress Status |
|---|---|---|---|
| **Electrical Substation 1 (33kV)** | 1,250 kW (50% Load) | **{net_grid_demand_kw:,} kW** ({transformer_load_pct}% Transformer Load) | {"🔴 OVERLOAD THREAT (>85%)" if transformer_load_pct > 85 else ("🟡 ELEVATED LOAD (>75%)" if transformer_load_pct > 75 else "🟢 NOMINAL MARGIN")} |
| **Campus Water Buffer** | +350 kL Daily Balance | **{net_water_balance:+} kL/day** (Net Drawdown) | {"🔴 DEFICIT - TANKERS REQUIRED" if net_water_balance < 0 else "🟢 POSITIVE BALANCE"} |
| **Reservoir Storage Autonomy** | 48.0 Hours | **{reservoir_hours} Hours Remaining** | {"🔴 CRITICAL RUNOUT (<20 hrs)" if reservoir_hours < 20 else "🟡 MANAGED BUFFER"} |
| **Sanitation & Hygiene Load** | 12 complaints/day | **{projected_hygiene_tickets} tickets/day** (×{hygiene_mult:.1f} surge) | {"🔴 RAPID SQUADS MANDATED" if hygiene_mult >= 2.5 else "🟡 MODERATE STRAIN"} |
| **DG Generator Backup** | Standby Reserve | **{dg_autonomy_hrs} hrs runtime** ({dg_burn_rate_l_hr} L/hr HSD burn) | {"🔴 GRID OUTAGE CUTOVER ACTIVE" if is_grid_outage else "🟢 TPWODL GRID STABLE"} |

### 2. Chief Warden Contingency Directives
1. **Mandatory Storage Tank Pre-Fill:** Requisition PHED water supply wing to charge all hostel overhead and underground sumps to 100% capacity 12 hours prior to festival inauguration.
2. **Standby Water Tanker Logistics:** Position **{tankers_required_10kl} standby 10,000L PHED tankers** between Hall 14 and HB-3 to prevent pressure collapse during 07:00–09:30 morning peak.
3. **Substation Peak Demand Shaving:** Estate Electrical Wing must lock decorative lighting cutover until 18:30 and reschedule centralized air handling units to avoid coincident transformer tripping.
4. **Sanitation Rapid Flying Squads:** Deploy **{flying_squad_teams} roving sanitation units** operating on 4-hour cyclical inspections across HB-3, CVR, and KMS.
5. **Emergency Contingency Requisition:** Sanction provisional emergency buffer of **₹{total_contingency_cost:,}** for fuel reserves, tanker freight, and technician overtime.
"""

    return {
        "status": "SUCCESS",
        "scenario_name": scenario_name,
        "event_id": event_id,
        "event_name": event_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_population": total_population,
        "metrics": {
            "effective_water_demand_kl": round(effective_water_demand, 1),
            "actual_water_inflow_kl": round(actual_water_inflow, 1),
            "net_water_balance_kl": net_water_balance,
            "reservoir_buffer_hours": reservoir_hours,
            "tankers_required_10kl": tankers_required_10kl,
            "gross_peak_kw": gross_peak_kw,
            "solar_generation_kw": solar_gen_kw,
            "net_grid_demand_kw": net_grid_demand_kw,
            "transformer_load_percent": transformer_load_pct,
            "is_grid_outage": is_grid_outage,
            "is_pump_failure": is_pump_failure,
            "dg_burn_rate_l_hr": dg_burn_rate_l_hr,
            "dg_autonomy_hours": dg_autonomy_hrs,
            "projected_hygiene_tickets": projected_hygiene_tickets,
            "flying_squad_teams": flying_squad_teams,
            "total_contingency_cost_inr": total_contingency_cost,
        },
        "forecaster_projections": {
            "electricity_monthly_kwh": elec_forecast.get("predicted_units"),
            "water_monthly_kl": water_forecast.get("predicted_units"),
        },
        "campus_risk_index": cri_res,
        "hourly_stress_curve": hourly_curve,
        "hostel_impact_matrix": hostel_matrix,
        "ai_executive_report_markdown": assessment_md,
    }

