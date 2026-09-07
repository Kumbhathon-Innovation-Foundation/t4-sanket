import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

import '../models/itinerary_models.dart';
import '../models/place_detail_model.dart';
import '../services/api_service.dart';

class PlaceDetailPage extends StatefulWidget {
  final PlaceDetailData place;
  final Itinerary? activeItinerary;
  final LatLng? userPosition;
  final List<PlaceDetailData> rankedAlternatives;

  const PlaceDetailPage({
    super.key,
    required this.place,
    this.activeItinerary,
    this.userPosition,
    this.rankedAlternatives = const [],
  });

  /// Static helper to show as a full modal or push route
  static Future<Itinerary?> open(
    BuildContext context, {
    required PlaceDetailData place,
    Itinerary? activeItinerary,
    LatLng? userPosition,
    List<PlaceDetailData> rankedAlternatives = const [],
  }) {
    return Navigator.of(context).push<Itinerary>(
      MaterialPageRoute(
        builder: (context) => PlaceDetailPage(
          place: place,
          activeItinerary: activeItinerary,
          userPosition: userPosition,
          rankedAlternatives: rankedAlternatives,
        ),
      ),
    );
  }

  @override
  State<PlaceDetailPage> createState() => _PlaceDetailPageState();
}

class _PlaceDetailPageState extends State<PlaceDetailPage> {
  final ApiService _apiService = ApiService();
  bool _isPatching = false;
  String? _errorMessage;
  late PlaceDetailData _currentPlace;
  late List<PlaceDetailData> _alternatives;

  @override
  void initState() {
    super.initState();
    _currentPlace = widget.place;
    _alternatives = List.from(widget.rankedAlternatives);
  }

  void _selectAlternative(PlaceDetailData alt) {
    setState(() {
      final oldPlace = _currentPlace;
      _alternatives = _alternatives.map((a) => a.id == alt.id ? oldPlace : a).toList();
      _currentPlace = alt;
    });
  }

  PlaceDetailData get place => _currentPlace;
  bool get isHeritage => place.contentType == PlaceContentType.heritage;

  Future<void> _handlePrimaryAction() async {
    if (widget.activeItinerary == null) {
      // Direct navigation when no prior trip exists
      final directItin = Itinerary(
        tripId: 'direct_${DateTime.now().millisecondsSinceEpoch}',
        status: 'active',
        summaryText: 'Navigating directly to ${place.name}. Follow the path on the Live Map.',
        lastUpdated: DateTime.now().toIso8601String(),
        stops: [
          ItineraryStop(
            order: 1,
            type: 'walk_segment',
            fromLoc: 'Current Location',
            toLoc: place.name,
            durationMin: 6,
            crowdColor: 'green',
            polyline: [
              [73.7910, 20.0050],
              [place.lng, place.lat],
            ],
          ),
          ItineraryStop(
            order: 2,
            type: 'visit',
            name: place.name,
            durationMin: 20,
            crowdColor: 'green',
            note: 'One-tap utility destination',
          ),
        ],
      );
      Navigator.of(context).pop(directItin);
      return;
    }

    setState(() {
      _isPatching = true;
      _errorMessage = null;
    });

    final tripId = widget.activeItinerary!.tripId;
    final intent = isHeritage ? 'visit' : 'add_to_route';
    final message = isHeritage
        ? 'Add visit stop to ${place.name}'
        : 'Add ${place.name} to route';

    final userLoc = widget.userPosition != null
        ? {'lat': widget.userPosition!.latitude, 'lng': widget.userPosition!.longitude}
        : {'lat': 20.0077, 'lng': 73.7926};

    try {
      final res = await _apiService.patchPlan(
        tripId: tripId,
        message: message,
        intent: intent,
        category: place.category.toLowerCase(),
        location: userLoc,
        poiData: {
          'id': place.id,
          'name': place.name,
          'lat': place.lat,
          'lng': place.lng,
          'category': place.category,
        },
      );

      if (!mounted) return;

      if (res.containsKey('stops')) {
        final updatedItinerary = Itinerary(
          tripId: tripId,
          status: 'active',
          summaryText: res['summary_text']?.toString() ??
              'Route updated to include ${place.name}.',
          languageCode: res['language_code']?.toString() ??
              widget.activeItinerary?.languageCode ??
              'en-IN',
          stops: (res['stops'] as List)
              .map((s) => ItineraryStop.fromJson(Map<String, dynamic>.from(s)))
              .toList(),
          activeAdvisories: widget.activeItinerary?.activeAdvisories ?? [],
          lastUpdated: res['last_updated']?.toString() ?? DateTime.now().toIso8601String(),
        );

        Navigator.of(context).pop(updatedItinerary);
      } else {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isPatching = false;
          _errorMessage = 'Failed to update route: $e';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not update route: $e')),
        );
      }
    }
  }

  void _handleSecondaryAction() {
    if (isHeritage) {
      // "Skip": just close the page, no patch call, route continues unaffected
      Navigator.of(context).pop();
    } else {
      // "Navigate here": quick one-off navigation
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('📍 Navigating directly to ${place.name}...'),
          backgroundColor: const Color(0xFF0D47A1),
          duration: const Duration(seconds: 2),
        ),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FA),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // Scrollable Content
            Expanded(
              child: CustomScrollView(
                slivers: [
                  // App Bar with Hero Header
                  SliverAppBar(
                    expandedHeight: 220,
                    pinned: true,
                    backgroundColor: const Color(0xFFF6F8FA),
                    elevation: 0,
                    leading: Padding(
                      padding: const EdgeInsets.only(left: 12, top: 8, bottom: 8),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                          boxShadow: const [
                            BoxShadow(color: Colors.black12, blurRadius: 6),
                          ],
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back, color: Color(0xFF0D1B2A), size: 20),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ),
                    ),
                    actions: [
                      Padding(
                        padding: const EdgeInsets.only(top: 8, bottom: 8),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.9),
                            shape: BoxShape.circle,
                            boxShadow: const [
                              BoxShadow(color: Colors.black12, blurRadius: 6),
                            ],
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.share_outlined, color: Color(0xFF0D1B2A), size: 18),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Sharing ${place.name} link...')),
                              );
                            },
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Padding(
                        padding: const EdgeInsets.only(right: 14, top: 8, bottom: 8),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.9),
                            shape: BoxShape.circle,
                            boxShadow: const [
                              BoxShadow(color: Colors.black12, blurRadius: 6),
                            ],
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.more_horiz, color: Color(0xFF0D1B2A), size: 20),
                            onPressed: () {},
                          ),
                        ),
                      ),
                    ],
                    flexibleSpace: FlexibleSpaceBar(
                      background: _buildHeroBanner(),
                    ),
                  ),

                  // Detail Body Cards
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Tags / Badges Row (Screenshot 3)
                          _buildBadgesRow(),
                          const SizedBox(height: 8),

                          // 2. Title & Subtitle
                          Text(
                            place.name,
                            style: const TextStyle(
                              fontSize: 23,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0D1B2A),
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${place.category} • ${place.zoneOrSector ?? 'Zone 4'} • ${place.address ?? 'Panchavati Corridor'}',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 14),

                          // 3. Live Sensor Status Card (Screenshot 3)
                          _buildLiveStatusCard(),
                          const SizedBox(height: 12),

                          // 4. Three-Column Telemetry Stats Cards (Screenshot 3)
                          _buildThreeStatsRow(),
                          const SizedBox(height: 14),

                          // 5. "Why we recommend this" / Significance Card (Screenshot 3)
                          _buildWhyRecommendCard(),
                          const SizedBox(height: 14),

                          // 6. "Crowd trend" Forecast Card (Screenshot 3)
                          _buildCrowdTrendCard(),
                          const SizedBox(height: 14),

                          // 7. "On-site Amenities" Card (Screenshot 3)
                          _buildAmenitiesCard(),
                          if (_alternatives.isNotEmpty) ...[
                            const SizedBox(height: 14),
                            _buildRankedAlternativesSection(),
                          ],
                          const SizedBox(height: 20),

                          if (_errorMessage != null)
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.red.shade200),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline, color: Colors.red),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _errorMessage!,
                                      style: TextStyle(color: Colors.red.shade800, fontSize: 13),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Pinned Bottom Bar (Screenshot 3)
            _buildPinnedBottomBar(bottomInset),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // UI BUILDER METHODS (Faithfully matching Screenshot 3)
  // -------------------------------------------------------------

  Widget _buildHeroBanner() {
    final gradientColors = isHeritage
        ? [const Color(0xFFE65100), const Color(0xFFFB8C00), const Color(0xFFFFB74D)]
        : [const Color(0xFF00695C), const Color(0xFF00897B), const Color(0xFF4DB6AC)];

    final heroIcon = isHeritage ? Icons.temple_hindu : Icons.restaurant;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 48, 16, 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: Stack(
        children: [
          // Background subtle pattern
          Positioned(
            right: -20,
            bottom: -20,
            child: Icon(
              heroIcon,
              size: 160,
              color: Colors.white.withValues(alpha: 0.18),
            ),
          ),
          Positioned(
            left: 20,
            top: 24,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isHeritage ? 'SACRED HERITAGE' : 'KUMBH CIVIC SERVICE',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  place.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          // Floating Pill Badge: "LOW CROWD" (Screenshot 3)
          Positioned(
            left: 14,
            bottom: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 4),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      color: Color(0xFF2E7D32),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    place.crowdStatus.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF2E7D32),
                      letterSpacing: 0.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadgesRow() {
    return Row(
      children: [
        // Verified Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFFECEFF1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.verified_user_outlined, size: 13, color: Colors.blueGrey.shade700),
              const SizedBox(width: 5),
              Text(
                isHeritage ? 'VERIFIED HERITAGE SITE' : 'VERIFIED PUBLIC FACILITY',
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: Colors.blueGrey.shade800,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),

        // Sector Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFFECEFF1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            place.zoneOrSector?.toUpperCase() ?? 'SECTOR 4',
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: Colors.blueGrey.shade800,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLiveStatusCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: const BoxDecoration(
              color: Color(0xFFE8F5E9),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.access_time_filled, color: Color(0xFF2E7D32), size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      '${place.crowdStatus} •',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: Color(0xFF0D1B2A),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Color(0xFF2E7D32),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  isHeritage
                      ? 'Optimal darshan window right now'
                      : 'Optimal dining window right now',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Updated 30s ago',
                style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
              ),
              const SizedBox(height: 2),
              const Text(
                'Live Sensor Data',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2E7D32),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildThreeStatsRow() {
    return Row(
      children: [
        // 1. Distance Card
        Expanded(
          child: _buildStatBox(
            label: 'DISTANCE',
            mainValue: place.distanceText?.split(' ').first ?? '1.2',
            subValue: 'Kilometers',
            footer: '8 min walk',
            footerColor: const Color(0xFF5D4037),
          ),
        ),
        const SizedBox(width: 10),

        // 2. Supplies / Darshan Card
        Expanded(
          child: _buildStatBox(
            label: isHeritage ? 'DARSHAN' : 'SUPPLIES',
            mainValue: isHeritage ? '15 min' : '1,250',
            subValue: isHeritage ? 'Wait Time' : 'Portions',
            footer: isHeritage ? 'Low Queue' : 'Meals Ready',
            footerColor: const Color(0xFF2E7D32),
          ),
        ),
        const SizedBox(width: 10),

        // 3. Schedule Card
        Expanded(
          child: _buildStatBox(
            label: 'SCHEDULE',
            mainValue: 'OPEN',
            mainValueColor: const Color(0xFF2E7D32),
            subValue: 'Continuous',
            footer: 'Till 11:00 PM',
            footerColor: Colors.grey.shade700,
          ),
        ),
      ],
    );
  }

  Widget _buildStatBox({
    required String label,
    required String mainValue,
    Color? mainValueColor,
    required String subValue,
    required String footer,
    required Color footerColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w700,
              color: Colors.grey.shade500,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            mainValue,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: mainValueColor ?? const Color(0xFF0D1B2A),
            ),
          ),
          Text(
            subValue,
            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 6),
          Text(
            footer,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: footerColor),
          ),
        ],
      ),
    );
  }

  Widget _buildWhyRecommendCard() {
    final reasonText = place.rankingReason ??
        (isHeritage
            ? '40% less crowded than nearest alternative'
            : '5 min away, low crowd, ~5 min wait');

    final bodyText = isHeritage
        ? 'Official Kumbh pilgrim telemetry indicates smooth access and serene prayer conditions. Highly recommended holy darshan point along your route.'
        : 'Command Center telemetry indicates smooth footway transit along Ramp 4 with minimal wait. Verified hygienic Satvik meals ready for pilgrims.';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFE0B2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.auto_awesome, color: Color(0xFFE65100), size: 16),
              ),
              const SizedBox(width: 10),
              const Text(
                'Why we recommend this',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: Color(0xFF0D1B2A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Pill Callout
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.trending_down, size: 18, color: Color(0xFF2E7D32)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    reasonText,
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          Text(
            bodyText,
            style: TextStyle(fontSize: 12.5, color: Colors.grey.shade700, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildCrowdTrendCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Crowd trend',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: Color(0xFF0D1B2A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Currently stable • Low volume',
                    style: TextStyle(fontSize: 12, color: Color(0xFF2E7D32), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'LIVE FORECAST',
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF475569),
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Hourly Bars
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _buildBar(time: '12 PM', height: 26, color: const Color(0xFFCFD8DC)),
              _buildBar(
                time: '02 PM',
                height: 48,
                color: const Color(0xFF1B5E20),
                isCurrent: true,
              ),
              _buildBar(time: '04 PM', height: 32, color: const Color(0xFFA5D6A7)),
              _buildBar(time: '06 PM', height: 62, color: const Color(0xFFFFAB91)), // peak
              _buildBar(time: '08 PM', height: 38, color: const Color(0xFFA5D6A7)),
            ],
          ),
          const SizedBox(height: 12),

          // Warning / advice note
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.amber.shade200),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, size: 16, color: Color(0xFFE65100)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    isHeritage
                        ? 'Peak evening influx expected during Sandhya Arati (06:30 PM). Visit before 05:00 PM for quick darshan.'
                        : 'Peak evening influx expected around 06:30 PM. Visit before 05:00 PM for open seating.',
                    style: TextStyle(fontSize: 11.5, color: Colors.brown.shade800, height: 1.3),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBar({
    required String time,
    required double height,
    required Color color,
    bool isCurrent = false,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isCurrent)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
            margin: const EdgeInsets.only(bottom: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF1B5E20),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text(
              'NOW',
              style: TextStyle(fontSize: 8.5, color: Colors.white, fontWeight: FontWeight.bold),
            ),
          )
        else
          const SizedBox(height: 18),
        Container(
          width: 38,
          height: height,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          time,
          style: TextStyle(
            fontSize: 11,
            color: isCurrent ? const Color(0xFF1B5E20) : Colors.grey.shade600,
            fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildAmenitiesCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'On-site Amenities',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 15,
              color: Color(0xFF0D1B2A),
            ),
          ),
          const SizedBox(height: 12),
          ...place.amenities.map((amenity) => _buildAmenityTile(amenity)),
        ],
      ),
    );
  }

  Widget _buildAmenityTile(PlaceAmenity amenity) {
    IconData icon;
    switch (amenity.iconType) {
      case 'seating':
        icon = Icons.airline_seat_recline_normal;
        break;
      case 'water':
        icon = Icons.water_drop_outlined;
        break;
      case 'food':
        icon = Icons.restaurant;
        break;
      case 'ramp':
        icon = Icons.accessible;
        break;
      case 'shoes':
        icon = Icons.inventory_2_outlined;
        break;
      default:
        icon = Icons.check_circle_outline;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
            ),
            child: Icon(icon, color: const Color(0xFF475569), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  amenity.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13.5,
                    color: Color(0xFF0D1B2A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  amenity.description,
                  style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRankedAlternativesSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Other Ranked Options',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: Color(0xFF0D1B2A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Ranked by real-time queue, distance & crowd level',
                    style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${_alternatives.length} More',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2E7D32),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ..._alternatives.asMap().entries.map((entry) {
            final idx = entry.key + 2;
            final alt = entry.value;

            Color crowdColor = const Color(0xFF2E7D32);
            if (alt.crowdStatus.toLowerCase().contains('high')) {
              crowdColor = const Color(0xFFD32F2F);
            } else if (alt.crowdStatus.toLowerCase().contains('mod') ||
                alt.crowdStatus.toLowerCase().contains('med')) {
              crowdColor = const Color(0xFFF57C00);
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '#$idx',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: Color(0xFF334155),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          alt.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13.5,
                            color: Color(0xFF0D1B2A),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: crowdColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              alt.crowdStatus,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: crowdColor,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '•  ${alt.distanceText ?? 'Nearby'}',
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                            ),
                            if (alt.waitTimeText != null) ...[
                              const SizedBox(width: 8),
                              Text(
                                '•  ${alt.waitTimeText}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey.shade700,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () => _selectAlternative(alt),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0D47A1),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      minimumSize: const Size(60, 34),
                    ),
                    child: const Text(
                      'Select',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildPinnedBottomBar(double bottomInset) {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, bottomInset > 0 ? bottomInset + 8 : 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: isHeritage ? _buildHeritageBottomBar() : _buildFoodUtilityBottomBar(),
    );
  }

  // Heritage POI Bar: "Skip" and prominent "Visit this place"
  Widget _buildHeritageBottomBar() {
    return Row(
      children: [
        // Secondary CTA: "Skip"
        TextButton(
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          onPressed: _handleSecondaryAction,
          child: Text(
            'Skip',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.grey.shade700,
            ),
          ),
        ),
        const SizedBox(width: 10),

        // Primary CTA: "Visit this place"
        Expanded(
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE65100),
              foregroundColor: Colors.white,
              elevation: 4,
              shadowColor: const Color(0xFFE65100).withValues(alpha: 0.4),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: _isPatching ? null : _handlePrimaryAction,
            child: _isPatching
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.directions_walk, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Visit this place',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  // Food / Utility Bar: "Navigate here" and prominent "Add to my route"
  Widget _buildFoodUtilityBottomBar() {
    return Row(
      children: [
        // Secondary CTA: "Navigate here"
        OutlinedButton(
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            side: BorderSide(color: Colors.grey.shade300),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          onPressed: _handleSecondaryAction,
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.navigation_outlined, size: 16, color: Color(0xFF0D47A1)),
              SizedBox(width: 4),
              Text(
                'Navigate here',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0D47A1),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),

        // Primary CTA: "Add to my route"
        Expanded(
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE65100),
              foregroundColor: Colors.white,
              elevation: 4,
              shadowColor: const Color(0xFFE65100).withValues(alpha: 0.4),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: _isPatching ? null : _handlePrimaryAction,
            child: _isPatching
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add_road, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Add to my route',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}
