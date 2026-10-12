"""
Database Seeding Script (15)
Seeds canonical hostels, blocks, rooms, categories, SLA policies, and 8 demonstration personas.
Can be executed standalone or called during application startup.
"""

import os
import json
from datetime import date
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .models import (
    Hostel, Block, Room, CaretakerSkill, User,
    Category, SlaPolicy, CampusEvent, UtilityBill
)

CANONICAL_PERSONAS = [
    {
        "id": "usr-student-aarav",
        "email": "student.hb3@campusiq.in",
        "full_name": "Aarav Sharma",
        "phone": "+91 98765 43210",
        "role": "STUDENT",
        "hostel_code": "HB-3"
    },
    {
        "id": "usr-cr-diya",
        "email": "cr.hb3@campusiq.in",
        "full_name": "Diya Patel (CR)",
        "phone": "+91 98765 43211",
        "role": "CR",
        "hostel_code": "HB-3"
    },
    {
        "id": "usr-rep-rohan",
        "email": "rep.hb3@campusiq.in",
        "full_name": "Rohan Mehta",
        "phone": "+91 98765 43212",
        "role": "HOSTEL_REP",
        "hostel_code": "HB-3"
    },
    {
        "id": "usr-caretaker-das",
        "email": "caretaker.hb3@campusiq.in",
        "full_name": "R. Das",
        "phone": "+91 98765 43213",
        "role": "CARETAKER",
        "hostel_code": "HB-3",
        "skills": [
            {"skill": "electrical", "proficiency": 5},
            {"skill": "plumbing", "proficiency": 4}
        ]
    },
    {
        "id": "usr-warden-nanda",
        "email": "warden.hb3@campusiq.in",
        "full_name": "Dr. S. Nanda",
        "phone": "+91 98765 43214",
        "role": "WARDEN",
        "hostel_code": "HB-3"
    },
    {
        "id": "usr-chief-warden-mishra",
        "email": "chief.warden@campusiq.in",
        "full_name": "Prof. M. Mishra",
        "phone": "+91 98765 43215",
        "role": "CHIEF_WARDEN",
        "hostel_code": None
    },
    {
        "id": "usr-estate-rao",
        "email": "estate@campusiq.in",
        "full_name": "Col. (Retd.) P. Rao",
        "phone": "+91 98765 43216",
        "role": "ESTATE_OFFICER",
        "hostel_code": None
    },
    {
        "id": "usr-director-sahoo",
        "email": "director@campusiq.in",
        "full_name": "Dr. K. Sahoo",
        "phone": "+91 98765 43217",
        "role": "DIRECTOR",
        "hostel_code": None
    },
    {
        "id": "usr-admin-sys",
        "email": "admin@campusiq.in",
        "full_name": "System Administrator",
        "phone": "+91 98765 43218",
        "role": "ADMIN",
        "hostel_code": None
    }
]

HOSTELS_DATA = [
    {"code": "HB-3", "name": "Homi Bhabha Hall of Residence", "type": "boys", "resident_count": 850},
    {"code": "KMS", "name": "Kiran Mazumdar-Shaw Hall of Residence", "type": "girls", "resident_count": 620},
    {"code": "CVR", "name": "C.V. Raman Hall of Residence", "type": "girls", "resident_count": 780},
    {"code": "GDB", "name": "Gopabandhu Das Hall of Residence", "type": "boys", "resident_count": 520},
]

CATEGORIES_DATA = [
    {"code": "ELECTRICAL", "name": "Electrical Infrastructure", "default_severity": 3, "sla_class": "P2"},
    {"code": "WATER", "name": "Water & Plumbing", "default_severity": 3, "sla_class": "P2"},
    {"code": "HYGIENE", "name": "Hygiene & Sanitation", "default_severity": 2, "sla_class": "P3"},
    {"code": "CIVIL", "name": "Civil & Infrastructure", "default_severity": 2, "sla_class": "P3"},
    {"code": "SECURITY", "name": "Safety & Security", "default_severity": 3, "sla_class": "P2"},
    {"code": "MISC", "name": "Miscellaneous", "default_severity": 1, "sla_class": "P4"}
]

SLA_POLICIES_DATA = [
    {"priority": "P1", "sla_hours": 2, "warning_at_pct": 75, "p1_escalation_minutes": 45},
    {"priority": "P2", "sla_hours": 8, "warning_at_pct": 75, "p1_escalation_minutes": 45},
    {"priority": "P3", "sla_hours": 48, "warning_at_pct": 75, "p1_escalation_minutes": 45},
    {"priority": "P4", "sla_hours": 168, "warning_at_pct": 75, "p1_escalation_minutes": 45}
]


def seed_database(db: Session) -> Dict[str, int]:
    """Populates the database with hostels, categories, policies, and personas."""
    counts = {"hostels": 0, "categories": 0, "policies": 0, "users": 0}

    # 1. Hostels
    hostel_map: Dict[str, str] = {}
    for h in HOSTELS_DATA:
        existing = db.query(Hostel).filter(Hostel.code == h["code"]).first()
        if not existing:
            try:
                hostel = Hostel(
                    code=h["code"],
                    name=h["name"],
                    type=h["type"],
                    resident_count=h["resident_count"]
                )
                db.add(hostel)
                db.flush()
                hostel_map[h["code"]] = hostel.id
                counts["hostels"] += 1

                # Seed standard blocks
                for b_name in ["A Block", "B Block", "C Block", "Pump Room Area", "Mess Block"]:
                    kind = "utility" if "Pump" in b_name else ("common" if "Mess" in b_name else "residential")
                    block = Block(hostel_id=hostel.id, name=b_name, kind=kind)
                    db.add(block)
                    db.flush()

                    # Seed sample rooms
                    if kind == "residential":
                        for r_no in ["101", "102", "201", "202", "214", "301", "302"]:
                            db.add(Room(block_id=block.id, room_no=r_no))
                db.commit()
            except Exception:
                db.rollback()
                existing = db.query(Hostel).filter(Hostel.code == h["code"]).first()
                if existing:
                    hostel_map[h["code"]] = existing.id
        else:
            hostel_map[h["code"]] = existing.id

    # 2. Categories
    for c in CATEGORIES_DATA:
        try:
            if not db.query(Category).filter(Category.code == c["code"]).first():
                db.add(Category(**c))
                db.commit()
                counts["categories"] += 1
        except Exception:
            db.rollback()

    # 3. SLA Policies
    for p in SLA_POLICIES_DATA:
        try:
            if not db.query(SlaPolicy).filter(SlaPolicy.priority == p["priority"]).first():
                db.add(SlaPolicy(**p))
                db.commit()
                counts["policies"] += 1
        except Exception:
            db.rollback()

    # 4. Canonical Personas
    for p in CANONICAL_PERSONAS:
        try:
            existing = db.query(User).filter(User.email == p["email"]).first()
            h_id = hostel_map.get(p.get("hostel_code")) if p.get("hostel_code") else None
            
            if not existing:
                user = User(
                    id=p["id"],
                    email=p["email"],
                    full_name=p["full_name"],
                    phone=p["phone"],
                    role=p["role"],
                    hostel_id=h_id,
                    is_active=True
                )
                db.add(user)
                db.flush()
                counts["users"] += 1

                # Add skills for caretaker
                for skill_info in p.get("skills", []):
                    db.add(CaretakerSkill(
                        user_id=user.id,
                        skill=skill_info["skill"],
                        proficiency=skill_info["proficiency"]
                    ))
                db.commit()
            else:
                if h_id and not existing.hostel_id:
                    existing.hostel_id = h_id
                    db.commit()
        except Exception:
            db.rollback()

    # Also seed additional caretakers for trades (Civil, Housekeeping) in HB-3
    extra_caretakers = [
        {
            "id": "usr-ct-nayak",
            "email": "caretaker.civil.hb3@campusiq.in",
            "full_name": "M. Nayak",
            "phone": "+91 98765 43220",
            "role": "CARETAKER",
            "hostel_code": "HB-3",
            "skills": [
                {"skill": "civil", "proficiency": 5},
                {"skill": "housekeeping", "proficiency": 4}
            ]
        }
    ]
    for ct in extra_caretakers:
        try:
            if not db.query(User).filter(User.email == ct["email"]).first():
                h_id = hostel_map.get(ct["hostel_code"])
                user = User(
                    id=ct["id"],
                    email=ct["email"],
                    full_name=ct["full_name"],
                    phone=ct["phone"],
                    role=ct["role"],
                    hostel_id=h_id,
                    is_active=True
                )
                db.add(user)
                db.flush()
                for s in ct["skills"]:
                    db.add(CaretakerSkill(user_id=user.id, skill=s["skill"], proficiency=s["proficiency"]))
                db.commit()
        except Exception:
            db.rollback()

    # 5. Campus Events
    events_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "seed_data", "campus_events.json")
    if os.path.exists(events_file):
        try:
            if db.query(CampusEvent).count() == 0:
                with open(events_file, "r", encoding="utf-8") as f:
                    events_data = json.load(f)
                    for ev in events_data:
                        db.add(CampusEvent(
                            id=ev.get("id"),
                            name=ev["name"],
                            kind=ev["kind"],
                            starts_on=date.fromisoformat(ev["starts_on"]),
                            ends_on=date.fromisoformat(ev["ends_on"]),
                            expected_footfall=ev.get("expected_footfall", 0),
                            water_surge_multiplier=ev.get("water_surge_multiplier", 1.0),
                            electricity_surge_multiplier=ev.get("electricity_surge_multiplier", 1.0),
                            hygiene_pressure_multiplier=ev.get("hygiene_pressure_multiplier", 1.0)
                        ))
                    db.commit()
                    counts["events"] = len(events_data)
        except Exception:
            db.rollback()

    # 6. 36 Months Utility Bills
    bills_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "seed_data", "utility_bills_36m.json")
    if os.path.exists(bills_file):
        try:
            if db.query(UtilityBill).count() == 0:
                with open(bills_file, "r", encoding="utf-8") as f:
                    bills_data = json.load(f)
                    for b in bills_data:
                        h_id = hostel_map.get(b.get("hostel_code"))
                        db.add(UtilityBill(
                            hostel_id=h_id,
                            utility=b["utility"],
                            bill_month=date.fromisoformat(b["bill_month"]),
                            units_consumed=b["units_consumed"],
                            amount_inr=b["amount_inr"],
                            tariff_rate=b.get("tariff_rate", 6.85),
                            parsed_confidence=1.0
                        ))
                    db.commit()
                    counts["bills"] = len(bills_data)
        except Exception:
            db.rollback()

    return counts


if __name__ == "__main__":
    init_db()
    with SessionLocal() as session:
        res = seed_database(session)
        print(f"[OK] Seed completed: {res}")
