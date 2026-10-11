"""
CampusIQ — NIT Rourkela Synthetic Data Generator
Generates realistic, campus-grounded seed datasets for:
1. Labeled complaint dataset (350+ records across 6 categories for NIT Rourkela)
2. 36-month utility consumption time-series for HB-3, KMS, CVR, and GDB hostels
3. Campus events dataset with surge multipliers (Innovision, Nitrutsav, Exams)
"""

import os
import json
import random
from datetime import datetime, timedelta

HOSTELS = [
    {"code": "HB-3", "name": "Homi Bhabha Hall of Residence", "type": "boys", "resident_count": 850},
    {"code": "KMS", "name": "Kiran Mazumdar-Shaw Hall of Residence", "type": "girls", "resident_count": 620},
    {"code": "CVR", "name": "C.V. Raman Hall of Residence", "type": "girls", "resident_count": 780},
    {"code": "GDB", "name": "Gopabandhu Das Hall of Residence", "type": "boys", "resident_count": 520},
]

BLOCKS = ["A Block", "B Block", "C Block", "D Block", "Mess Block", "Pump Room Area", "Substation Annex"]

CATEGORIES = {
    "ELECTRICAL": {
        "name": "Electrical Infrastructure",
        "default_severity": 3,
        "sla_class": "P2",
        "keywords": ["spark", "wire", "switch", "socket", "mcb", "fan", "light", "geyser", "short-circuit", "power", "fuse", "voltage"],
        "templates": [
            ("Ceiling fan not working in room {room}", "The ceiling fan regulator is stuck and the fan refuses to rotate in {block} room {room}. It is very hot.", 2, 2, 0.2),
            ("Sparking in corridor switchboard near room {room}", "Noticeable electric sparking and burning smell coming from the main corridor switchboard outside room {room}. High risk of short circuit.", 4, 35, 0.8),
            ("Tube light completely dead in washroom", "Common washroom tube light has fused in {block} 2nd floor. Completely dark at night.", 2, 18, 0.6),
            ("Main MCB constantly tripping in {block}", "The main circuit breaker keeps tripping every 15 minutes whenever geysers or coolers run. Entire wing loses power.", 4, 60, 0.8),
            ("Water cooler power cord exposed and frayed", "The electrical wire connecting the drinking water cooler on ground floor {block} has exposed copper wires. Danger of electric shock.", 5, 80, 0.8),
            ("Corridor floodlight not working", "Outer security and corridor floodlight outside {block} is burnt out. The pathway is pitch black.", 2, 40, 0.6),
            ("Geyser heating coil burnt out in 3rd floor washroom", "The water geyser in the common bathroom {block} 3rd floor is not heating water. The indicator lamp is also dead.", 3, 25, 0.6),
            ("Loose electrical socket with burning smell in room {room}", "Laptop charger sparked when plugged into wall socket in room {room}. Socket plastic has charred mark.", 3, 2, 0.2),
            ("Phase failure affecting half of {block}", "One phase is down in {block}. Fans and half the lights are not getting voltage while other sockets work.", 3, 90, 0.8),
            ("Exposed wiring hanging near stairwell", "Cables dangling near staircase between 1st and 2nd floor in {block}. Students might accidentally touch them.", 4, 110, 0.6),
        ]
    },
    "WATER": {
        "name": "Water & Plumbing",
        "default_severity": 3,
        "sla_class": "P2",
        "keywords": ["leak", "pipe", "tap", "flush", "drain", "water", "tank", "cooler", "overflow", "pressure", "sewage"],
        "templates": [
            ("Major pipe burst near main pump room", "Water is gushing out heavily from the main underground supply pipe near the {hostel} pump room. Ground is getting waterlogged.", 5, 200, 0.8),
            ("Overhead water tank overflowing continuously", "The overhead supply tank at {block} roof has been overflowing for the last 3 hours. Thousands of liters of water being wasted.", 3, 120, 0.8),
            ("Tap broken and spraying water in 1st floor washroom", "The basin tap handle broke off in {block} 1st floor bathroom and water is spraying forcefully all over the floor.", 3, 22, 0.6),
            ("Severe low water pressure on 3rd floor", "Hardly a trickle of water coming from taps and showers on the top floor of {block}. Residents unable to get ready for classes.", 3, 50, 0.6),
            ("Flush valve stuck running in toilet cubicle", "Flush valve in toilet cubicle 2 of {block} ground floor is jammed open. Water flowing non-stop into drain.", 2, 15, 0.6),
            ("Drinking water cooler leaking and dirty filter", "Water cooler on {block} 1st floor is leaking puddles on the corridor floor and water tastes muddy.", 4, 75, 0.8),
            ("Drainage pipe clogged and overflowing in washroom", "Waste water is backing up in the drainage grating of {block} washroom. Stagnant dirty water pool forming.", 4, 30, 0.6),
            ("Geyser inlet pipe dripping steadily in room {room}", "Connection pipe to the geyser has a steady leak dripping onto the floor in room {room}.", 2, 2, 0.2),
            ("No water in entire {block} since morning", "Total water outage in {block}. No water in overhead tanks or municipal line since 6 AM.", 5, 180, 0.8),
            ("Main drainage line inspection chamber choked", "Sewage chamber behind {block} is overflowing onto the service lane. Foul wastewater spilling.", 4, 140, 0.8),
        ]
    },
    "HYGIENE": {
        "name": "Hygiene & Sanitation",
        "default_severity": 2,
        "sla_class": "P3",
        "keywords": ["garbage", "trash", "smell", "clean", "cockroach", "mosquito", "sanitation", "stagnant", "mess", "waste"],
        "templates": [
            ("Garbage bins overflowing near mess entrance", "Waste bins outside {hostel} dining hall are overflowing with food waste and paper cups. Attracting stray dogs and crows.", 3, 160, 0.6),
            ("Stagnant dirty water in cooler tray breeding mosquitoes", "Water cooler tray on {block} 2nd floor has stagnant green water. High risk of dengue and malaria.", 3, 45, 0.6),
            ("Common washroom uncleaned for over 48 hours", "The entire ground floor washroom in {block} has not been swept or disinfected for two days. Floor is filthy and bins full.", 3, 35, 0.6),
            ("Severe cockroach and insect infestation in pantry", "Pantry sink and cupboards in {block} are infested with cockroaches. Unhygienic conditions for heating food.", 2, 40, 0.6),
            ("Foul sewer smell wafting into corridor", "Intense stench coming from sewer vent near {block} entrance. Making it difficult to sit in adjacent rooms.", 2, 50, 0.6),
            ("Food waste dumped in stairwell corner", "Someone left leftover mess plates and waste food packets on the stair landing of {block}. Rotting smell.", 2, 25, 0.6),
            ("Water cooler drip tray blocked and spilling foul liquid", "Drip tray on ground floor cooler is choked with tea residue and scum, spilling on shoes.", 2, 30, 0.6),
            ("Dustbins in corridor missing lids and scattering trash", "Corridor dustbin in {block} has no lid, wind is blowing wrappers into student rooms.", 1, 20, 0.2),
        ]
    },
    "CIVIL": {
        "name": "Civil & Infrastructure",
        "default_severity": 2,
        "sla_class": "P3",
        "keywords": ["door", "window", "plaster", "ceiling", "tile", "crack", "seepage", "lock", "hinge", "railing", "wall"],
        "templates": [
            ("Washroom door lock broken and latch jammed", "Washroom door latch in {block} 2nd floor is broken. Door cannot be locked from inside.", 2, 20, 0.6),
            ("Plaster peeling and chunks falling from corridor ceiling", "Large pieces of cement plaster have fallen from the ceiling of {block} corridor near room {room}. Risk of head injury.", 4, 45, 0.6),
            ("Window glass cracked and rattling in room {room}", "Heavy wind caused the window glass pane to crack. Sharp shards might fall during stormy weather.", 2, 2, 0.2),
            ("Floor tiles cracked and loose in front of room {room}", "Ceramic floor tiles in corridor are shattered and lifting up. People tripping while walking in dark.", 2, 30, 0.6),
            ("Balcony railing loose and shaking on 3rd floor", "Iron safety railing on {block} 3rd floor balcony is rusted at base and wobbles when touched. Serious fall hazard.", 5, 80, 0.8),
            ("Rainwater seepage through wall dampening electric sockets", "Continuous rain causing moisture seepage on exterior wall in {block} room {room}. Wall is soaking wet.", 3, 2, 0.2),
            ("Door frame detached from wall in study room", "The wooden frame of the common reading room door in {block} has pulled away from the masonry.", 2, 40, 0.6),
            ("Staircase step edge chipped and slippery", "Concrete step on main staircase of {block} is chipped off, creating uneven tread.", 3, 90, 0.6),
        ]
    },
    "SECURITY": {
        "name": "Safety & Security",
        "default_severity": 3,
        "sla_class": "P2",
        "keywords": ["security", "guard", "theft", "trespass", "gate", "lock", "cctv", "boundary", "curfew", "unauthorized"],
        "templates": [
            ("Main hostel back gate padlock broken", "The security padlock on the back wicket gate of {hostel} is broken. Anyone can enter from outside campus.", 4, 300, 0.8),
            ("CCTV camera at main entrance offline", "The security surveillance camera covering the front porch and entry register is showing no signal.", 3, 500, 0.8),
            ("Bicycle stolen from hostel parking bay", "A student's geared bicycle was reported missing from the {hostel} cycle stand between 6 PM and 10 PM.", 2, 1, 0.2),
            ("Unauthorized stranger spotted wandering in {block}", "An unidentified person without visitor badge was seen knocking on room doors on the 2nd floor of {block}.", 4, 60, 0.6),
            ("Emergency fire exit door jammed shut", "The designated fire escape staircase door at the end of {block} 3rd floor is rusted and completely jammed.", 5, 120, 1.0),
            ("Boundary wall barbed wire cut near {hostel}", "Section of barbed wire fence behind {hostel} has been cut open, creating an illicit passage.", 4, 250, 0.8),
        ]
    },
    "MISC": {
        "name": "Miscellaneous",
        "default_severity": 1,
        "sla_class": "P4",
        "keywords": ["mess", "gym", "washing", "machine", "board", "recreation", "wifi", "table", "newspaper"],
        "templates": [
            ("Washing machine drum not spinning in laundry room", "Common washing machine #2 in {hostel} laundry room turns on but drum does not spin during rinse cycle.", 2, 35, 0.6),
            ("Table tennis net torn in common room", "The TT table net in {hostel} recreation room is ripped in half and clamps are bent.", 1, 15, 0.6),
            ("Water dispenser paper cup dispenser broken", "Plastic cup dispenser next to water cooler has snapped off.", 1, 20, 0.6),
            ("Notice board glass slider locked and key lost", "Hostel secretary unable to pin new festival schedule because notice board key is missing.", 1, 50, 0.2),
            ("Gym dumbbell rack bolt loose", "Bolt on the 3-tier dumbbell rack in hostel gym is wobbling under weight.", 2, 25, 0.6),
        ]
    }
}

CAMPUS_EVENTS = [
    {
        "id": "evt-innovision-2026",
        "name": "Innovision 2026 (All-India Techno-Management Fest)",
        "kind": "techfest",
        "starts_on": "2026-11-06",
        "ends_on": "2026-11-08",
        "expected_footfall": 4500,
        "water_surge_multiplier": 1.38,
        "electricity_surge_multiplier": 1.22,
        "hygiene_pressure_multiplier": 3.10,
        "critical_hostels": ["HB-3", "CVR", "KMS"],
        "budget_estimate_inr": 52000,
        "recommendations": [
            "Pre-inspect all water pump rooms in HB-3 and KMS 48h prior",
            "Deploy 4 additional sanitation workers per hostel block",
            "Stage 2 emergency electrician kits at main control room",
            "Verify backup diesel generators for all hostel dining halls"
        ]
    },
    {
        "id": "evt-nitrutsav-2027",
        "name": "Nitrutsav 2027 (Annual Cultural Festival)",
        "kind": "festival",
        "starts_on": "2027-02-12",
        "ends_on": "2027-02-14",
        "expected_footfall": 3800,
        "water_surge_multiplier": 1.30,
        "electricity_surge_multiplier": 1.25,
        "hygiene_pressure_multiplier": 2.80,
        "critical_hostels": ["HB-3", "GDB", "CVR"],
        "budget_estimate_inr": 48000,
        "recommendations": [
            "Schedule continuous trash clearing around central lawn & dining halls",
            "Test high-output floodlight fixtures in main corridors",
            "Pre-stock replacement taps and plumbing washroom cartridges"
        ]
    },
    {
        "id": "evt-endsem-autumn-2026",
        "name": "Autumn Semester End-Term Examinations",
        "kind": "exam",
        "starts_on": "2026-11-23",
        "ends_on": "2026-12-04",
        "expected_footfall": 0,
        "water_surge_multiplier": 1.05,
        "electricity_surge_multiplier": 1.15,
        "hygiene_pressure_multiplier": 1.40,
        "critical_hostels": ["HB-3", "KMS", "CVR", "GDB"],
        "budget_estimate_inr": 20000,
        "recommendations": [
            "Enforce strict 24x7 silent hours electrical maintenance protocol",
            "Ensure reading room air conditioning and illumination 100% operational",
            "Night electrician on call 22:00 to 06:00 in all hostels"
        ]
    }
]


def generate_complaints_seed(target_count: int = 360, seed: int = 42):
    """Generates synthetic, labeled complaints dataset for NIT Rourkela."""
    random.seed(seed)
    complaints = []
    
    ticket_counter = 1
    start_date = datetime(2026, 8, 1)
    
    categories_keys = list(CATEGORIES.keys())
    
    for i in range(target_count):
        # Evenly distribute or slightly weight water & electrical
        cat_code = random.choice(categories_keys)
        cat_info = CATEGORIES[cat_code]
        
        hostel = random.choice(HOSTELS)
        block = random.choice(BLOCKS)
        room_no = f"{random.randint(1, 4)}{random.randint(10, 35)}"
        
        template = random.choice(cat_info["templates"])
        title_fmt, desc_fmt, base_sev, base_people, asset_crit = template
        
        title = title_fmt.format(hostel=hostel["code"], block=block, room=room_no)
        desc = desc_fmt.format(hostel=hostel["code"], block=block, room=room_no)
        
        # Add slight natural language variations
        variations = [
            "",
            " Please fix this urgently.",
            " Happening since morning.",
            " Reported by floor wing rep.",
            " Multiple students complaining.",
            " Very disturbing for studies."
        ]
        desc += random.choice(variations)
        
        # Severity with slight noise
        severity = max(1, min(5, base_sev + random.choice([-1, 0, 0, 1])))
        people_affected = max(1, int(base_people * random.uniform(0.7, 1.4)))
        
        # Random timestamp over the past 60 days
        timestamp = start_date + timedelta(days=random.randint(0, 60), hours=random.randint(6, 23), minutes=random.randint(0, 59))
        
        ticket_no = f"CIQ-2026-{ticket_counter:05d}"
        ticket_counter += 1
        
        complaint = {
            "ticket_no": ticket_no,
            "title": title,
            "description": desc,
            "category_code": cat_code,
            "hostel_code": hostel["code"],
            "block_name": block,
            "room_no": room_no if "room" in title_fmt.lower() or "room" in desc_fmt.lower() else None,
            "location_text": f"{block}, {hostel['code']}",
            "severity": severity,
            "people_affected": people_affected,
            "asset_criticality": asset_crit,
            "created_at": timestamp.isoformat()
        }
        complaints.append(complaint)
        
    return complaints


def generate_utility_bills_36m(seed: int = 42):
    """
    Generates 36 months of realistic electricity and water utility bills
    for the 4 hostels (HB-3, KMS, CVR, GDB) leading up to October 2026.
    """
    random.seed(seed)
    bills = []
    
    # 36 months from Nov 2023 to Oct 2026
    start_year = 2023
    start_month = 11
    
    tariffs = {
        "electricity": 6.85,  # INR per kWh (institutional tariff)
        "water": 18.50        # INR per kL (bulk municipal supply)
    }
    
    for month_idx in range(36):
        year = start_year + (start_month + month_idx - 1) // 12
        m = ((start_month + month_idx - 1) % 12) + 1
        bill_date = f"{year:04d}-{m:02d}-01"
        
        # Seasonal weather factor
        # Summer (Apr-Jun): m in [4, 5, 6] -> heat waves in Rourkela (40C+)
        # Winter (Dec-Jan): m in [12, 1] -> geysers run heavily
        # Vacation (May-Jun, Dec): lower resident occupancy
        if m in [4, 5, 6]:
            elec_seasonal = 1.35
            water_seasonal = 1.25
        elif m in [12, 1]:
            elec_seasonal = 1.18
            water_seasonal = 0.90
        elif m in [7, 8, 9]:  # Monsoon
            elec_seasonal = 1.05
            water_seasonal = 1.00
        else:
            elec_seasonal = 1.00
            water_seasonal = 1.00
            
        # Vacation dip (May, June, late Dec)
        if m in [5, 6]:
            occupancy_factor = 0.45
        elif m == 12:
            occupancy_factor = 0.70
        else:
            occupancy_factor = 1.00
            
        # Festival surge (Nov: Innovision, Feb: Nitrutsav)
        fest_elec_surge = 1.15 if m in [11, 2] else 1.0
        fest_water_surge = 1.25 if m in [11, 2] else 1.0
        
        for hostel in HOSTELS:
            res_count = hostel["resident_count"] * occupancy_factor
            
            # Base per resident: ~95 kWh / month, ~4.2 kL / month
            noise_elec = random.uniform(0.95, 1.05)
            noise_water = random.uniform(0.93, 1.07)
            
            elec_units = round(res_count * 95 * elec_seasonal * fest_elec_surge * noise_elec, 2)
            elec_amount = round(elec_units * tariffs["electricity"], 2)
            
            water_units = round(res_count * 4.2 * water_seasonal * fest_water_surge * noise_water, 2)
            water_amount = round(water_units * tariffs["water"], 2)
            
            bills.append({
                "hostel_code": hostel["code"],
                "utility": "electricity",
                "bill_month": bill_date,
                "units_consumed": elec_units,
                "unit_name": "kWh",
                "amount_inr": elec_amount,
                "tariff_rate": tariffs["electricity"],
                "resident_count": hostel["resident_count"],
                "active_residents": int(res_count)
            })
            
            bills.append({
                "hostel_code": hostel["code"],
                "utility": "water",
                "bill_month": bill_date,
                "units_consumed": water_units,
                "unit_name": "kL",
                "amount_inr": water_amount,
                "tariff_rate": tariffs["water"],
                "resident_count": hostel["resident_count"],
                "active_residents": int(res_count)
            })
            
    return bills


def export_all_seed_data(base_dir: str):
    """Writes all seed data to disk under backend/seed_data/"""
    os.makedirs(base_dir, exist_ok=True)
    
    complaints = generate_complaints_seed(target_count=380)
    complaints_path = os.path.join(base_dir, "complaint_train.jsonl")
    with open(complaints_path, "w", encoding="utf-8") as f:
        for c in complaints:
            f.write(json.dumps(c) + "\n")
            
    bills = generate_utility_bills_36m()
    bills_path = os.path.join(base_dir, "utility_bills_36m.json")
    with open(bills_path, "w", encoding="utf-8") as f:
        json.dump(bills, f, indent=2)
        
    events_path = os.path.join(base_dir, "campus_events.json")
    with open(events_path, "w", encoding="utf-8") as f:
        json.dump(CAMPUS_EVENTS, f, indent=2)
        
    print(f"[OK] Seed data exported successfully to {base_dir}")
    print(f"     - Complaints: {len(complaints)} rows ({complaints_path})")
    print(f"     - Utility Bills: {len(bills)} records across 36 months ({bills_path})")
    print(f"     - Campus Events: {len(CAMPUS_EVENTS)} events ({events_path})")


if __name__ == "__main__":
    import sys
    dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..", "backend", "seed_data")
    export_all_seed_data(os.path.abspath(dest))
