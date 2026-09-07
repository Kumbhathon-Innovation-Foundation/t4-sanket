// ANUBHAV Itinerary & Patch Data Models

class PoiAlongRoute {
  final String poiId;
  final String name;
  final String side;
  final int triggerDistanceM;
  final String shortDescription;
  final bool detailAvailable;
  final String crowdColor; // 'green', 'yellow', 'red'

  PoiAlongRoute({
    required this.poiId,
    required this.name,
    this.side = 'left',
    this.triggerDistanceM = 50,
    this.shortDescription = '',
    this.detailAvailable = true,
    this.crowdColor = 'green',
  });

  factory PoiAlongRoute.fromJson(Map<String, dynamic> json) {
    return PoiAlongRoute(
      poiId: json['poi_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Point of Interest',
      side: json['side']?.toString() ?? 'left',
      triggerDistanceM: (json['trigger_distance_m'] as num?)?.toInt() ?? 50,
      shortDescription: json['short_description']?.toString() ?? '',
      detailAvailable: json['detail_available'] == true,
      crowdColor: json['crowd_color']?.toString() ?? 'green',
    );
  }
}

class ItineraryStop {
  final int order;
  final String type; // 'parking', 'walk_segment', 'drive_segment', 'visit', 'transit_segment'
  final String? name;
  final String? poiId;
  final String? fromLoc;
  final String? toLoc;
  final String? eta;
  final int? durationMin;
  final int? suggestedDurationMin;
  final num? fareEstimate;
  final String? capacityStatus;
  final String? vehicleType;
  final String? zoneType;
  final bool? transitRequired;
  final String? note;
  final String? crowdColor; // 'green', 'yellow', 'red' (Stage 10)
  final List<List<double>> polyline;
  final List<PoiAlongRoute> poisAlongRoute;

  ItineraryStop({
    required this.order,
    required this.type,
    this.name,
    this.poiId,
    this.fromLoc,
    this.toLoc,
    this.eta,
    this.durationMin,
    this.suggestedDurationMin,
    this.fareEstimate,
    this.capacityStatus,
    this.vehicleType,
    this.zoneType,
    this.transitRequired,
    this.note,
    this.crowdColor,
    this.polyline = const [],
    this.poisAlongRoute = const [],
  });

  factory ItineraryStop.fromJson(Map<String, dynamic> json) {
    var rawPoly = json['polyline'];
    List<List<double>> parsedPoly = [];
    if (rawPoly is List) {
      for (var pt in rawPoly) {
        if (pt is List && pt.length >= 2) {
          parsedPoly.add([
            (pt[0] as num).toDouble(),
            (pt[1] as num).toDouble(),
          ]);
        }
      }
    }

    var rawPois = json['pois_along_route'];
    List<PoiAlongRoute> parsedPois = [];
    if (rawPois is List) {
      parsedPois = rawPois
          .map((p) => PoiAlongRoute.fromJson(Map<String, dynamic>.from(p)))
          .toList();
    }

    return ItineraryStop(
      order: (json['order'] as num?)?.toInt() ?? 1,
      type: json['type']?.toString() ?? 'visit',
      name: json['name']?.toString(),
      poiId: json['poi_id']?.toString(),
      fromLoc: json['from']?.toString(),
      toLoc: json['to']?.toString(),
      eta: json['eta']?.toString(),
      durationMin: (json['duration_min'] as num?)?.toInt(),
      suggestedDurationMin: (json['suggested_duration_min'] as num?)?.toInt(),
      fareEstimate: json['fare_estimate'] as num?,
      capacityStatus: json['capacity_status']?.toString(),
      vehicleType: json['vehicle_type']?.toString(),
      zoneType: json['zone_type']?.toString(),
      transitRequired: json['transit_required'] == true,
      note: json['note']?.toString(),
      crowdColor: json['crowd_color']?.toString(),
      polyline: parsedPoly,
      poisAlongRoute: parsedPois,
    );
  }
}

class Itinerary {
  final String tripId;
  final String status;
  final String summaryText;
  final String languageCode;
  final String detectedLanguage;
  final GroupPlanning? groupPlanning; // Stage 12 group-aware planning metadata
  final List<ItineraryStop> stops;
  final List<Map<String, dynamic>> activeAdvisories;
  final String lastUpdated;

  Itinerary({
    required this.tripId,
    required this.status,
    required this.summaryText,
    this.languageCode = 'en-IN',
    this.detectedLanguage = 'en',
    this.groupPlanning,
    required this.stops,
    this.activeAdvisories = const [],
    required this.lastUpdated,
  });

  factory Itinerary.fromJson(Map<String, dynamic> json) {
    var rawStops = json['stops'];
    List<ItineraryStop> parsedStops = [];
    if (rawStops is List) {
      parsedStops = rawStops
          .map((s) => ItineraryStop.fromJson(Map<String, dynamic>.from(s)))
          .toList();
    }

    var rawAdv = json['active_advisories'];
    List<Map<String, dynamic>> parsedAdv = [];
    if (rawAdv is List) {
      parsedAdv = rawAdv.map((a) => Map<String, dynamic>.from(a)).toList();
    }

    return Itinerary(
      tripId: json['trip_id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'active',
      summaryText: json['summary_text']?.toString() ?? '',
      languageCode: json['language_code']?.toString() ?? 'en-IN',
      detectedLanguage: json['detected_language']?.toString() ?? 'en',
      groupPlanning: json['group_planning'] != null
          ? GroupPlanning.fromJson(Map<String, dynamic>.from(json['group_planning']))
          : null,
      stops: parsedStops,
      activeAdvisories: parsedAdv,
      lastUpdated: json['last_updated']?.toString() ?? '',
    );
  }
}

class GroupPlanning {
  final bool hasVulnerableMembers;
  final String suggestedGhat;
  final bool isOverride;
  final String reasoning;
  final String safetyNote;

  GroupPlanning({
    required this.hasVulnerableMembers,
    required this.suggestedGhat,
    required this.isOverride,
    required this.reasoning,
    required this.safetyNote,
  });

  factory GroupPlanning.fromJson(Map<String, dynamic> json) {
    return GroupPlanning(
      hasVulnerableMembers: json['has_vulnerable_members'] == true,
      suggestedGhat: json['suggested_ghat']?.toString() ?? 'Ramkund',
      isOverride: json['is_override'] == true,
      reasoning: json['reasoning']?.toString() ?? '',
      safetyNote: json['safety_note']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'has_vulnerable_members': hasVulnerableMembers,
        'suggested_ghat': suggestedGhat,
        'is_override': isOverride,
        'reasoning': reasoning,
        'safety_note': safetyNote,
      };
}

class NearbyItem {
  final String id;
  final String name;
  final String category;
  final double lat;
  final double lng;
  final int distanceM;
  final String currentCrowdLevel;
  final String crowdColor;
  final int queueWaitMinutes;
  final String reason;

  NearbyItem({
    required this.id,
    required this.name,
    required this.category,
    required this.lat,
    required this.lng,
    required this.distanceM,
    required this.currentCrowdLevel,
    this.crowdColor = 'green',
    required this.queueWaitMinutes,
    required this.reason,
  });

  // Getters for Stage 8 / 11 compatibility
  double? get distanceMeters => distanceM.toDouble();
  String? get distanceText => distanceM >= 1000
      ? '${(distanceM / 1000).toStringAsFixed(1)} km'
      : '$distanceM m';
  String? get crowdLevel => currentCrowdLevel;
  int? get waitTimeMinutes => queueWaitMinutes;
  String? get recommendationReason => reason;
  Map<String, dynamic> get raw => {
        'id': id,
        'name': name,
        'category': category,
        'lat': lat,
        'lng': lng,
        'distance_m': distanceM,
        'current_crowd_level': currentCrowdLevel,
        'crowd_color': crowdColor,
        'queue_wait_minutes': queueWaitMinutes,
        'reason': reason,
      };

  factory NearbyItem.fromJson(Map<String, dynamic> json) {
    return NearbyItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Facility',
      category: json['category']?.toString() ?? 'food',
      lat: (json['lat'] as num?)?.toDouble() ?? 20.007,
      lng: (json['lng'] as num?)?.toDouble() ?? 73.792,
      distanceM: (json['distance_m'] as num?)?.toInt() ?? 0,
      currentCrowdLevel: json['current_crowd_level']?.toString() ?? 'low',
      crowdColor: json['crowd_color']?.toString() ?? 'green',
      queueWaitMinutes: (json['queue_wait_minutes'] as num?)?.toInt() ?? 5,
      reason: json['reason']?.toString() ?? '',
    );
  }
}
