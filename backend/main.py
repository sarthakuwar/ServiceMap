"""
ServiceMap — FastAPI Backend
Government-Grade Urban Infrastructure Planning API + Civic Grievance System

Endpoints:
  GET  /api/grid                  → Grid cells with vulnerability index
  GET  /api/facilities            → Facilities with contact info
  GET  /api/recommendations       → Precomputed infrastructure recommendations
  GET  /api/ward-history          → Ward governance trend data
  GET  /api/contacts/{cell_id}    → Nearest services directory for a cell
  POST /api/simulate              → Server-side what-if simulation engine
  POST /api/grievances            → Submit a new grievance
  GET  /api/grievances            → List all grievances (filterable)
  GET  /api/grievances/stats      → Dashboard statistics
  GET  /api/grievances/{gid}      → Single grievance detail
  GET  /api/grievances/track/{tn} → Public tracking by reference
  PUT  /api/grievances/{gid}/acknowledge → Officer acknowledges
  PUT  /api/grievances/{gid}/status      → Update status
  PUT  /api/grievances/{gid}/verify      → Citizen verifies resolution
"""

import json
import math
import os
import random
import string
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from email_service import (
    send_grievance_submitted,
    send_grievance_acknowledged,
    send_status_update,
    send_escalation_alert,
    send_resolution_notification,
    send_follow_confirmation,
    send_government_update,
)

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ServiceMap API",
    description="AI-Based Essential Services Accessibility Gap Detection System",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data Loading ─────────────────────────────────────────────────────────────

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")


def _load_json(filename: str):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


# Load data once at startup
grid_cells_raw: list = _load_json("gridCells.json")
facilities_raw: list = _load_json("facilities.json")
recommendations_raw: list = _load_json("recommendations.json")
ward_history_raw: list = _load_json("wardHistory.json")

# ─── Vulnerability Index Enrichment ──────────────────────────────────────────
# Fairness-aware: blend accessibility with socioeconomic vulnerability
# Higher vulnerability_index = more urgent need for intervention

# Seed for deterministic demo results
random.seed(42)

# Deterministic hash function for fake contacts
def _hash_str(s: str) -> int:
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return h

# Generate realistic Bangalore phone numbers and addresses for facilities
FACILITY_CONTACTS = {}
STREET_NAMES = [
    "MG Road", "Brigade Road", "Residency Road", "Cunningham Road",
    "Vittal Mallya Road", "Lavelle Road", "Richmond Road", "Museum Road",
    "Infantry Road", "Commercial Street", "Bull Temple Road", "DVG Road",
    "Kanakapura Road", "Bannerghatta Road", "Sarjapur Road", "ORR",
    "100 Feet Road", "80 Feet Road", "CMH Road", "Old Airport Road",
    "Hosur Road", "Mysore Road", "Tumkur Road", "Bellary Road"
]

HOSPITAL_NAMES = [
    "Bangalore Medical Centre", "St. Martha's Hospital", "Victoria Hospital",
    "Bowring & Lady Curzon Hospital", "KC General Hospital", "Mallya Hospital",
    "Manipal Hospital", "Fortis Hospital", "Apollo Hospital", "Columbia Asia",
    "Narayana Health", "Sakra World Hospital"
]

SCHOOL_NAMES = [
    "Kendriya Vidyalaya", "Delhi Public School", "National Public School",
    "Bishop Cotton School", "St. Joseph's School", "Baldwin School",
    "Frank Anthony Public School", "Clarence School", "Sacred Heart School",
    "Cluny Convent School", "MES College", "St. Anne's School"
]

for fac in facilities_raw:
    fac_id = fac["id"]
    fac_type = fac["category"] if "category" in fac else fac["type"]
    seed = _hash_str(fac_id)
    
    if fac_type == "hospital":
        real_name = HOSPITAL_NAMES[seed % len(HOSPITAL_NAMES)]
    elif fac_type == "school":
        real_name = SCHOOL_NAMES[seed % len(SCHOOL_NAMES)]
    else:
        real_name = fac["name"]
        
    street = STREET_NAMES[seed % len(STREET_NAMES)]
    phone = f"+91-80-{(seed % 8000) + 2000}-{(seed % 9000) + 1000}"
    hours = "24/7" if fac_type in ("hospital", "police_station", "fire_station") else "8:00 AM – 6:00 PM"
    pincodes = [560001, 560004, 560008, 560011, 560025, 560030, 560034, 560038, 560041, 560047]
    
    FACILITY_CONTACTS[fac_id] = {
        "name": real_name,
        "address": f"No. {(seed % 250) + 1}, {street}, Bengaluru - {pincodes[seed % len(pincodes)]}",
        "phone": phone,
        "hours": hours,
        "emergency": fac_type in ("hospital", "police_station", "fire_station"),
    }


def _enrich_grid_cells(cells: list) -> list:
    """Add vulnerability_index and fairness_adjusted_score to each cell."""
    if not cells: return []
    
    pop_densities = [c.get("population_density", c["population_estimate"] / 0.73) for c in cells]
    min_pop = min(pop_densities) if pop_densities else 0
    max_pop = max(pop_densities) if pop_densities else 1
    if max_pop == min_pop: max_pop = min_pop + 1
    
    enriched = []
    for cell in cells:
        pop_density = cell.get("population_density", cell["population_estimate"] / 0.73)
        normalized_population = (pop_density - min_pop) / (max_pop - min_pop)
        
        service_deficit = 1 - (cell["accessibility_score"] / 100)
        
        # Vulnerability = 0.6 * service_deficit + 0.4 * normalized_population
        vulnerability_index = round((0.6 * service_deficit + 0.4 * normalized_population) * 100)

        # Fairness-adjusted score: penalizes areas with high vulnerability
        fairness_adjusted_score = max(0, cell["accessibility_score"] - round(vulnerability_index * 0.15))

        enriched.append({
            **cell,
            "vulnerability_index": vulnerability_index,
            "fairness_adjusted_score": fairness_adjusted_score,
        })
    return enriched


def _enrich_facilities(facilities: list) -> list:
    """Attach contact info to each facility."""
    enriched = []
    for fac in facilities:
        contact = FACILITY_CONTACTS.get(fac["id"], {})
        enriched.append({
            **fac,
            "display_name": contact.get("name", fac["name"]),
            "address": contact.get("address", ""),
            "phone": contact.get("phone", ""),
            "hours": contact.get("hours", ""),
            "emergency": contact.get("emergency", False),
        })
    return enriched


# Precompute enriched data
GRID_CELLS = _enrich_grid_cells(grid_cells_raw)
FACILITIES = _enrich_facilities(facilities_raw)


# ─── Pydantic Models ─────────────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    facility_type: str  # hospital, school, bus_stop, police_station, fire_station
    lat: float
    lng: float


class SimulationResult(BaseModel):
    updated_cells: list
    impact_summary: dict


class ContactEntry(BaseModel):
    id: str
    type: str
    display_name: str
    distance_km: float
    travel_time_min: int
    address: str
    phone: str
    hours: str
    emergency: bool
    lat: float
    lng: float


# ─── Utility Functions ────────────────────────────────────────────────────────

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _compute_accessibility_score(distances: dict, n_nearest_averages: dict = None) -> int:
    """Compute score based on n_nearest_averages matching frontend logic."""
    if not n_nearest_averages:
        # Fallback if old data format
        return 50
    
    avg_hosp = n_nearest_averages.get("hospital_3", 10)
    avg_sch = n_nearest_averages.get("school_3", 10)
    near_emerg = n_nearest_averages.get("emergency_1", 10)
    near_bus = n_nearest_averages.get("transit_1", 10)
    
    score = (
        0.40 * max(0, 100 - (avg_hosp * 10)) +
        0.30 * max(0, 100 - (avg_sch * 15)) +
        0.20 * max(0, 100 - (near_emerg * 10)) +
        0.10 * max(0, 100 - (near_bus * 20))
    )
    return round(score)


def _get_locality_rating(score: int) -> int:
    if score >= 85:
        return 5
    if score >= 70:
        return 4
    if score >= 50:
        return 3
    if score >= 30:
        return 2
    return 1


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/grid")
def get_grid(vulnerability: bool = Query(False, description="Include fairness-adjusted scoring")):
    """
    Returns all grid cells. When `vulnerability=true`, the response includes
    vulnerability_index and fairness_adjusted_score fields for fairness-aware analysis.
    """
    if vulnerability:
        return GRID_CELLS
    # Strip vulnerability fields if not requested (backward compat)
    return [
        {k: v for k, v in cell.items() if k not in ("vulnerability_index", "fairness_adjusted_score")}
        for cell in GRID_CELLS
    ]


@app.get("/api/facilities")
def get_facilities():
    """Returns all facilities with enriched contact information."""
    return FACILITIES


@app.get("/api/recommendations")
def get_recommendations():
    """Returns precomputed infrastructure recommendations."""
    return recommendations_raw


@app.get("/api/ward-history")
def get_ward_history():
    """Returns ward governance trend data."""
    return ward_history_raw


@app.get("/api/contacts/{cell_id}")
def get_contacts(cell_id: str, limit: int = Query(5, ge=1, le=20)):
    """
    Local Services Directory: returns the N nearest facilities of each important
    type (hospital, police_station, fire_station, school, bus_stop) sorted by distance.
    """
    # Find the cell
    cell = next((c for c in GRID_CELLS if c["cell_id"] == cell_id), None)
    if not cell:
        return {"error": "Cell not found", "contacts": []}

    cell_lat, cell_lng = cell["latitude"], cell["longitude"]

    # Compute distance from cell to every facility
    contacts = []
    for fac in FACILITIES:
        dist = _haversine(cell_lat, cell_lng, fac["lat"], fac["lng"])
        travel_time = round(dist * 12)  # ~5 km/h walking = 12 min/km
        contacts.append({
            "id": fac["id"],
            "type": fac["type"],
            "display_name": fac["display_name"],
            "distance_km": round(dist, 2),
            "travel_time_min": travel_time,
            "address": fac["address"],
            "phone": fac["phone"],
            "hours": fac["hours"],
            "emergency": fac["emergency"],
            "lat": fac["lat"],
            "lng": fac["lng"],
        })

    # Group by type and take closest N per type
    from collections import defaultdict
    grouped = defaultdict(list)
    for c in contacts:
        grouped[c["type"]].append(c)

    result = {}
    for fac_type, items in grouped.items():
        items.sort(key=lambda x: x["distance_km"])
        result[fac_type] = items[:limit]

    return {
        "cell_id": cell_id,
        "ward_name": cell["ward_name"],
        "contacts": result,
    }


@app.post("/api/simulate")
def simulate(req: SimulationRequest):
    """
    Server-side simulation engine. Places a hypothetical facility and recalculates
    accessibility scores for all affected grid cells within the impact radius.
    Returns updated cells and an impact summary.
    """
    RADIUS_MAP = {
        "hospital": 5.0,
        "school": 2.0,
        "bus_stop": 1.0,
        "police_station": 3.0,
        "fire_station": 3.0,
    }
    radius_km = RADIUS_MAP.get(req.facility_type, 2.0)

    updated_cells = []
    zones_improved = 0
    pop_affected = 0
    total_score_increase = 0

    for cell in GRID_CELLS:
        dist = _haversine(cell["latitude"], cell["longitude"], req.lat, req.lng)

        if dist > radius_km:
            updated_cells.append(cell)
            continue

        current_dist = cell["service_distances"].get(req.facility_type, 999)

        if dist < current_dist:
            new_distances = {**cell["service_distances"], req.facility_type: round(dist, 4)}
            # Update n_nearest_averages for the simulation appropriately
            new_averages = {**cell.get("n_nearest_averages", {})}
            # If the new distance is smaller than the average distance, we approximate the improvement
            if req.facility_type == 'hospital':
                new_averages['hospital_3'] = min(new_averages.get('hospital_3', 99), (new_averages.get('hospital_3', 5)*2 + dist) / 3)
            elif req.facility_type == 'school':
                new_averages['school_3'] = min(new_averages.get('school_3', 99), (new_averages.get('school_3', 5)*2 + dist) / 3)
            elif req.facility_type in ('police_station', 'fire_station'):
                new_averages['emergency_1'] = min(new_averages.get('emergency_1', 99), dist)
            elif req.facility_type == 'bus_stop':
                new_averages['transit_1'] = min(new_averages.get('transit_1', 99), dist)

            new_score = _compute_accessibility_score(new_distances, new_averages)

            if new_score > cell["accessibility_score"]:
                zones_improved += 1
                pop_affected += cell["population_estimate"]
                total_score_increase += new_score - cell["accessibility_score"]

                # Recompute vulnerability-adjusted score too
                pop_densities = [c.get("population_density", c["population_estimate"] / 0.73) for c in GRID_CELLS]
                min_pop = min(pop_densities) if pop_densities else 0
                max_pop = max(pop_densities) if pop_densities else 1
                if max_pop == min_pop: max_pop = min_pop + 1
                pop_density = cell.get("population_density", cell["population_estimate"] / 0.73)
                normalized_population = (pop_density - min_pop) / (max_pop - min_pop)
                
                service_deficit = 1 - (new_score / 100)
                vulnerability_index = round((0.6 * service_deficit + 0.4 * normalized_population) * 100)
                fairness_adjusted_score = max(0, new_score - round(vulnerability_index * 0.15))

                updated_cells.append({
                    **cell,
                    "service_distances": new_distances,
                    "n_nearest_averages": new_averages,
                    "accessibility_score": new_score,
                    "locality_rating": _get_locality_rating(new_score),
                    "priority_score": round((cell["population_estimate"] / 1000) / max(1, new_score), 2),
                    "vulnerability_index": vulnerability_index,
                    "fairness_adjusted_score": fairness_adjusted_score,
                })
                continue

        updated_cells.append(cell)

    avg_increase = round(total_score_increase / max(1, zones_improved), 1)

    return {
        "updated_cells": updated_cells,
        "impact_summary": {
            "facility_type": req.facility_type,
            "lat": req.lat,
            "lng": req.lng,
            "radius_km": radius_km,
            "zones_improved": zones_improved,
            "population_affected": pop_affected,
            "avg_score_increase": avg_increase,
        },
    }


# ─── Grievance System ─────────────────────────────────────────────────────────

# Load grievance + officer data
grievances_raw = _load_json("grievances.json") if os.path.exists(os.path.join(DATA_DIR, "grievances.json")) else []
officers_raw = _load_json("officers.json") if os.path.exists(os.path.join(DATA_DIR, "officers.json")) else []

# Optional updates store
try:
    with open(os.path.join(DATA_DIR, "updates.json"), "r") as f:
        UPDATES = json.load(f)
except FileNotFoundError:
    UPDATES = []

GRIEVANCES: List[dict] = grievances_raw  # In-memory "DB"
OFFICERS: list = list(officers_raw)

GRIEVANCE_COUNTER = len(GRIEVANCES) + 1

WARD_FOLLOWERS: dict[str, list[str]] = defaultdict(list)

CATEGORY_TO_DEPT = {
    "road_pothole": "BBMP_Engineering",
    "water_supply": "BWSSB",
    "sewage_drainage": "BWSSB",
    "streetlight": "BESCOM",
    "garbage": "SWM",
    "public_toilet": "Health_Dept",
    "encroachment": "Revenue",
    "noise_pollution": "Traffic_Police",
    "tree_hazard": "Horticulture",
    "public_transport": "BMTC",
    "healthcare_access": "Health_Dept",
    "school_infra": "Education_Dept",
    "park_maintenance": "Horticulture",
    "other": "General_BBMP",
}

SLA_DAYS = {
    "low": 30,
    "medium": 30,
    "high": 15,
    "critical": 2,
}


# ─── Grievance Pydantic Models ────────────────────────────────────────────────

class GrievanceCreate(BaseModel):
    category: str
    severity: str = "medium"
    title: str
    description: str
    lat: float
    lng: float
    address_text: Optional[str] = None
    citizen_name: str = "Anonymous"
    citizen_phone: str = ""
    citizen_email: Optional[str] = None
    is_anonymous: bool = False

class GrievanceAcknowledge(BaseModel):
    officer_id: str
    officer_name: str
    officer_designation: str = "Officer"
    notes: Optional[str] = None
    severity_official: Optional[str] = None

class GrievanceStatusUpdate(BaseModel):
    new_status: str
    officer_id: str
    officer_name: str
    notes: str = ""
    reopen: bool = False


class FollowRequest(BaseModel):
    email: str


class UpdateRequest(BaseModel):
    message: str
    officer_name: str
    ward_name: Optional[str] = None

class CitizenVerification(BaseModel):
    satisfaction: int = 3  # 1-5
    feedback: Optional[str] = None
    reopen: bool = False


# ─── Grievance Utility Functions ──────────────────────────────────────────────

def _generate_tracking() -> str:
    chars = string.ascii_uppercase + string.digits
    return "TRK-" + "".join(random.choices(chars, k=8))

def _find_ward(lat: float, lng: float) -> dict:
    """Find best-matching ward/cell for lat,lng from GRID_CELLS."""
    best = None
    best_dist = float("inf")
    for cell in GRID_CELLS:
        d = _haversine(lat, lng, cell["latitude"], cell["longitude"])
        if d < best_dist:
            best_dist = d
            best = cell
    if best:
        return {
            "cell_id": best["cell_id"],
            "ward_id": best["ward_id"],
            "ward_name": best["ward_name"],
            "accessibility_score": best["accessibility_score"],
            "vulnerability_index": best.get("vulnerability_index"),
        }
    return {"cell_id": "", "ward_id": "W1", "ward_name": "Unknown"}

def _check_sla(grievances: list) -> list:
    """Check and auto-escalate SLA breaches."""
    now = datetime.utcnow()
    for g in grievances:
        # Acknowledgement SLA: 3 days
        if g["status"] == "submitted":
            ack_deadline = datetime.fromisoformat(g["sla_ack_deadline"].replace("Z", "+00:00")).replace(tzinfo=None)
            if now > ack_deadline:
                g["status"] = "escalated"
                g["escalation_level"] = max(g.get("escalation_level", 0), 1)
                g["updated_at"] = now.isoformat() + "Z"
                g["timeline"].append({
                    "id": str(uuid.uuid4())[:8],
                    "timestamp": now.isoformat() + "Z",
                    "action": "AUTO-ESCALATED: Unacknowledged past 3-day SLA",
                    "actor_type": "system",
                    "actor_name": "System",
                    "notes": "Escalated to Ward Supervisor per CPGRAMS norms.",
                })
                # Attempt to alert supervisor and officer
                officer_email = g.get("assigned_officer", {}).get("email")
                send_escalation_alert(officer_email, "supervisor@servicemap.in", g)
        # Resolution SLA
        if g["status"] in ("acknowledged", "under_review", "in_progress", "escalated"):
            resolve_deadline = datetime.fromisoformat(g["sla_resolve_deadline"].replace("Z", "+00:00")).replace(tzinfo=None)
            if now > resolve_deadline and g.get("escalation_level", 0) < 2:
                g["escalation_level"] = g.get("escalation_level", 0) + 1
                g["updated_at"] = now.isoformat() + "Z"
                level_name = "Zonal Commissioner" if g["escalation_level"] == 1 else "BBMP Commissioner"
                g["timeline"].append({
                    "id": str(uuid.uuid4())[:8],
                    "timestamp": now.isoformat() + "Z",
                    "action": f"AUTO-ESCALATED: Resolution SLA breached",
                    "actor_type": "system",
                    "actor_name": "System",
                    "notes": f"Escalated to {level_name}. Level {g['escalation_level']}.",
                })
                officer_email = g.get("assigned_officer", {}).get("email")
                send_escalation_alert(officer_email, f"{level_name.lower().replace(' ', '_')}@servicemap.in", g)
    return grievances


# ─── Grievance API Endpoints ──────────────────────────────────────────────────

@app.post("/api/grievances")
def create_grievance(req: GrievanceCreate):
    """Citizen submits a new grievance."""
    global GRIEVANCE_COUNTER
    now = datetime.utcnow()
    
    # Geo-lookup
    ward_info = _find_ward(req.lat, req.lng)
    department = CATEGORY_TO_DEPT.get(req.category, "General_BBMP")
    sla_days = SLA_DAYS.get(req.severity, 30)
    
    gid = f"GRV-BBMP-{now.year}-{GRIEVANCE_COUNTER:05d}"
    tracking = _generate_tracking()
    GRIEVANCE_COUNTER += 1
    
    grievance = {
        "id": gid,
        "tracking_number": tracking,
        "category": req.category,
        "severity": req.severity,
        "title": req.title,
        "description": req.description,
        "status": "submitted",
        "department": department,
        "location": {
            "lat": req.lat,
            "lng": req.lng,
            "address_text": req.address_text or "",
            "cell_id": ward_info.get("cell_id", ""),
            "ward_id": ward_info.get("ward_id", "W1"),
            "ward_name": ward_info.get("ward_name", "Unknown"),
        },
        "photo_urls": [],
        "citizen_name": "Anonymous" if req.is_anonymous else req.citizen_name,
        "citizen_phone": req.citizen_phone,
        "citizen_email": req.citizen_email,
        "is_anonymous": req.is_anonymous,
        "created_at": now.isoformat() + "Z",
        "updated_at": now.isoformat() + "Z",
        "sla_ack_deadline": (now + timedelta(days=3)).isoformat() + "Z",
        "sla_resolve_deadline": (now + timedelta(days=sla_days)).isoformat() + "Z",
        "escalation_level": 0,
        "accessibility_score_at_filing": ward_info.get("accessibility_score"),
        "vulnerability_index_at_filing": ward_info.get("vulnerability_index"),
        "timeline": [{
            "id": str(uuid.uuid4())[:8],
            "timestamp": now.isoformat() + "Z",
            "action": "Grievance Submitted",
            "actor_type": "citizen",
            "actor_name": "Anonymous" if req.is_anonymous else req.citizen_name,
            "notes": "Filed via ServiceMap platform.",
        }],
        "upvotes": 0,
        "followers": [req.citizen_email] if req.citizen_email else [],
    }
    
    GRIEVANCES.append(grievance)
    
    if req.citizen_email:
        send_grievance_submitted(req.citizen_email, grievance)
        
    return {
        "id": gid,
        "tracking_number": tracking,
        "department": department,
        "ward_name": ward_info.get("ward_name"),
        "sla_ack_deadline": grievance["sla_ack_deadline"],
        "sla_resolve_deadline": grievance["sla_resolve_deadline"],
    }


@app.get("/api/grievances")
def list_grievances(
    status: Optional[str] = None,
    ward: Optional[str] = None,
    category: Optional[str] = None,
    department: Optional[str] = None,
):
    """List grievances with optional filters."""
    _check_sla(GRIEVANCES)
    result = GRIEVANCES
    if status:
        result = [g for g in result if g["status"] == status]
    if ward:
        result = [g for g in result if g.get("location", {}).get("ward_name", "").lower() == ward.lower()]
    if category:
        result = [g for g in result if g["category"] == category]
    if department:
        result = [g for g in result if g["department"] == department]
    # Sort by created_at descending
    result = sorted(result, key=lambda x: x.get("created_at", ""), reverse=True)
    return result


@app.get("/api/grievances/stats")
def grievance_stats():
    """Dashboard statistics."""
    _check_sla(GRIEVANCES)
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    total = len(GRIEVANCES)
    pending_ack = sum(1 for g in GRIEVANCES if g["status"] == "submitted")
    in_prog = sum(1 for g in GRIEVANCES if g["status"] in ("acknowledged", "under_review", "in_progress"))
    
    resolved_this_month = sum(
        1 for g in GRIEVANCES
        if g.get("resolved_at") and datetime.fromisoformat(g["resolved_at"].replace("Z", "+00:00")).replace(tzinfo=None) >= month_start
    )
    
    resolved_all = [g for g in GRIEVANCES if g.get("resolved_at") and g.get("created_at")]
    avg_days = 0.0
    if resolved_all:
        total_days = sum(
            (datetime.fromisoformat(g["resolved_at"].replace("Z", "+00:00")).replace(tzinfo=None) -
             datetime.fromisoformat(g["created_at"].replace("Z", "+00:00")).replace(tzinfo=None)).days
            for g in resolved_all
        )
        avg_days = round(total_days / len(resolved_all), 1)
    
    # SLA compliance
    resolvable = [g for g in GRIEVANCES if g["status"] in ("resolved", "citizen_confirmed", "closed")]
    compliant = sum(
        1 for g in resolvable
        if g.get("resolved_at") and g.get("sla_resolve_deadline") and
        datetime.fromisoformat(g["resolved_at"].replace("Z", "+00:00")).replace(tzinfo=None) <=
        datetime.fromisoformat(g["sla_resolve_deadline"].replace("Z", "+00:00")).replace(tzinfo=None)
    )
    sla_rate = round((compliant / max(1, len(resolvable))) * 100)
    
    overdue = sum(
        1 for g in GRIEVANCES
        if g["status"] not in ("resolved", "citizen_confirmed", "closed")
        and g.get("sla_resolve_deadline")
        and now > datetime.fromisoformat(g["sla_resolve_deadline"].replace("Z", "+00:00")).replace(tzinfo=None)
    )
    
    by_cat = defaultdict(int)
    by_ward = defaultdict(int)
    by_status = defaultdict(int)
    by_dept = defaultdict(int)
    for g in GRIEVANCES:
        by_cat[g["category"]] += 1
        by_ward[g.get("location", {}).get("ward_name", "Unknown")] += 1
        by_status[g["status"]] += 1
        by_dept[g["department"]] += 1
    
    return {
        "total": total,
        "pending_ack": pending_ack,
        "in_progress": in_prog,
        "resolved_this_month": resolved_this_month,
        "avg_resolution_days": avg_days,
        "sla_compliance_rate": sla_rate,
        "overdue": overdue,
        "by_category": dict(by_cat),
        "by_ward": dict(by_ward),
        "by_status": dict(by_status),
        "by_department": dict(by_dept),
    }


@app.get("/api/grievances/track/{tracking_number}")
def track_grievance(tracking_number: str):
    """Public tracking by reference number."""
    g = next((g for g in GRIEVANCES if g["tracking_number"] == tracking_number), None)
    if not g:
        raise HTTPException(404, "Tracking number not found.")
    # Return safe view (hide citizen phone if anonymous)
    result = dict(g)
    if result.get("is_anonymous"):
        result["citizen_phone"] = "***"
        result["citizen_email"] = None
    return result


@app.get("/api/grievances/ward/{ward_name}")
def grievances_by_ward(ward_name: str):
    """All grievances in a ward."""
    return [g for g in GRIEVANCES if g.get("location", {}).get("ward_name", "").lower() == ward_name.lower()]


@app.get("/api/grievances/{gid}")
def get_grievance(gid: str):
    """Single grievance with full timeline."""
    g = next((g for g in GRIEVANCES if g["id"] == gid), None)
    if not g:
        raise HTTPException(404, "Grievance not found.")
    return g


@app.put("/api/grievances/{gid}/acknowledge")
def acknowledge_grievance(gid: str, req: GrievanceAcknowledge):
    """Officer acknowledges a grievance per CPGRAMS 3-day norm."""
    g = next((g for g in GRIEVANCES if g["id"] == gid), None)
    if not g:
        raise HTTPException(404, "Grievance not found.")
    if g["status"] not in ("submitted", "escalated"):
        raise HTTPException(400, f"Cannot acknowledge grievance in '{g['status']}' status.")
    
    now = datetime.utcnow()
    g["status"] = "acknowledged"
    g["acknowledged_at"] = now.isoformat() + "Z"
    g["updated_at"] = now.isoformat() + "Z"
    if req.severity_official:
        g["severity_official"] = req.severity_official
    
    # Assign officer
    officer = next((o for o in OFFICERS if o["id"] == req.officer_id), None)
    if officer:
        g["assigned_officer"] = officer
    
    g["timeline"].append({
        "id": str(uuid.uuid4())[:8],
        "timestamp": now.isoformat() + "Z",
        "action": "Acknowledged",
        "actor_type": "officer",
        "actor_name": req.officer_name,
        "notes": req.notes or f"Acknowledged by {req.officer_name}, {req.officer_designation}.",
    })
    
    citizen_email = g.get("citizen_email")
    officer_email = officer.get("email") if officer else None
    if citizen_email or officer_email:
        send_grievance_acknowledged(citizen_email, officer_email, g)
    
    return {"status": "acknowledged", "acknowledged_at": g["acknowledged_at"]}


@app.put("/api/grievances/{gid}/status")
def update_grievance_status(gid: str, req: GrievanceStatusUpdate):
    """Update grievance status (under_review, in_progress, resolved)."""
    g = next((g for g in GRIEVANCES if g["id"] == gid), None)
    if not g:
        raise HTTPException(404, "Grievance not found.")
    
    valid_transitions = {
        "acknowledged": ["under_review"],
        "under_review": ["in_progress"],
        "in_progress": ["resolved"],
        "escalated": ["acknowledged", "under_review", "in_progress"],
        "reopened": ["under_review"],
    }
    allowed = valid_transitions.get(g["status"], [])
    if req.new_status not in allowed:
        raise HTTPException(400, f"Cannot transition from '{g['status']}' to '{req.new_status}'. Allowed: {allowed}")
    
    now = datetime.utcnow()
    g["status"] = req.new_status
    g["updated_at"] = now.isoformat() + "Z"
    if req.new_status == "resolved":
        g["resolved_at"] = now.isoformat() + "Z"
        g["resolution_notes"] = req.notes
    
    g["timeline"].append({
        "id": str(uuid.uuid4())[:8],
        "timestamp": now.isoformat() + "Z",
        "action": req.new_status.replace("_", " ").title(),
        "actor_type": "officer",
        "actor_name": req.officer_name,
        "notes": req.notes,
    })
    
    citizen_email = g.get("citizen_email")
    followers = g.get("followers", [])
    if citizen_email or followers:
        send_status_update(citizen_email, followers, g, req.new_status, req.notes)
    
    return {"status": g["status"], "updated_at": g["updated_at"]}


@app.put("/api/grievances/{gid}/verify")
def verify_grievance(gid: str, req: CitizenVerification):
    """Citizen verifies or rejects resolution."""
    g = next((g for g in GRIEVANCES if g["id"] == gid), None)
    if not g:
        raise HTTPException(404, "Grievance not found.")
    if g["status"] != "resolved":
        raise HTTPException(400, "Grievance must be in 'resolved' status to verify.")
    
    now = datetime.utcnow()
    g["citizen_satisfaction"] = req.satisfaction
    g["citizen_feedback"] = req.feedback
    g["updated_at"] = now.isoformat() + "Z"
    
    if req.reopen:
        g["status"] = "reopened"
        g["timeline"].append({
            "id": str(uuid.uuid4())[:8],
            "timestamp": now.isoformat() + "Z",
            "action": "Reopened by Citizen",
            "actor_type": "citizen",
            "actor_name": g.get("citizen_name", "Citizen"),
            "notes": req.feedback or "Resolution not satisfactory.",
        })
    else:
        g["status"] = "citizen_confirmed"
        g["closed_at"] = now.isoformat() + "Z"
        g["timeline"].append({
            "id": str(uuid.uuid4())[:8],
            "timestamp": now.isoformat() + "Z",
            "action": "Citizen Verified",
            "actor_type": "citizen",
            "actor_name": g.get("citizen_name", "Citizen"),
            "notes": req.feedback or f"Rated {req.satisfaction}/5.",
        })
        citizen_email = g.get("citizen_email")
        followers = g.get("followers", [])
        if citizen_email or followers:
            send_resolution_notification(citizen_email, followers, g)
    
    return {"status": g["status"]}


@app.get("/api/officers")
def list_officers():
    """List all officers."""
    return OFFICERS


@app.put("/api/grievances/{gid}/upvote")
def upvote_grievance(gid: str):
    """Increment upvote count."""
    g = next((g for g in GRIEVANCES if g["id"] == gid), None)
    if not g:
        raise HTTPException(404, "Grievance not found.")
    g["upvotes"] = g.get("upvotes", 0) + 1
    return {"upvotes": g["upvotes"]}


@app.put("/api/grievances/{gid}/follow")
def follow_grievance(gid: str, req: FollowRequest):
    """Add follower to grievance."""
    g = next((g for g in GRIEVANCES if g["id"] == gid), None)
    if not g:
        raise HTTPException(404, "Grievance not found.")
    
    if "followers" not in g:
        g["followers"] = []
    
    if req.email not in g["followers"]:
        g["followers"].append(req.email)
        send_follow_confirmation(req.email, "grievance", g["tracking_number"])
        
    return {"followers": len(g["followers"])}


@app.put("/api/wards/{ward_name}/follow")
def follow_ward(ward_name: str, req: FollowRequest):
    """Add follower to a ward."""
    normalized_ward = ward_name.lower()
    if req.email not in WARD_FOLLOWERS[normalized_ward]:
        WARD_FOLLOWERS[normalized_ward].append(req.email)
        send_follow_confirmation(req.email, "ward", ward_name.title())
        
    return {"followers": len(WARD_FOLLOWERS[normalized_ward])}


@app.get("/api/wards/{ward_name}/followers")
def get_ward_followers(ward_name: str):
    """Get follower count for a ward."""
    return {"followers": len(WARD_FOLLOWERS[ward_name.lower()])}


@app.get("/api/updates")
def list_updates(ward_name: Optional[str] = None):
    """List broadcast updates."""
    if ward_name:
        return [u for u in UPDATES if u.get("ward_name", "").lower() == ward_name.lower()]
    return UPDATES


@app.post("/api/updates")
def create_update(req: UpdateRequest):
    """Broadcast an update to followers."""
    target_emails = []
    if req.ward_name:
        target_emails = WARD_FOLLOWERS[req.ward_name.lower()]
    else:
        # If city-wide, could collect all followers (omitted for brevity)
        pass
        
    emails_sent = 0
    if target_emails:
        send_government_update(target_emails, req.message, req.officer_name, req.ward_name)
        emails_sent = len(target_emails)
        
    update_doc = {
        "id": str(uuid.uuid4())[:8],
        "message": req.message,
        "officer_name": req.officer_name,
        "ward_name": req.ward_name,
        "emails_sent": emails_sent,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    UPDATES.insert(0, update_doc)
    return update_doc


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "ServiceMap API",
        "version": "4.0.0",
        "status": "operational",
        "endpoints": [
            "/api/grid",
            "/api/facilities",
            "/api/recommendations",
            "/api/ward-history",
            "/api/contacts/{cell_id}",
            "/api/simulate",
            "/api/grievances",
            "/api/grievances/stats",
            "/api/grievances/{id}",
            "/api/grievances/track/{tracking_number}",
            "/api/grievances/{id}/acknowledge",
            "/api/grievances/{id}/status",
            "/api/grievances/{id}/verify",
            "/api/grievances/{id}/follow",
            "/api/grievances/{id}/upvote",
            "/api/wards/{ward_name}/follow",
            "/api/wards/{ward_name}/followers",
            "/api/updates",
            "/api/officers",
        ],
    }
