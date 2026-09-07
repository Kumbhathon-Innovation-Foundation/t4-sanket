import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/itinerary_models.dart';
import '../models/place_detail_model.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../services/supabase_service.dart';
import '../services/voice_service.dart';
import 'place_detail_screen.dart';
import '../widgets/kumbh_marker.dart';
import '../widgets/nearby_carousel.dart';
import '../widgets/simulation_toolbar.dart';
import '../widgets/tactical_timeline.dart';
import '../widgets/user_location_marker.dart';
import '../widgets/voice_assistant_sheet.dart';

class MapScreen extends StatefulWidget {
  final Itinerary? itinerary;
  final bool autoStartSimulation;

  const MapScreen({
    super.key,
    this.itinerary,
    this.autoStartSimulation = false,
  });

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  final SupabaseService _supabaseService = SupabaseService();
  final LocationService _locationService = LocationService();
  final ApiService _apiService = ApiService();

  Itinerary? _currentItinerary;
  RealtimeChannel? _patchSubscription;
  RealtimeChannel? _advisorySubscription;
  StreamSubscription<Position>? _gpsSubscription;

  // Live GPS & Simulated Coordinates
  LatLng _userPosition = const LatLng(20.0077, 73.7926);
  double? _userHeading;
  double _accuracyRadius = 22.0;

  // Real Simulation Mode State (Stage 6)
  bool _isSimulating = false;
  bool _showSimulationToolbar = false;
  double _simulationSpeedMultiplier = 5.0; // 1x, 5x, 20x
  double _simulatedStep = 0.0;
  List<LatLng> _allRouteCoordinates = [];
  Timer? _simulationTimer;
  final Map<String, LatLng> _poiCoordLookup = {};

  // Active Proximity POI Alert
  PoiAlongRoute? _activeProximityPoi;

  // Dismissible Info Banner
  bool _showInfoBanner = true;
  String _infoBannerText = '🚗 Parking P1 80% full. Use P2 for easy entry.';

  // Realtime Patch Banner notification
  String? _patchAlertBanner;

  // Category filter for pins (All, Ghats, Temples, Medical, Toilets, Parking)
  String _selectedCategoryFilter = 'All';

  // Reference POI pins loaded from Supabase
  List<Map<String, dynamic>> _referenceGhats = [];
  List<Map<String, dynamic>> _referenceTemples = [];
  List<Map<String, dynamic>> _referenceParking = [];
  List<Map<String, dynamic>> _referenceMedical = [];
  List<Map<String, dynamic>> _referenceToilets = [];
  List<Map<String, dynamic>> _referenceFood = [];

  // Hands-free voice navigation active by default
  bool _isHandsFreeActive = true;
  bool _isVoiceMuted = false;
  final TextEditingController _mapSearchController = TextEditingController();
  bool _showReturnToParkingBanner = false;

  // Carousel place cards
  List<NearbyPlaceCardData> _nearbyCards = [];

  // Current map zoom level
  double _currentZoom = 15.0;

  // STAGE 10: Dynamic Crowd Levels & Color Cache
  Timer? _crowdRefreshTimer;
  final Map<String, String> _poiCrowdLookup = {
    'ghat_0020': 'red', // Ramkund default
    'ramkund': 'red',
    'ghat_0014': 'green', // Talkuteshwar default
    'talkuteshwar': 'green',
    'ghat_0005': 'yellow', // Lakshminarayan default
    'lakshminarayan': 'yellow',
    'ghat_0003': 'green', // Someshwar default
    'someshwar': 'green',
    'ghat_0006': 'green', // Kapila default
    'kapila': 'green',
    'temple_0002': 'yellow', // Kalaram default
    'kalaram': 'yellow',
    'temple_0003': 'green', // Kapaleshwar default
    'kapaleshwar': 'green',
  };

  @override
  void initState() {
    super.initState();
    _currentItinerary = widget.itinerary;
    _setupRouteCoordinates();
    _setupRealtimeSubscriptions();
    _loadReferenceMapData();
    _initLiveGps();
    _startPeriodicCrowdRefresh();

    if (widget.autoStartSimulation) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_isSimulating && _allRouteCoordinates.isNotEmpty) {
          _startSimulation();
        }
      });
    }
  }

  @override
  void didUpdateWidget(covariant MapScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.itinerary != oldWidget.itinerary) {
      _currentItinerary = widget.itinerary;
      _setupRouteCoordinates();
      _setupRealtimeSubscriptions();
    }
    if (widget.autoStartSimulation && (!oldWidget.autoStartSimulation || widget.itinerary != oldWidget.itinerary)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_isSimulating && _allRouteCoordinates.isNotEmpty) {
          _startSimulation();
        }
      });
    }
  }

  @override
  void dispose() {
    _crowdRefreshTimer?.cancel();
    _simulationTimer?.cancel();
    _gpsSubscription?.cancel();
    _patchSubscription?.unsubscribe();
    _advisorySubscription?.unsubscribe();
    super.dispose();
  }

  void _startPeriodicCrowdRefresh() {
    // Initial fetch
    _refreshCrowdData();
    // Refresh crowd levels every 20 seconds for live colour-coded navigation (Stage 10)
    _crowdRefreshTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      if (mounted) {
        _refreshCrowdData();
      }
    });
  }

  Future<void> _refreshCrowdData() async {
    try {
      final levels = await _apiService.getCrowdLevels();
      if (!mounted) return;
      setState(() {
        for (var item in levels) {
          final pid = item['poi_id']?.toString();
          final name = item['name']?.toString().toLowerCase();
          final color = item['crowd_color']?.toString() ?? 'green';
          if (pid != null && pid.isNotEmpty) {
            _poiCrowdLookup[pid] = color;
          }
          if (name != null && name.isNotEmpty) {
            _poiCrowdLookup[name] = color;
          }
        }
      });
    } catch (_) {}
  }

  void _initLiveGps() async {
    final permitted = await _locationService.checkAndRequestPermission();
    if (!permitted || !mounted) return;

    final initialPos = await _locationService.getCurrentPosition();
    if (initialPos != null && mounted) {
      _onLocationUpdated(
        initialPos,
        accuracy: 15.0,
        isSimulated: false,
      );
    }

    _gpsSubscription?.cancel();
    _gpsSubscription = _locationService.getPositionStream()?.listen((pos) {
      if (!_isSimulating && mounted) {
        _onLocationUpdated(
          LatLng(pos.latitude, pos.longitude),
          heading: pos.heading,
          accuracy: pos.accuracy,
          isSimulated: false,
        );
      }
    });
  }

  Future<void> _loadReferenceMapData() async {
    try {
      final results = await Future.wait([
        _supabaseService.getGhats(),
        _supabaseService.getTemples(limit: 40),
        _supabaseService.getParkingZones(),
        _supabaseService.getFacilities(category: 'hospital'),
        _supabaseService.getFacilities(category: 'toilet'),
        _supabaseService.getFoodSpots(),
      ]);

      if (mounted) {
        setState(() {
          _referenceGhats = results[0];
          _referenceTemples = results[1];
          _referenceParking = results[2];
          _referenceMedical = results[3];
          _referenceToilets = results[4];
          _referenceFood = results[5];

          // Index coordinates for real-time proximity triggers
          for (var list in [_referenceGhats, _referenceTemples, _referenceParking, _referenceMedical, _referenceToilets, _referenceFood]) {
            for (var item in list) {
              final lat = (item['lat'] as num?)?.toDouble();
              final lng = (item['lng'] as num?)?.toDouble();
              final id = item['id']?.toString() ?? '';
              final name = item['name']?.toString() ?? '';
              if (lat != null && lng != null) {
                if (id.isNotEmpty) _poiCoordLookup[id] = LatLng(lat, lng);
                if (name.isNotEmpty) _poiCoordLookup[name.toLowerCase()] = LatLng(lat, lng);
              }
            }
          }

          // Populate Nearby Carousel with closest prominent sites
          _nearbyCards = [
            const NearbyPlaceCardData(
              id: 'tapovan_temple',
              name: 'Tapovan Temple',
              category: 'Temple',
              distanceText: '2.1 km',
              lat: 19.9920,
              lng: 73.8050,
            ),
            const NearbyPlaceCardData(
              id: 'tapovan_parking',
              name: 'Tapovan Parking',
              category: 'Parking',
              distanceText: '2.3 km',
              lat: 19.9910,
              lng: 73.8030,
            ),
            const NearbyPlaceCardData(
              id: 'ramkund_ghat',
              name: 'Ramkund Sacred Ghat',
              category: 'Ghat',
              distanceText: '0.4 km',
              lat: 20.0077,
              lng: 73.7926,
            ),
            const NearbyPlaceCardData(
              id: 'kalaram_temple',
              name: 'Kalaram Sansthan',
              category: 'Temple',
              distanceText: '0.7 km',
              lat: 20.0068,
              lng: 73.7919,
            ),
          ];
        });
      }
    } catch (_) {}
  }

  void _setupRouteCoordinates() {
    if (_currentItinerary == null) return;
    List<LatLng> coords = [];
    for (var stop in _currentItinerary!.stops) {
      for (var pt in stop.polyline) {
        coords.add(LatLng(pt[1], pt[0]));
      }

      // Ensure any POIs along route have coordinate lookups
      if (stop.polyline.isNotEmpty) {
        for (var poi in stop.poisAlongRoute) {
          final pKey = poi.name.toLowerCase();
          if (!_poiCoordLookup.containsKey(poi.poiId) && !_poiCoordLookup.containsKey(pKey)) {
            final midPt = stop.polyline[stop.polyline.length ~/ 2];
            _poiCoordLookup[poi.poiId] = LatLng(midPt[1], midPt[0]);
            _poiCoordLookup[pKey] = LatLng(midPt[1], midPt[0]);
          }
        }
      }
    }
    setState(() {
      _allRouteCoordinates = coords;
      if (coords.isNotEmpty) {
        _userPosition = coords.first;
        _simulatedStep = 0.0;
      }
    });
  }

  void _setupRealtimeSubscriptions() {
    _patchSubscription?.unsubscribe();
    _advisorySubscription?.unsubscribe();

    if (_currentItinerary == null || _currentItinerary!.tripId.isEmpty) return;

    // 1. Subscribe to trip_patches for this active trip
    _patchSubscription = _supabaseService.subscribeToTripPatches(
      tripId: _currentItinerary!.tripId,
      onPatchReceived: (record) {
        final reason = record['reason']?.toString() ?? 'Route recalculated';
        final patchData = record['patch'];

        if (patchData is Map<String, dynamic> && mounted) {
          setState(() {
            _patchAlertBanner = '⚡ Live Patch: $reason';
            _currentItinerary = Itinerary.fromJson(patchData);
            _setupRouteCoordinates();
          });
        }
      },
    );

    // 2. Subscribe to advisory_corridors changes
    _advisorySubscription = _supabaseService.subscribeToAdvisories(
      onAdvisoryChanged: (record) {
        final status = record['status']?.toString();
        final name = record['name']?.toString() ?? 'Corridor';
        final severity = record['severity']?.toString() ?? 'critical';

        if (status == 'active' && mounted) {
          setState(() {
            _infoBannerText = '⚠️ TRAFFIC ADVISORY: $name is now ACTIVE ($severity)!';
            _showInfoBanner = true;
          });
        }
      },
    );
  }

  // --- Continuous Simulation Mode (Stage 6) ---
  void _toggleSimulation() {
    setState(() {
      _showSimulationToolbar = true;
      if (_isSimulating) {
        _pauseSimulation();
      } else {
        _startSimulation();
      }
    });
  }

  void _startSimulation() {
    if (_allRouteCoordinates.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No active route to simulate.')),
      );
      return;
    }

    _simulationTimer?.cancel();
    setState(() => _isSimulating = true);

    // Hands-free voice departure announcement
    if (_isHandsFreeActive && !_isVoiceMuted && _currentItinerary != null) {
      final text = _currentItinerary!.summaryText;
      final code = _currentItinerary!.languageCode;
      VoiceService().speak(text, languageCode: code);
    }

    // 50ms ticks for fluid 20 FPS movement
    _simulationTimer = Timer.periodic(const Duration(milliseconds: 50), (_) {
      if (!mounted) return;

      // Base speed: 0.05 step per tick (~1 waypoint per second at 1x)
      final increment = 0.05 * _simulationSpeedMultiplier;
      _simulatedStep += increment;

      if (_simulatedStep >= _allRouteCoordinates.length - 1) {
        _simulatedStep = (_allRouteCoordinates.length - 1).toDouble();
        _pauseSimulation();
        setState(() {
          _showReturnToParkingBanner = true;
        });
        if (_isHandsFreeActive && !_isVoiceMuted) {
          VoiceService().speak('You have arrived at your destination. Pilgrimage completed peacefully. You can now tap Way Back to return to your parking.');
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('🎉 Pilgrimage destination reached! Way back to parking option available.')),
        );
        return;
      }

      final idx = _simulatedStep.floor();
      final t = _simulatedStep - idx;
      final p1 = _allRouteCoordinates[idx];
      final p2 = _allRouteCoordinates[math.min(idx + 1, _allRouteCoordinates.length - 1)];

      final lat = p1.latitude + (p2.latitude - p1.latitude) * t;
      final lng = p1.longitude + (p2.longitude - p1.longitude) * t;
      final heading = _calculateBearing(p1, p2);

      _onLocationUpdated(
        LatLng(lat, lng),
        heading: heading,
        accuracy: 10.0,
        isSimulated: true,
      );
    });
  }

  void _pauseSimulation() {
    _simulationTimer?.cancel();
    if (mounted) {
      setState(() => _isSimulating = false);
    }
  }

  void _resetSimulation() {
    _simulationTimer?.cancel();
    setState(() {
      _isSimulating = false;
      _simulatedStep = 0.0;
      if (_allRouteCoordinates.isNotEmpty) {
        _userPosition = _allRouteCoordinates.first;
        _mapController.move(_userPosition, _currentZoom);
      }
    });
  }

  void _setSimulationSpeed(double speed) {
    setState(() => _simulationSpeedMultiplier = speed);
    if (_isSimulating) {
      _startSimulation();
    }
  }

  // Unified Location Pipeline for both live GPS and simulated coordinates
  void _onLocationUpdated(
    LatLng pos, {
    double? heading,
    double? accuracy,
    required bool isSimulated,
  }) {
    setState(() {
      _userPosition = pos;
      if (heading != null && heading > 0) {
        _userHeading = heading;
      }
      if (accuracy != null && accuracy > 0) {
        _accuracyRadius = accuracy.clamp(8.0, 45.0);
      }
    });

    if (isSimulated) {
      _mapController.move(pos, _currentZoom);
    }

    _checkProximityAlerts(pos);
  }

  void _checkProximityAlerts(LatLng currentPos) {
    if (_currentItinerary == null) return;

    PoiAlongRoute? closestPoi;
    double minDistance = double.infinity;

    for (var stop in _currentItinerary!.stops) {
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
      setState(() {
        _activeProximityPoi = closestPoi;
      });
      if (_isHandsFreeActive && !_isVoiceMuted) {
        VoiceService().speak('${closestPoi.name} is on your ${closestPoi.side}, ${closestPoi.triggerDistanceM} meters away.');
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

  void _openPoiDetail(PoiAlongRoute poi) async {
    final coord = _poiCoordLookup[poi.poiId] ??
        _poiCoordLookup[poi.name.toLowerCase()] ??
        const LatLng(20.0068, 73.7919);
    final placeData = PlaceDetailData.fromPoiAlongRoute(
      poi,
      lat: coord.latitude,
      lng: coord.longitude,
      userLat: _userPosition.latitude,
      userLng: _userPosition.longitude,
    );

    final updatedItinerary = await PlaceDetailPage.open(
      context,
      place: placeData,
      activeItinerary: _currentItinerary,
      userPosition: _userPosition,
    );

    if (updatedItinerary != null && mounted) {
      _applyPatchedItinerary(updatedItinerary, placeData.name);
    }
  }

  void _openSupabasePlaceDetail(Map<String, dynamic> item, String category) async {
    final placeData = PlaceDetailData.fromSupabaseItem(item, category: category);
    final updatedItinerary = await PlaceDetailPage.open(
      context,
      place: placeData,
      activeItinerary: _currentItinerary,
      userPosition: _userPosition,
    );

    if (updatedItinerary != null && mounted) {
      _applyPatchedItinerary(updatedItinerary, placeData.name);
    }
  }

  void _openNearbyCardDetail(NearbyPlaceCardData place) async {
    _mapController.move(LatLng(place.lat, place.lng), 17.0);
    final isHeritage = place.category.toLowerCase() == 'temple' ||
        place.category.toLowerCase() == 'ghat';
    final placeData = PlaceDetailData(
      id: place.id,
      name: place.name,
      category: place.category,
      contentType: isHeritage ? PlaceContentType.heritage : PlaceContentType.foodUtility,
      lat: place.lat,
      lng: place.lng,
      distanceText: place.distanceText,
      address: '${place.category} in Panchavati Pilgrimage Zone',
      description: 'Prominent location on the official Kumbh Mela mobility network.',
      rankingReason: '${place.distanceText} away, low crowd, ~5 min wait',
      crowdStatus: 'Low Crowd',
      zoneOrSector: 'Zone 4 • Panchavati',
      amenities: const [
        PlaceAmenity(
          title: 'Elder & Divyang Access',
          description: 'Step-free ramp access with volunteers.',
          iconType: 'ramp',
        ),
        PlaceAmenity(
          title: 'Water & Facilities',
          description: 'Continuous municipal RO drinking water.',
          iconType: 'water',
        ),
      ],
    );

    final updatedItinerary = await PlaceDetailPage.open(
      context,
      place: placeData,
      activeItinerary: _currentItinerary,
      userPosition: _userPosition,
    );

    if (updatedItinerary != null && mounted) {
      _applyPatchedItinerary(updatedItinerary, placeData.name);
    }
  }

  void _applyPatchedItinerary(Itinerary newItin, String placeName) {
    setState(() {
      _activeProximityPoi = null;
      _currentItinerary = newItin;
      _setupRouteCoordinates();
    });

    // Resume simulation / route navigation automatically
    if (!_isSimulating && _allRouteCoordinates.isNotEmpty) {
      _startSimulation();
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Text('Route updated to visit $placeName. Navigation resumed!'),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF2E7D32),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _performInJourneySearch(String query) {
    final q = query.toLowerCase().trim();
    if (q.isEmpty) return;

    String cat = 'food';
    if (q.contains('toilet') || q.contains('lavatory') || q.contains('wc') || q.contains('washroom')) {
      cat = 'toilets';
    } else if (q.contains('medical') || q.contains('doctor') || q.contains('hospital') || q.contains('health')) {
      cat = 'medical';
    } else if (q.contains('temple') || q.contains('mandir')) {
      cat = 'temples';
    }

    _filterNearbyCategory(cat);
  }

  void _filterNearbyCategory(String cat) async {
    List<NearbyPlaceCardData> filtered = [];
    if (cat == 'toilets' || cat == 'toilet') {
      filtered = _referenceToilets.map((t) => NearbyPlaceCardData(
        id: t['id']?.toString() ?? 't_${DateTime.now().millisecondsSinceEpoch}',
        name: t['name']?.toString() ?? 'Public Toilet Block',
        category: 'Toilet',
        distanceText: '120m away',
        lat: (t['lat'] as num?)?.toDouble() ?? 20.007,
        lng: (t['lng'] as num?)?.toDouble() ?? 73.792,
      )).toList();
    } else if (cat == 'food') {
      if (_referenceFood.isEmpty) {
        _referenceFood = await _supabaseService.getFoodSpots();
      }
      filtered = _referenceFood.map((f) => NearbyPlaceCardData(
        id: f['id']?.toString() ?? 'f_${DateTime.now().millisecondsSinceEpoch}',
        name: f['name']?.toString() ?? 'Annakshetra Food Center',
        category: 'Food',
        distanceText: '150m away',
        lat: (f['lat'] as num?)?.toDouble() ?? 20.007,
        lng: (f['lng'] as num?)?.toDouble() ?? 73.792,
      )).toList();
    } else if (cat == 'medical') {
      filtered = _referenceMedical.map((m) => NearbyPlaceCardData(
        id: m['id']?.toString() ?? 'm_${DateTime.now().millisecondsSinceEpoch}',
        name: m['name']?.toString() ?? 'Emergency Medical Post',
        category: 'Medical',
        distanceText: '200m away',
        lat: (m['lat'] as num?)?.toDouble() ?? 20.007,
        lng: (m['lng'] as num?)?.toDouble() ?? 73.792,
      )).toList();
    } else if (cat == 'temples' || cat == 'temple') {
      filtered = _referenceTemples.map((m) => NearbyPlaceCardData(
        id: m['id']?.toString() ?? 'tm_${DateTime.now().millisecondsSinceEpoch}',
        name: m['name']?.toString() ?? 'Temple',
        category: 'Temple',
        distanceText: '300m away',
        lat: (m['lat'] as num?)?.toDouble() ?? 20.007,
        lng: (m['lng'] as num?)?.toDouble() ?? 73.792,
      )).toList();
    }

    if (mounted) {
      setState(() {
        if (filtered.isNotEmpty) {
          _nearbyCards = filtered.take(6).toList();
        }
      });
      if (_isHandsFreeActive && !_isVoiceMuted && filtered.isNotEmpty) {
        VoiceService().speak('Found ${filtered.length} $cat options nearby. Tap Detour Here to route through it.');
      }
    }
  }

  void _applyDirectDetour(NearbyPlaceCardData place) async {
    if (_currentItinerary == null) return;
    try {
      final res = await _apiService.patchPlan(
        tripId: _currentItinerary!.tripId,
        message: 'Detour to ${place.name}',
        intent: 'add_to_route',
        poiData: {
          'id': place.id,
          'name': place.name,
          'lat': place.lat,
          'lng': place.lng,
          'category': place.category,
        },
        location: {
          'lat': _userPosition.latitude,
          'lng': _userPosition.longitude,
        },
      );

      final patched = Itinerary.fromJson(res);
      _applyPatchedItinerary(patched, place.name);
      if (_isHandsFreeActive && !_isVoiceMuted) {
        VoiceService().speak('Route updated to detour via ${place.name}. Resuming navigation.');
      }
    } catch (e) {
      debugPrint('Direct detour error: $e');
    }
  }

  void _startReturnToParkingJourney() async {
    if (_currentItinerary == null) return;
    try {
      final res = await _apiService.patchPlan(
        tripId: _currentItinerary!.tripId,
        message: 'Way back to my parking',
        intent: 'return_to_parking',
        location: {
          'lat': _userPosition.latitude,
          'lng': _userPosition.longitude,
        },
      );

      final returnItin = Itinerary.fromJson(res);
      setState(() {
        _currentItinerary = returnItin;
        _showReturnToParkingBanner = false;
        _setupRouteCoordinates();
      });

      if (_isHandsFreeActive && !_isVoiceMuted) {
        VoiceService().speak(returnItin.summaryText, languageCode: returnItin.languageCode);
      }

      if (_allRouteCoordinates.isNotEmpty) {
        _startSimulation();
      }
    } catch (e) {
      debugPrint('Return journey error: $e');
    }
  }

  void _zoomIn() {
    setState(() {
      _currentZoom = (_currentZoom + 1).clamp(3.0, 18.0);
      _mapController.move(_userPosition, _currentZoom);
    });
  }

  void _zoomOut() {
    setState(() {
      _currentZoom = (_currentZoom - 1).clamp(3.0, 18.0);
      _mapController.move(_userPosition, _currentZoom);
    });
  }

  void _locateMe() async {
    if (_isSimulating) {
      _mapController.move(_userPosition, 16.5);
      return;
    }

    final pos = await _locationService.getCurrentPosition();
    if (pos != null) {
      final distToNashik = LocationService.distanceBetween(
        pos.latitude,
        pos.longitude,
        20.0077,
        73.7926,
      );

      if (distToNashik < 50000) {
        _onLocationUpdated(pos, isSimulated: false);
        _mapController.move(pos, 16.5);
      } else {
        _mapController.move(_userPosition, 16.5);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('📍 Outside Nashik: Centered on Kumbh Mela route'),
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } else {
      _mapController.move(_userPosition, 16.5);
    }
  }

  // Build clustering & filtered markers based on zoom and category
  List<Marker> _buildCategoryMarkers() {
    List<Marker> markers = [];

    // Helper to add marker
    void addPoi(Map<String, dynamic> item, PoiCategory cat) {
      final lat = (item['lat'] as num?)?.toDouble();
      final lng = (item['lng'] as num?)?.toDouble();
      final name = item['name']?.toString() ?? 'POI';
      if (lat == null || lng == null) return;

      final id = item['id']?.toString().toLowerCase() ?? '';
      final nameLower = name.toLowerCase();
      String? crowd;
      if (_poiCrowdLookup.containsKey(id)) {
        crowd = _poiCrowdLookup[id];
      } else if (_poiCrowdLookup.containsKey(nameLower)) {
        crowd = _poiCrowdLookup[nameLower];
      } else {
        for (var entry in _poiCrowdLookup.entries) {
          if (nameLower.contains(entry.key)) {
            crowd = entry.value;
            break;
          }
        }
      }
      if (crowd == null && cat == PoiCategory.ghat) {
        crowd = nameLower.contains('ramkund') ? 'red' : 'green';
      }

      markers.add(
        Marker(
          point: LatLng(lat, lng),
          width: 38,
          height: 38,
          child: KumbhMarkerPin(
            category: cat,
            label: name,
            crowdColor: crowd,
            onTap: () {
              _mapController.move(LatLng(lat, lng), 17.0);
              _openSupabasePlaceDetail(item, cat.name);
            },
          ),
        ),
      );
    }

    final showAll = _selectedCategoryFilter == 'All';

    // When zoomed in, show more pins. When zoomed out, cluster/sample to prevent clutter.
    final limit = _currentZoom < 14.0 ? 5 : 20;

    if (showAll || _selectedCategoryFilter == 'Ghats') {
      for (var g in _referenceGhats.take(limit)) {
        addPoi(g, PoiCategory.ghat);
      }
    }
    if (showAll || _selectedCategoryFilter == 'Temples') {
      for (var t in _referenceTemples.take(limit)) {
        addPoi(t, PoiCategory.temple);
      }
    }
    if (showAll || _selectedCategoryFilter == 'Parking') {
      for (var p in _referenceParking.take(limit)) {
        addPoi(p, PoiCategory.parking);
      }
    }
    if (showAll || _selectedCategoryFilter == 'Medical') {
      for (var m in _referenceMedical.take(limit)) {
        addPoi(m, PoiCategory.medical);
      }
    }
    if (showAll || _selectedCategoryFilter == 'Toilets') {
      for (var tl in _referenceToilets.take(limit)) {
        addPoi(tl, PoiCategory.toilet);
      }
    }

    return markers;
  }

  /// STAGE 10: Multi-Segment Colour-Coded Polyline Builder
  List<Polyline> _buildRoutePolylines() {
    List<Polyline> polylines = [];
    if (_currentItinerary == null || _currentItinerary!.stops.isEmpty) {
      if (_allRouteCoordinates.isNotEmpty) {
        polylines.add(
          Polyline(
            points: _allRouteCoordinates,
            strokeWidth: 5.5,
            color: const Color(0xFF2E7D32),
          ),
        );
      }
      return polylines;
    }

    for (var stop in _currentItinerary!.stops) {
      if (stop.polyline.isNotEmpty) {
        final pts = stop.polyline.map((p) => LatLng(p[1], p[0])).toList();
        Color segColor;
        if (stop.type == 'transit_segment') {
          segColor = const Color(0xFF1976D2); // Electric feeder shuttle indigo
        } else {
          switch ((stop.crowdColor ?? 'green').toLowerCase()) {
            case 'red':
            case 'high':
              segColor = const Color(0xFFD32F2F); // High crowd corridor (Red)
              break;
            case 'yellow':
            case 'medium':
              segColor = const Color(0xFFF57F17); // Medium crowd corridor (Yellow/Orange)
              break;
            case 'green':
            case 'low':
            default:
              segColor = const Color(0xFF2E7D32); // Low crowd corridor (Green)
              break;
          }
        }
        polylines.add(
          Polyline(
            points: pts,
            strokeWidth: 5.5,
            color: segColor,
          ),
        );
      }
    }

    if (polylines.isEmpty && _allRouteCoordinates.isNotEmpty) {
      polylines.add(
        Polyline(
          points: _allRouteCoordinates,
          strokeWidth: 5.5,
          color: const Color(0xFF2E7D32),
        ),
      );
    }

    return polylines;
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      body: Stack(
        children: [
          // 1. BASE LAYER: Full-Bleed Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _userPosition,
              initialZoom: _currentZoom,
              onPositionChanged: (pos, _) {
                _currentZoom = pos.zoom;
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.anubhav.anubhav_app',
              ),

              // Concentric Crowd Density Zones around Ramkund (Matching Screenshot 1)
              CircleLayer(
                circles: [
                  // Live GPS / Simulated Accuracy Circle (Stage 6)
                  CircleMarker(
                    point: _userPosition,
                    radius: _accuracyRadius,
                    useRadiusInMeter: true,
                    color: (_isSimulating ? const Color(0xFFE65100) : const Color(0xFF0288D1))
                        .withValues(alpha: 0.16),
                    borderColor: (_isSimulating ? const Color(0xFFE65100) : const Color(0xFF0288D1))
                        .withValues(alpha: 0.45),
                    borderStrokeWidth: 1.5,
                  ),

                  CircleMarker(
                    point: const LatLng(20.0077, 73.7926),
                    radius: 380,
                    useRadiusInMeter: true,
                    color: const Color(0xFFE65100).withValues(alpha: 0.14),
                    borderColor: const Color(0xFFE65100).withValues(alpha: 0.4),
                    borderStrokeWidth: 1.5,
                  ),
                  CircleMarker(
                    point: const LatLng(20.0077, 73.7926),
                    radius: 750,
                    useRadiusInMeter: true,
                    color: const Color(0xFFFB8C00).withValues(alpha: 0.08),
                    borderColor: const Color(0xFFFB8C00).withValues(alpha: 0.25),
                    borderStrokeWidth: 1.2,
                  ),
                ],
              ),

              // STAGE 10: Multi-Segment Colour-Coded Route Polylines
              PolylineLayer(
                polylines: _buildRoutePolylines(),
              ),

              // Category Color-Coded & Clustered Markers (Screenshot 1)
              MarkerLayer(
                markers: [
                  // User live GPS & Simulated location indicator with pulse halo (Stage 6)
                  Marker(
                    point: _userPosition,
                    width: 48,
                    height: 48,
                    child: KumbhUserLocationMarker(
                      heading: _userHeading,
                      isSimulated: _isSimulating,
                    ),
                  ),

                  // Reference POI Markers
                  ..._buildCategoryMarkers(),
                ],
              ),
            ],
          ),

          // 2. TOP OVERLAY: Floating Header with Pill Search Bar & SOS Button (Screenshot 1)
          Positioned(
            top: topPadding + 10,
            left: 16,
            right: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top App Bar row: Back arrow, "Kumbh Mela Maps", active telemetry, and SOS button
                Row(
                  children: [
                    // Back button
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0D47A1),
                        shape: BoxShape.circle,
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Title & Active telemetry
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Kumbh Mela Maps',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0D1B2A),
                              shadows: [Shadow(color: Colors.white, blurRadius: 8)],
                            ),
                          ),
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Colors.green,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                '13.434k Active Pilgrims',
                                style: TextStyle(fontSize: 12, color: Colors.black87, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // SOS Button
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFFD32F2F),
                        shape: BoxShape.circle,
                        boxShadow: const [
                          BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2)),
                        ],
                      ),
                      child: const Center(
                        child: Text(
                          'SOS',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Floating Pill-Shaped Search Bar with Voice and Audio Controls
                Container(
                  height: 50,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [
                      BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 3)),
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Row(
                    children: [
                      const Icon(Icons.search, color: Color(0xFFE65100)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _mapSearchController,
                          decoration: const InputDecoration(
                            hintText: 'Search food, toilets, temples near me...',
                            hintStyle: TextStyle(color: Colors.grey, fontSize: 13),
                            border: InputBorder.none,
                            isDense: true,
                          ),
                          onSubmitted: (query) => _performInJourneySearch(query),
                        ),
                      ),
                      IconButton(
                        icon: Icon(
                          _isVoiceMuted ? Icons.volume_off : Icons.volume_up,
                          color: _isVoiceMuted ? Colors.grey : const Color(0xFF2E7D32),
                          size: 22,
                        ),
                        tooltip: _isVoiceMuted ? 'Voice Muted (Tap to Unmute)' : 'Hands-Free Voice Active (Tap to Mute)',
                        onPressed: () {
                          setState(() {
                            _isVoiceMuted = !_isVoiceMuted;
                            _isHandsFreeActive = !_isVoiceMuted;
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(_isVoiceMuted ? '🔇 Hands-free voice navigation muted' : '🔊 Hands-free voice navigation active'),
                              duration: const Duration(seconds: 1),
                            ),
                          );
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.mic, color: Color(0xFFE65100)),
                        tooltip: 'Voice Search (Hindi / Marathi / English)',
                        onPressed: () {
                          VoiceAssistantSheet.show(
                            context,
                            onPlanGenerated: (newItinerary, {bool autoStart = true}) {
                              setState(() {
                                _currentItinerary = newItinerary;
                                _setupRouteCoordinates();
                                _setupRealtimeSubscriptions();
                              });
                              _mapController.move(_userPosition, 16.0);
                              if (autoStart) {
                                _startSimulation();
                              }
                            },
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // In-Journey Detour Quick Chips (Food, Toilets, Medical, Temples)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.restaurant, size: 14, color: Color(0xFF2E7D32)),
                        label: const Text('🍜 Food Near Me', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        backgroundColor: Colors.white,
                        elevation: 2,
                        onPressed: () => _filterNearbyCategory('food'),
                      ),
                      const SizedBox(width: 8),
                      ActionChip(
                        avatar: const Icon(Icons.wc, size: 14, color: Color(0xFF5D4037)),
                        label: const Text('🚻 Toilets Near Me', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        backgroundColor: Colors.white,
                        elevation: 2,
                        onPressed: () => _filterNearbyCategory('toilets'),
                      ),
                      const SizedBox(width: 8),
                      ActionChip(
                        avatar: const Icon(Icons.local_hospital, size: 14, color: Colors.red),
                        label: const Text('🏥 Medical', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        backgroundColor: Colors.white,
                        elevation: 2,
                        onPressed: () => _filterNearbyCategory('medical'),
                      ),
                      const SizedBox(width: 8),
                      ActionChip(
                        avatar: const Icon(Icons.temple_hindu, size: 14, color: Color(0xFFE65100)),
                        label: const Text('🛕 Temples', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        backgroundColor: Colors.white,
                        elevation: 2,
                        onPressed: () => _filterNearbyCategory('temples'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // 3. Dismissible Info Banner Pill (Screenshot 1)
                if (_showInfoBanner)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF8E1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.amber.shade200),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, size: 16, color: Color(0xFFE65100)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _infoBannerText,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF5D4037)),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => setState(() => _showInfoBanner = false),
                          child: const Icon(Icons.close, size: 16, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),

                // Realtime Patch Banner (if triggered)
                if (_patchAlertBanner != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1B263B),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6)],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.bolt, color: Colors.amber, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _patchAlertBanner!,
                            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => setState(() => _patchAlertBanner = null),
                          child: const Icon(Icons.close, size: 16, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                ],

                // 4. Proximity Popup Card: Rendered fully within screen bounds below search bar
                if (_activeProximityPoi != null) ...[
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () => _openPoiDetail(_activeProximityPoi!),
                    child: Card(
                      elevation: 8,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      color: Colors.white,
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFE0B2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.temple_hindu, color: Color(0xFFE65100), size: 24),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'Nearby: ${_activeProximityPoi!.name}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  Text(
                                    'On your ${_activeProximityPoi!.side} (~${_activeProximityPoi!.triggerDistanceM}m) • Tap for details',
                                    style: const TextStyle(color: Colors.grey, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE65100),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: () => _openPoiDetail(_activeProximityPoi!),
                              child: const Text('Visit', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],

                // 4.5. Way Back to Parking Prominent Banner (Available when destination reached or active)
                if (_showReturnToParkingBanner) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1B263B), Color(0xFF0D1B2A)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 3))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.amber.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.directions_car, color: Colors.amber, size: 22),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Sacred Snan Completed! 🙏',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              Text(
                                'Return to parked vehicle via feeder shuttle',
                                style: TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.replay, size: 14),
                          label: const Text('Way Back', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE65100),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _startReturnToParkingJourney,
                        ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () => setState(() => _showReturnToParkingBanner = false),
                          child: const Icon(Icons.close, color: Colors.white60, size: 18),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // 5. FLOATING ACTION BUTTONS: Vertical Stack in Bottom-Right Corner (Screenshot 1)
          Positioned(
            right: 16,
            bottom: _showSimulationToolbar ? 350 : 270,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Locate Me Button
                _buildCircleFab(
                  icon: Icons.my_location,
                  onTap: _locateMe,
                  tooltip: 'Locate Me',
                ),
                const SizedBox(height: 10),

                // Zoom In
                _buildCircleFab(
                  icon: Icons.add,
                  onTap: _zoomIn,
                  tooltip: 'Zoom In',
                ),
                const SizedBox(height: 10),

                // Zoom Out
                _buildCircleFab(
                  icon: Icons.remove,
                  onTap: _zoomOut,
                  tooltip: 'Zoom Out',
                ),
                const SizedBox(height: 10),

                // Simulate Stepper Mode (Stage 5 & 6)
                _buildCircleFab(
                  icon: _isSimulating ? Icons.pause : Icons.play_arrow,
                  onTap: _toggleSimulation,
                  tooltip: _isSimulating ? 'Pause Simulation' : 'Simulate Pilgrimage Walk',
                  activeColor: _isSimulating ? const Color(0xFFE65100) : null,
                ),
              ],
            ),
          ),

          // 5.5. SIMULATION CONTROLS TOOLBAR (Stage 6)
          if (_showSimulationToolbar && _allRouteCoordinates.isNotEmpty)
            Positioned(
              left: 0,
              right: 0,
              bottom: 270,
              child: SimulationToolbar(
                isPlaying: _isSimulating,
                speedMultiplier: _simulationSpeedMultiplier,
                progressFraction: _allRouteCoordinates.isEmpty
                    ? 0.0
                    : (_simulatedStep / (_allRouteCoordinates.length - 1)),
                currentStep: _simulatedStep.toInt() + 1,
                totalSteps: _allRouteCoordinates.length,
                onTogglePlay: () {
                  if (_isSimulating) {
                    _pauseSimulation();
                  } else {
                    _startSimulation();
                  }
                },
                onSpeedChanged: _setSimulationSpeed,
                onReset: _resetSimulation,
                onClose: () {
                  _pauseSimulation();
                  setState(() => _showSimulationToolbar = false);
                },
              ),
            ),

          // 6. DRAGGABLE SCROLLABLE SHEET: Bottom Panel with Carousel & Timeline (Screenshot 1 & 4)
          DraggableScrollableSheet(
            initialChildSize: 0.32,
            minChildSize: 0.16,
            maxChildSize: 0.85,
            builder: (context, scrollController) {
              return Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  boxShadow: [
                    BoxShadow(color: Colors.black12, blurRadius: 16, spreadRadius: 4),
                  ],
                ),
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.only(top: 12),
                  children: [
                    // Drag Handle
                    Center(
                      child: Container(
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Section: Nearby Places Header
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 18),
                      child: Row(
                        children: [
                          Icon(Icons.location_on, color: Color(0xFFD32F2F), size: 18),
                          SizedBox(width: 6),
                          Text(
                            'Nearby Places',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Color(0xFF0D1B2A),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Horizontal Scrolling Place Cards Carousel (Screenshot 1)
                    NearbyPlacesCarousel(
                      places: _nearbyCards,
                      onPlaceSelected: _openNearbyCardDetail,
                      onDetourSelected: _applyDirectDetour,
                    ),

                    const SizedBox(height: 16),

                    // Category Filter Chips (Screenshot 1)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Filter Locations',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 8),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: ['All', 'Ghats', 'Temples', 'Medical', 'Toilets', 'Parking'].map((cat) {
                                final isSelected = _selectedCategoryFilter == cat;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 8.0),
                                  child: FilterChip(
                                    label: Text(cat),
                                    selected: isSelected,
                                    selectedColor: const Color(0xFFE65100),
                                    labelStyle: TextStyle(
                                      color: isSelected ? Colors.white : Colors.black87,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                    backgroundColor: Colors.grey.shade100,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                    onSelected: (val) {
                                      setState(() => _selectedCategoryFilter = cat);
                                    },
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const Divider(height: 32),

                    // Tactical Timeline (if active itinerary exists)
                    if (_currentItinerary != null)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        child: TacticalTimelineWidget(
                          itinerary: _currentItinerary!,
                          onReturnToParking: _startReturnToParkingJourney,
                          onStartAudioNavigation: () {
                            final text = _currentItinerary!.summaryText;
                            final code = _currentItinerary!.languageCode.isNotEmpty
                                ? _currentItinerary!.languageCode
                                : VoiceService.detectLocaleFromText(text);
                            VoiceService().speak(text, languageCode: code);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('🔊 Speaking navigation in ${code.split('-').first.toUpperCase()}...'),
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          },
                        ),
                      )
                    else
                      const Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Center(
                          child: Text(
                            'No active route. Use Home to generate a pilgrimage plan.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // Consistent 44x44 Circular FAB helper
  Widget _buildCircleFab({
    required IconData icon,
    required VoidCallback onTap,
    required String tooltip,
    Color? activeColor,
  }) {
    return Tooltip(
      message: tooltip,
      child: Material(
        elevation: 4,
        shape: const CircleBorder(),
        color: activeColor ?? Colors.white,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: SizedBox(
            width: 44,
            height: 44,
            child: Icon(
              icon,
              size: 20,
              color: activeColor != null ? Colors.white : const Color(0xFF0D1B2A),
            ),
          ),
        ),
      ),
    );
  }
}
