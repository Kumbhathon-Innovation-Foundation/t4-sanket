import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../models/crowd_data.dart';
import '../models/route_data.dart';
import '../models/itinerary_models.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../services/voice_service.dart';

class RouteProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  TravelMode _selectedMode = TravelMode.walk;
  RouteData? _selectedRoute;
  List<RouteData> _routes = [];
  bool _isLoading = false;
  String? _error;

  // Active Backend Pilgrimage Itinerary (Stage 4-12)
  Itinerary? _itinerary;
  Map<String, String> _crowdColorLookup = {};

  // Simulation & Wayfinding State (Stage 6, 8, 9)
  bool _isSimulating = false;
  double _simulatedStep = 0.0;
  double _simulationSpeedMultiplier = 1.0;
  Timer? _simulationTimer;
  LatLng? _simulatedLocation;
  double _simulatedHeading = 0.0;
  PoiAlongRoute? _activeProximityPoi;
  bool _showReturnToParkingBanner = false;
  bool _isHandsFreeActive = true;
  bool _isVoiceMuted = false;

  // Known POI coordinates for proximity alerts
  static final Map<String, LatLng> _poiCoordLookup = {
    'ghat_0020': const LatLng(20.0077, 73.7926),
    'ramkund': const LatLng(20.0077, 73.7926),
    'ramkund ghat': const LatLng(20.0077, 73.7926),
    'kalaram temple': const LatLng(20.0089, 73.7958),
    'kalaram': const LatLng(20.0089, 73.7958),
    'goraram temple': const LatLng(20.0082, 73.7945),
    'goraram': const LatLng(20.0082, 73.7945),
    'sita gufa': const LatLng(20.0094, 73.7966),
    'kapaleshwar temple': const LatLng(20.0071, 73.7932),
    'laxman kund': const LatLng(20.0069, 73.7922),
    'gandhi talav': const LatLng(20.0064, 73.7915),
    'talkuteshwar': const LatLng(20.0045, 73.7905),
  };

  // Getters
  TravelMode get selectedMode => _selectedMode;
  RouteData? get selectedRoute => _selectedRoute;
  List<RouteData> get routes => _routes;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Itinerary? get itinerary => _itinerary;
  Map<String, String> get crowdColorLookup => _crowdColorLookup;

  bool get isSimulating => _isSimulating;
  double get simulatedStep => _simulatedStep;
  double get simulationSpeedMultiplier => _simulationSpeedMultiplier;
  LatLng? get simulatedLocation => _simulatedLocation;
  double get simulatedHeading => _simulatedHeading;
  PoiAlongRoute? get activeProximityPoi => _activeProximityPoi;
  bool get showReturnToParkingBanner => _showReturnToParkingBanner;
  bool get isHandsFreeActive => _isHandsFreeActive;
  bool get isVoiceMuted => _isVoiceMuted;

  RouteProvider() {
    _initDefaultRoutes();
  }

  void _initDefaultRoutes() {
    _routes = [
      const RouteData(
        id: 'rec_1',
        name: 'Ramkund Sacred Walk',
        origin: 'Panchavati Parking',
        destination: 'Ramkund Ghat',
        distanceKm: 2.1,
        durationMinutes: 28,
        crowdLevel: CrowdLevel.low,
        isRecommended: true,
        via: 'Via Laxman Rekha Marg',
        polylinePoints: [
          LatLng(20.0020, 73.7850),
          LatLng(20.0040, 73.7880),
          LatLng(20.0065, 73.7910),
          LatLng(20.0077, 73.7926),
        ],
      ),
      const RouteData(
        id: 'orig_1',
        name: 'Main Pilgrim Highway',
        origin: 'Panchavati Parking',
        destination: 'Ramkund Ghat',
        distanceKm: 2.8,
        durationMinutes: 42,
        crowdLevel: CrowdLevel.high,
        isRecommended: false,
        via: 'Via Godavari Main Marg',
        polylinePoints: [
          LatLng(20.0020, 73.7850),
          LatLng(20.0035, 73.7900),
          LatLng(20.0055, 73.7930),
          LatLng(20.0077, 73.7926),
        ],
      ),
    ];
    _selectedRoute = _routes.first;
  }

  void setMode(TravelMode mode) {
    if (_selectedMode != mode) {
      _selectedMode = mode;
      notifyListeners();
    }
  }

  void selectRoute(RouteData route) {
    _selectedRoute = route;
    notifyListeners();
  }

  List<LatLng> get allRouteCoordinates {
    if (_itinerary != null && _itinerary!.stops.isNotEmpty) {
      final list = <LatLng>[];
      for (final stop in _itinerary!.stops) {
        for (final pt in stop.polyline) {
          if (pt.length >= 2) {
            list.add(LatLng(pt[0], pt[1]));
          }
        }
      }
      if (list.isNotEmpty) return list;
    }
    if (_selectedRoute != null && _selectedRoute!.polylinePoints.isNotEmpty) {
      return _selectedRoute!.polylinePoints;
    }
    return [
      const LatLng(20.0020, 73.7850),
      const LatLng(20.0040, 73.7880),
      const LatLng(20.0065, 73.7910),
      const LatLng(20.0077, 73.7926),
    ];
  }

  Future<void> fetchItinerary({
    required String message,
    String mode = 'nl',
    Map<String, dynamic>? formData,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _apiService.createPlan(
        userId: 'pilgrim_user',
        message: message,
        mode: mode,
        formData: formData,
      );
      _itinerary = result;
      _updateSelectedRouteFromItinerary(result);
      await refreshCrowdColors();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> patchPlan(String patchPrompt) async {
    if (_itinerary == null) return;
    _isLoading = true;
    notifyListeners();

    try {
      final patchResp = await _apiService.patchPlan(
        tripId: _itinerary!.tripId,
        message: patchPrompt,
      );
      if (patchResp.containsKey('patch') || patchResp.containsKey('stops')) {
        // Re-fetch or apply patch
        final updatedItinerary = await _apiService.createPlan(
          userId: 'pilgrim_user',
          message: 'Apply patch to trip ${_itinerary!.tripId}: $patchPrompt',
        );
        _itinerary = updatedItinerary;
        _updateSelectedRouteFromItinerary(updatedItinerary);
        await refreshCrowdColors();
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  void _updateSelectedRouteFromItinerary(Itinerary itin) {
    final coords = allRouteCoordinates;
    final via = itin.stops.where((s) => s.name != null).map((s) => s.name!).take(2).join(' & ');
    final totalDuration = itin.stops.fold<int>(0, (sum, s) => sum + (s.durationMin ?? 10));
    final route = RouteData(
      id: itin.tripId,
      name: itin.summaryText.isNotEmpty ? itin.summaryText.split('\n').first : 'Nashik Pilgrimage Route',
      origin: itin.stops.isNotEmpty && itin.stops.first.fromLoc != null
          ? itin.stops.first.fromLoc!
          : 'Origin',
      destination: itin.stops.isNotEmpty && itin.stops.last.toLoc != null
          ? itin.stops.last.toLoc!
          : 'Destination',
      distanceKm: 2.5,
      durationMinutes: totalDuration > 0 ? totalDuration : 35,
      crowdLevel: CrowdLevel.low,
      isRecommended: true,
      via: via.isNotEmpty ? 'Via $via' : 'Sacred Corridor',
      polylinePoints: coords,
    );
    _selectedRoute = route;
    _routes = [route];
  }

  Future<void> refreshCrowdColors() async {
    try {
      final levels = await _apiService.getCrowdLevels();
      final map = <String, String>{};
      for (final item in levels) {
        final poiId = item['poi_id']?.toString() ?? '';
        final color = item['crowd_color']?.toString() ??
            item['color']?.toString() ??
            'green';
        if (poiId.isNotEmpty) {
          map[poiId] = color;
        }
      }
      _crowdColorLookup = map;
      notifyListeners();
    } catch (_) {}
  }

  // --- Simulation Controls (Stage 6) ---
  void startSimulation() {
    final coords = allRouteCoordinates;
    if (coords.isEmpty) return;

    _simulationTimer?.cancel();
    _isSimulating = true;
    _showReturnToParkingBanner = false;
    notifyListeners();

    if (_isHandsFreeActive && !_isVoiceMuted && _itinerary != null) {
      VoiceService().speak(_itinerary!.summaryText, languageCode: _itinerary!.languageCode);
    }

    _simulationTimer = Timer.periodic(const Duration(milliseconds: 50), (_) {
      final increment = 0.05 * _simulationSpeedMultiplier;
      _simulatedStep += increment;

      if (_simulatedStep >= coords.length - 1) {
        _simulatedStep = (coords.length - 1).toDouble();
        pauseSimulation();
        _showReturnToParkingBanner = true;
        if (_isHandsFreeActive && !_isVoiceMuted) {
          VoiceService().speak('You have arrived at your pilgrimage destination. Har Har Gange!');
        }
        notifyListeners();
        return;
      }

      final idx = _simulatedStep.floor();
      final t = _simulatedStep - idx;
      final p1 = coords[idx];
      final p2 = coords[math.min(idx + 1, coords.length - 1)];

      final lat = p1.latitude + (p2.latitude - p1.latitude) * t;
      final lng = p1.longitude + (p2.longitude - p1.longitude) * t;
      final pos = LatLng(lat, lng);
      _simulatedHeading = _calculateBearing(p1, p2);
      _simulatedLocation = pos;

      _checkProximityAlerts(pos);
      notifyListeners();
    });
  }

  void pauseSimulation() {
    _simulationTimer?.cancel();
    _isSimulating = false;
    notifyListeners();
  }

  void resetSimulation() {
    _simulationTimer?.cancel();
    _isSimulating = false;
    _simulatedStep = 0.0;
    final coords = allRouteCoordinates;
    if (coords.isNotEmpty) {
      _simulatedLocation = coords.first;
    }
    _showReturnToParkingBanner = false;
    notifyListeners();
  }

  void setSimulationSpeed(double speed) {
    _simulationSpeedMultiplier = speed;
    notifyListeners();
  }

  void dismissProximityAlert() {
    _activeProximityPoi = null;
    notifyListeners();
  }

  void toggleVoiceMute() {
    _isVoiceMuted = !_isVoiceMuted;
    if (_isVoiceMuted) {
      VoiceService().stopSpeaking();
    }
    notifyListeners();
  }

  void toggleHandsFree() {
    _isHandsFreeActive = !_isHandsFreeActive;
    notifyListeners();
  }

  void _checkProximityAlerts(LatLng currentPos) {
    if (_itinerary == null) return;

    PoiAlongRoute? closestPoi;
    double minDistance = double.infinity;

    for (var stop in _itinerary!.stops) {
      for (var poi in stop.poisAlongRoute) {
        final pKey = poi.name.toLowerCase();
        final coord = _poiCoordLookup[poi.poiId] ?? _poiCoordLookup[pKey];
        if (coord != null) {
          final dist = LocationService.distanceBetween(
            currentPos.latitude,
            currentPos.longitude,
            coord.latitude,
            coord.longitude,
          );
          if (dist <= poi.triggerDistanceM && dist < minDistance) {
            minDistance = dist;
            closestPoi = poi;
          }
        }
      }
    }

    if (closestPoi != null && _activeProximityPoi?.name != closestPoi.name) {
      _activeProximityPoi = closestPoi;
      if (_isHandsFreeActive && !_isVoiceMuted) {
        VoiceService().speak(
          '${closestPoi.name} is on your ${closestPoi.side}, ${closestPoi.triggerDistanceM} meters away.',
        );
      }
    }
  }

  double _calculateBearing(LatLng start, LatLng end) {
    final startLat = (start.latitude * math.pi) / 180.0;
    final startLng = (start.longitude * math.pi) / 180.0;
    final endLat = (end.latitude * math.pi) / 180.0;
    final endLng = (end.longitude * math.pi) / 180.0;

    final dLng = endLng - startLng;
    final y = math.sin(dLng) * math.cos(endLat);
    final x = math.cos(startLat) * math.sin(endLat) -
        math.sin(startLat) * math.cos(endLat) * math.cos(dLng);

    final radians = math.atan2(y, x);
    return ((radians * 180.0 / math.pi) + 360.0) % 360.0;
  }

  @override
  void dispose() {
    _simulationTimer?.cancel();
    super.dispose();
  }
}
