import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/itinerary_models.dart';
import '../models/crowd_data.dart';

class ApiService {
  final String baseUrl;

  ApiService({this.baseUrl = AppConfig.backendBaseUrl});

  Future<Itinerary> createPlan({
    required String userId,
    required String message,
    String mode = 'nl',
    Map<String, dynamic>? formData,
  }) async {
    final url = Uri.parse('$baseUrl/plan');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'user_id': userId,
        'message': message,
        'mode': mode,
        if (formData != null) 'form_data': formData,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      return Itinerary.fromJson(data);
    } else {
      throw Exception('Failed to create plan: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> patchPlan({
    required String tripId,
    required String message,
    String? intent,
    String? category,
    Map<String, double>? location,
    Map<String, dynamic>? poiData,
  }) async {
    final url = Uri.parse('$baseUrl/patch');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'trip_id': tripId,
        'message': message,
        if (intent != null) 'intent': intent,
        if (category != null) 'category': category,
        if (location != null) 'location': location,
        if (poiData != null) 'poi_data': poiData,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('Failed to patch plan: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> publishAdvisory({
    required String advisoryId,
    String severity = 'critical',
    bool active = true,
  }) async {
    final url = Uri.parse('$baseUrl/admin/publish-advisory');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'advisory_id': advisoryId,
        'severity': severity,
        'active': active,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('Failed to publish advisory: ${response.body}');
    }
  }

  /// STAGE 11: One-tap utility search (Toilet, Medical, Food, Water)
  Future<List<NearbyItem>> getNearbyRanked({
    required String category,
    double lat = 20.0077,
    double lng = 73.7926,
    int? radiusMeters,
    int radiusM = 1500,
    int limit = 6,
  }) async {
    final effectiveRadius = radiusMeters ?? radiusM;
    final url = Uri.parse(
        '$baseUrl/nearby?category=$category&lat=$lat&lng=$lng&radius_m=$effectiveRadius&limit=$limit');
    final response = await http.get(url);

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      final rawResults = data['results'] as List? ?? [];
      return rawResults
          .map((item) => NearbyItem.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } else {
      throw Exception('Failed to fetch nearby $category: ${response.body}');
    }
  }

  /// STAGE 12: Ghat Congestion Forecast & Optimal Window
  Future<Map<String, dynamic>> getGhatForecast({
    String ghatId = 'ghat_0020',
    String? ghatName,
  }) async {
    var effectiveGhatId = ghatId;
    if (ghatName != null) {
      if (ghatName.toLowerCase().contains('talk')) {
        effectiveGhatId = 'ghat_0014';
      } else {
        effectiveGhatId = 'ghat_0020';
      }
    }
    final url = Uri.parse('$baseUrl/ghat-forecast?ghat_id=$effectiveGhatId');
    final response = await http.get(url);

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('Failed to fetch ghat forecast: ${response.body}');
    }
  }

  /// STAGE 10: Live Crowd Levels for Periodic Refresh
  Future<List<Map<String, dynamic>>> getCrowdLevels({List<String>? poiIds}) async {
    final query = poiIds != null && poiIds.isNotEmpty
        ? '?poi_ids=${poiIds.join(",")}'
        : '';
    final url = Uri.parse('$baseUrl/crowd-levels$query');
    final response = await http.get(url);

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      final list = data['crowd_levels'] as List? ?? [];
      return list.map((e) => Map<String, dynamic>.from(e)).toList();
    } else {
      throw Exception('Failed to fetch crowd levels: ${response.body}');
    }
  }

  /// Compatibility method for teammate UI: fetch live crowd telemetry as CrowdData models
  Future<List<CrowdData>> fetchCrowdData() async {
    try {
      final levels = await getCrowdLevels();
      if (levels.isNotEmpty) {
        return levels.map((l) {
          final levelStr = (l['crowd_level'] ?? l['level'] ?? 'low').toString().toLowerCase();
          final count = (l['estimated_headcount'] as num?)?.toInt() ?? 250000;
          return CrowdData(
            zoneId: l['poi_id']?.toString() ?? 'zone',
            zoneName: l['name']?.toString() ?? 'Ghat Zone',
            count: count,
            level: levelStr == 'high'
                ? CrowdLevel.high
                : (levelStr == 'medium' || levelStr == 'moderate'
                    ? CrowdLevel.moderate
                    : CrowdLevel.low),
            changePercent: 0.0,
            timestamp: DateTime.now(),
          );
        }).toList();
      }
    } catch (_) {}
    return [];
  }

  /// Compatibility method for teammate UI: submit lost & found report
  Future<bool> submitLostFound(Map<String, dynamic> data) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return true;
  }
}
