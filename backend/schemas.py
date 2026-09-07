"""
ANUBHAV Pydantic Schemas
Defines request payloads, ITINERARY_SCHEMA, and ITINERARY_PATCH models.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class PlanRequest(BaseModel):
    user_id: str = Field(..., description="Unique identifier for the user/pilgrim")
    message: str = Field(..., description="Natural language request or prompt from user")
    mode: str = Field("nl", description="'nl' (natural language) or 'structured'")
    form_data: Optional[Dict[str, Any]] = Field(None, description="Structured form data if mode='structured'")

class PatchRequest(BaseModel):
    trip_id: str = Field(..., description="Active trip identifier to patch")
    message: str = Field(..., description="User edit request (e.g. 'remove Kalaram', 'find food')")
    intent: Optional[str] = Field(None, description="Optional explicit intent like 'find_nearby' or 'visit'")
    category: Optional[str] = Field(None, description="Optional category for nearby search e.g. 'food', 'toilet'")
    location: Optional[Dict[str, float]] = Field(None, description="Current user lat/lng e.g. {'lat': 20.0, 'lng': 73.7}")
    poi_data: Optional[Dict[str, Any]] = Field(None, description="Optional POI metadata: {'id': ..., 'name': ..., 'lat': ..., 'lng': ...}")

class PublishAdvisoryRequest(BaseModel):
    advisory_id: str = Field(..., description="Advisory or corridor ID from advisory_corridors")
    severity: str = Field("critical", description="Severity level: 'critical', 'warning', 'info'")
    active: bool = Field(True, description="Whether to activate (True) or deactivate (False)")

class NearbySearchRequest(BaseModel):
    category: str = Field(..., description="Category: 'toilet', 'medical', 'food', 'water'")
    lat: Optional[float] = Field(20.0077, description="Current user latitude")
    lng: Optional[float] = Field(73.7926, description="Current user longitude")
    radius_m: Optional[int] = Field(1500, description="Search radius in meters")

class PoiAlongRoute(BaseModel):
    poi_id: str
    name: str
    side: Optional[str] = "left"
    trigger_distance_m: Optional[int] = 50
    short_description: Optional[str] = ""
    detail_available: Optional[bool] = True
    crowd_color: Optional[str] = Field("green", description="'green', 'yellow', or 'red'")

class Stop(BaseModel):
    order: int
    type: str  # 'parking', 'walk_segment', 'transit_segment', 'visit', 'facility'
    name: Optional[str] = None
    poi_id: Optional[str] = None
    from_loc: Optional[str] = Field(None, alias="from")
    to_loc: Optional[str] = Field(None, alias="to")
    eta: Optional[str] = None
    duration_min: Optional[int] = None
    suggested_duration_min: Optional[int] = None
    fare_estimate: Optional[Union[int, float]] = None
    capacity_status: Optional[str] = None
    zone_type: Optional[str] = None
    transit_required: Optional[bool] = None
    vehicle_type: Optional[str] = None
    note: Optional[str] = None
    polyline: Optional[List[List[float]]] = None
    crowd_color: Optional[str] = Field(None, description="'green', 'yellow', or 'red' computed from get_crowd_levels")
    pois_along_route: Optional[List[Dict[str, Any]]] = None

    class Config:
        populate_by_name = True

class AdvisoryItem(BaseModel):
    id: str
    type: str
    affected_segment: Optional[str] = None
    severity: str

class ItinerarySchema(BaseModel):
    trip_id: str
    status: str = "active"
    summary_text: str
    language_code: Optional[str] = "en-IN"
    detected_language: Optional[str] = "en"
    group_planning: Optional[Dict[str, Any]] = None
    stops: List[Dict[str, Any]]
    active_advisories: List[Dict[str, Any]] = []
    last_updated: str

class ItineraryPatch(BaseModel):
    trip_id: str
    patch_reason: str
    stops: List[Dict[str, Any]]
    group_planning: Optional[Dict[str, Any]] = None
    active_advisories: Optional[List[Dict[str, Any]]] = None
    last_updated: str
