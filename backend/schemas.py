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

class PoiAlongRoute(BaseModel):
    poi_id: str
    name: str
    side: Optional[str] = "left"
    trigger_distance_m: Optional[int] = 50
    short_description: Optional[str] = ""
    detail_available: Optional[bool] = True

class Stop(BaseModel):
    order: int
    type: str  # 'parking', 'walk_segment', 'drive_segment', 'visit', 'facility'
    name: Optional[str] = None
    poi_id: Optional[str] = None
    from_loc: Optional[str] = Field(None, alias="from")
    to_loc: Optional[str] = Field(None, alias="to")
    eta: Optional[str] = None
    duration_min: Optional[int] = None
    suggested_duration_min: Optional[int] = None
    fare_estimate: Optional[Union[int, float]] = None
    capacity_status: Optional[str] = None
    polyline: Optional[List[List[float]]] = None
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
    stops: List[Dict[str, Any]]
    active_advisories: List[Dict[str, Any]] = []
    last_updated: str

class ItineraryPatch(BaseModel):
    trip_id: str
    patch_reason: str
    stops: List[Dict[str, Any]]
    active_advisories: Optional[List[Dict[str, Any]]] = None
    last_updated: str
