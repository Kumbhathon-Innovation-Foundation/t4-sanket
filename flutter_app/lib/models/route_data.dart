import 'package:latlong2/latlong.dart';
import 'crowd_data.dart';

/// Travel mode options.
enum TravelMode { walk, shuttle, rickshaw }

/// A single route option with crowd awareness.
class RouteData {
  final String id;
  final String name;
  final String origin;
  final String destination;
  final double distanceKm;
  final int durationMinutes;
  final CrowdLevel crowdLevel;
  final bool isRecommended;
  final String via; // e.g. "Via Kali Ghat"
  final List<LatLng> polylinePoints;

  const RouteData({
    required this.id,
    required this.name,
    required this.origin,
    required this.destination,
    required this.distanceKm,
    required this.durationMinutes,
    required this.crowdLevel,
    this.isRecommended = false,
    this.via = '',
    this.polylinePoints = const [],
  });

  factory RouteData.fromJson(Map<String, dynamic> json) {
    return RouteData(
      id: json['id'] as String,
      name: json['name'] as String,
      origin: json['origin'] as String,
      destination: json['destination'] as String,
      distanceKm: (json['distance_km'] as num).toDouble(),
      durationMinutes: json['duration_minutes'] as int,
      crowdLevel: CrowdLevel.values.firstWhere(
        (e) => e.name == (json['crowd_level'] as String).toLowerCase(),
        orElse: () => CrowdLevel.low,
      ),
      isRecommended: json['is_recommended'] as bool? ?? false,
      via: json['via'] as String? ?? '',
      polylinePoints: (json['polyline'] as List<dynamic>?)
              ?.map((p) => LatLng(
                    (p['lat'] as num).toDouble(),
                    (p['lng'] as num).toDouble(),
                  ))
              .toList() ??
          [],
    );
  }
}
