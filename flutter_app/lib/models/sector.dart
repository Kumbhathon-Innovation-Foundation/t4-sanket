import 'package:latlong2/latlong.dart';

/// Represents a physical zone/sector in the Nashik Kumbh Mela area.
class Sector {
  final String id;
  final String name;
  final String shortName;
  final LatLng center;
  final List<LatLng> boundary; // polygon vertices
  final String description;

  const Sector({
    required this.id,
    required this.name,
    required this.shortName,
    required this.center,
    this.boundary = const [],
    this.description = '',
  });

  factory Sector.fromJson(Map<String, dynamic> json) {
    return Sector(
      id: json['id'] as String,
      name: json['name'] as String,
      shortName: json['short_name'] as String? ?? json['name'] as String,
      center: LatLng(
        (json['center_lat'] as num).toDouble(),
        (json['center_lng'] as num).toDouble(),
      ),
      boundary: (json['boundary'] as List<dynamic>?)
              ?.map((p) => LatLng(
                    (p['lat'] as num).toDouble(),
                    (p['lng'] as num).toDouble(),
                  ))
              .toList() ??
          [],
      description: json['description'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'short_name': shortName,
        'center_lat': center.latitude,
        'center_lng': center.longitude,
        'description': description,
      };
}
