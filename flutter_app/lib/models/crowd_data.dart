/// Crowd density level for a zone.
enum CrowdLevel { low, moderate, high }

/// Live crowd telemetry for a specific zone.
class CrowdData {
  final String zoneId;
  final String zoneName;
  final int count;
  final CrowdLevel level;
  final double changePercent; // positive = increasing, negative = decreasing
  final DateTime timestamp;
  final bool isCached;

  const CrowdData({
    required this.zoneId,
    required this.zoneName,
    required this.count,
    required this.level,
    this.changePercent = 0.0,
    required this.timestamp,
    this.isCached = false,
  });

  factory CrowdData.fromJson(Map<String, dynamic> json) {
    return CrowdData(
      zoneId: json['zone_id'] as String,
      zoneName: json['zone_name'] as String,
      count: json['count'] as int,
      level: CrowdLevel.values.firstWhere(
        (e) => e.name == (json['level'] as String).toLowerCase(),
        orElse: () => CrowdLevel.low,
      ),
      changePercent: (json['change_percent'] as num?)?.toDouble() ?? 0.0,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'zone_id': zoneId,
        'zone_name': zoneName,
        'count': count,
        'level': level.name,
        'change_percent': changePercent,
        'timestamp': timestamp.toIso8601String(),
      };

  CrowdData copyWith({bool? isCached}) {
    return CrowdData(
      zoneId: zoneId,
      zoneName: zoneName,
      count: count,
      level: level,
      changePercent: changePercent,
      timestamp: timestamp,
      isCached: isCached ?? this.isCached,
    );
  }
}

/// Aggregate crowd summary for the entire Kumbh Mela site.
class CrowdSummary {
  final int totalCount;
  final double changePercent;
  final DateTime lastUpdated;
  final List<CrowdData> zones;
  final bool isCached;

  const CrowdSummary({
    required this.totalCount,
    required this.changePercent,
    required this.lastUpdated,
    required this.zones,
    this.isCached = false,
  });

  factory CrowdSummary.fromZones(List<CrowdData> zones, {bool isCached = false}) {
    final total = zones.fold<int>(0, (sum, z) => sum + z.count);
    final avgChange = zones.isEmpty
        ? 0.0
        : zones.fold<double>(0, (sum, z) => sum + z.changePercent) / zones.length;
    return CrowdSummary(
      totalCount: total,
      changePercent: avgChange,
      lastUpdated: DateTime.now(),
      zones: zones,
      isCached: isCached,
    );
  }
}
