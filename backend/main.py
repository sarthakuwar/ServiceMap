"""
ServiceMap — FastAPI Backend
Government-Grade Urban Infrastructure Planning API

Endpoints:
  GET  /api/grid                  → Grid cells with vulnerability index
  GET  /api/facilities            → Facilities with contact info
  GET  /api/recommendations       → Precomputed infrastructure recommendations
  GET  /api/ward-history          → Ward governance trend data
  GET  /api/contacts/{cell_id}    → Nearest services directory for a cell
  POST /api/simulate              → Server-side what-if simulation engine
"""

import json
import math
import os
import random
from typing import List, Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

# Assign synthetic vulnerability multipliers per ward (simulating income/demographic data)
WARD_VULNERABILITY = {
    "Jayanagar": 0.72,
    "Malleshwaram": 0.55,
    "Koramangala": 0.45,
    "Indiranagar": 0.38,
    "Whitefield": 0.65,
    "BTM Layout": 0.78,
}

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
    fac_type = fac["type"]
    idx = int(fac_id.split("_")[1])

    if fac_type == "hospital":
        real_name = HOSPITAL_NAMES[idx % len(HOSPITAL_NAMES)]
    elif fac_type == "school":
        real_name = SCHOOL_NAMES[idx % len(SCHOOL_NAMES)]
    else:
        real_name = fac["name"]

    street = STREET_NAMES[idx % len(STREET_NAMES)]
    phone = f"+91-80-{random.randint(2000, 9999)}-{random.randint(1000, 9999)}"
    hours = "24/7" if fac_type in ("hospital", "police_station", "fire_station") else "8:00 AM – 6:00 PM"

    FACILITY_CONTACTS[fac_id] = {
        "name": real_name,
        "address": f"No. {random.randint(1, 250)}, {street}, Bengaluru - {random.choice([560001, 560004, 560008, 560011, 560025, 560030, 560034, 560038, 560041, 560047])}",
        "phone": phone,
        "hours": hours,
        "emergency": fac_type in ("hospital", "police_station", "fire_station"),
    }


def _enrich_grid_cells(cells: list) -> list:
    """Add vulnerability_index and fairness_adjusted_score to each cell."""
    enriched = []
    for cell in cells:
        ward = cell.get("ward_name", "")
        vuln_multiplier = WARD_VULNERABILITY.get(ward, 0.5)

        # Population density factor (higher pop in underserved = more vulnerable)
        pop_factor = min(1.0, cell["population_estimate"] / 60000)

        # Vulnerability Index: 0-100, higher = more vulnerable
        raw_vuln = (1 - cell["accessibility_score"] / 100) * 0.5 + vuln_multiplier * 0.3 + pop_factor * 0.2
        vulnerability_index = round(raw_vuln * 100)

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


def _compute_accessibility_score(distances: dict) -> int:
    """Mirror the frontend scoring model exactly."""
    svc = lambda d: 1.0 / (1.0 + d)
    score = (
        0.35 * svc(distances.get("hospital", 10))
        + 0.25 * svc(distances.get("bus_stop", 10))
        + 0.20 * svc(distances.get("school", 10))
        + 0.20 * svc(min(distances.get("police_station", 10), distances.get("fire_station", 10)))
    )
    return round(score * 100)


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
            new_score = _compute_accessibility_score(new_distances)

            if new_score > cell["accessibility_score"]:
                zones_improved += 1
                pop_affected += cell["population_estimate"]
                total_score_increase += new_score - cell["accessibility_score"]

                # Recompute vulnerability-adjusted score too
                ward = cell.get("ward_name", "")
                vuln_multiplier = WARD_VULNERABILITY.get(ward, 0.5)
                pop_factor = min(1.0, cell["population_estimate"] / 60000)
                raw_vuln = (1 - new_score / 100) * 0.5 + vuln_multiplier * 0.3 + pop_factor * 0.2
                vulnerability_index = round(raw_vuln * 100)
                fairness_adjusted_score = max(0, new_score - round(vulnerability_index * 0.15))

                updated_cells.append({
                    **cell,
                    "service_distances": new_distances,
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


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "ServiceMap API",
        "version": "3.0.0",
        "status": "operational",
        "endpoints": [
            "/api/grid",
            "/api/facilities",
            "/api/recommendations",
            "/api/ward-history",
            "/api/contacts/{cell_id}",
            "/api/simulate",
        ],
    }
