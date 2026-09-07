import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_strings.dart';
import '../../constants/app_text_styles.dart';
import '../../models/itinerary_models.dart';
import '../../models/place_detail_model.dart';
import '../../models/route_data.dart';
import '../../providers/route_provider.dart';
import '../../providers/location_provider.dart';
import '../../screens/place_detail_screen.dart';
import '../../widgets/route_card.dart';
import '../../widgets/warning_banner.dart';
import '../../widgets/simulation_toolbar.dart';
import '../../widgets/user_location_marker.dart';

class RouteScreen extends StatefulWidget {
  const RouteScreen({super.key});

  @override
  State<RouteScreen> createState() => _RouteScreenState();
}

class _RouteScreenState extends State<RouteScreen> {
  final TextEditingController _originCtrl = TextEditingController(text: 'Current Location');
  final TextEditingController _destCtrl = TextEditingController(text: 'Ramkund');
  final MapController _mapController = MapController();

  @override
  void dispose() {
    _originCtrl.dispose();
    _destCtrl.dispose();
    super.dispose();
  }

  void _searchRoute() {
    final origin = _originCtrl.text.trim();
    final dest = _destCtrl.text.trim();
    if (dest.isEmpty) return;

    final provider = context.read<RouteProvider>();
    final modeStr = provider.selectedMode.name;
    final prompt = 'Plan pilgrimage from $origin to $dest by $modeStr';
    provider.fetchItinerary(message: prompt);
  }

  void _openPoi(PoiAlongRoute poi) {
    final place = PlaceDetailData.fromPoiAlongRoute(poi);
    final routeProvider = context.read<RouteProvider>();
    final locProvider = context.read<LocationProvider>();
    final pos = locProvider.currentLocation ?? const LatLng(20.0077, 73.7926);

    PlaceDetailPage.open(
      context,
      place: place,
      activeItinerary: routeProvider.itinerary,
      userPosition: pos,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Consumer2<RouteProvider, LocationProvider>(
          builder: (context, routeProvider, locProvider, child) {
            final itinerary = routeProvider.itinerary;
            final activeRoute = routeProvider.selectedRoute;
            final userPos = routeProvider.isSimulating && routeProvider.simulatedLocation != null
                ? routeProvider.simulatedLocation!
                : (locProvider.currentLocation ?? const LatLng(20.0077, 73.7926));

            // Generate segmented crowd-colored polylines (Stage 10)
            final polylines = <Polyline>[];
            if (itinerary != null && itinerary.stops.isNotEmpty) {
              for (final stop in itinerary.stops) {
                if (stop.polyline.isNotEmpty) {
                  final pts = stop.polyline
                      .where((p) => p.length >= 2)
                      .map((p) => LatLng(p[0], p[1]))
                      .toList();
                  if (pts.length >= 2) {
                    final color = AppColors.fromCrowdColor(stop.crowdColor);
                    polylines.add(
                      Polyline(
                        points: pts,
                        color: color,
                        strokeWidth: 5.5,
                      ),
                    );
                  }
                }
              }
            } else if (activeRoute != null && activeRoute.polylinePoints.isNotEmpty) {
              polylines.add(
                Polyline(
                  points: activeRoute.polylinePoints,
                  color: AppColors.primary,
                  strokeWidth: 5.0,
                ),
              );
            }

            // Generate POI markers with crowd color tint (Stage 10)
            final poiMarkers = <Marker>[];
            if (itinerary != null) {
              for (final stop in itinerary.stops) {
                for (final poi in stop.poisAlongRoute) {
                  final pColor = AppColors.fromCrowdColor(poi.crowdColor);
                  final coords = stop.polyline.isNotEmpty
                      ? LatLng(stop.polyline.first[0], stop.polyline.first[1])
                      : const LatLng(20.0077, 73.7926);

                  poiMarkers.add(
                    Marker(
                      point: coords,
                      width: 50,
                      height: 50,
                      child: GestureDetector(
                        onTap: () => _openPoi(poi),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                              decoration: BoxDecoration(
                                color: pColor,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                poi.name.length > 8 ? '${poi.name.substring(0, 7)}…' : poi.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Icon(Icons.location_on, color: pColor, size: 28),
                          ],
                        ),
                      ),
                    ),
                  );
                }
              }
            }

            return Column(
              children: [
                // Header Search & Mode Area
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Column(
                            children: [
                              const Icon(Icons.my_location, size: 20, color: AppColors.tertiary),
                              Container(width: 2, height: 20, color: AppColors.surfaceDim),
                              const Icon(Icons.location_on, size: 20, color: AppColors.primary),
                            ],
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              children: [
                                TextField(
                                  controller: _originCtrl,
                                  decoration: InputDecoration(
                                    hintText: AppStrings.routeStartingPoint.tr(),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: BorderSide.none,
                                    ),
                                    filled: true,
                                    fillColor: AppColors.surfaceContainerLow,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _destCtrl,
                                  onSubmitted: (_) => _searchRoute(),
                                  decoration: InputDecoration(
                                    hintText: AppStrings.routeDestination.tr(),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: BorderSide.none,
                                    ),
                                    filled: true,
                                    fillColor: AppColors.surfaceContainerLow,
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    suffixIcon: IconButton(
                                      icon: const Icon(Icons.search, color: AppColors.primary),
                                      onPressed: _searchRoute,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Travel Modes
                      Row(
                        children: [
                          _ModeChip(
                            icon: Icons.directions_walk,
                            label: AppStrings.routeWalk.tr(),
                            isSelected: routeProvider.selectedMode == TravelMode.walk,
                            onTap: () => routeProvider.setMode(TravelMode.walk),
                          ),
                          const SizedBox(width: 8),
                          _ModeChip(
                            icon: Icons.directions_bus,
                            label: AppStrings.routeShuttle.tr(),
                            isSelected: routeProvider.selectedMode == TravelMode.shuttle,
                            onTap: () => routeProvider.setMode(TravelMode.shuttle),
                          ),
                          const SizedBox(width: 8),
                          _ModeChip(
                            icon: Icons.electric_rickshaw,
                            label: AppStrings.routeRickshaw.tr(),
                            isSelected: routeProvider.selectedMode == TravelMode.rickshaw,
                            onTap: () => routeProvider.setMode(TravelMode.rickshaw),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Map and Overlay
                Expanded(
                  child: Stack(
                    children: [
                      FlutterMap(
                        mapController: _mapController,
                        options: MapOptions(
                          initialCenter: userPos,
                          initialZoom: 15.0,
                        ),
                        children: [
                          TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
                          PolylineLayer(polylines: polylines),
                          MarkerLayer(markers: poiMarkers),
                          MarkerLayer(
                            markers: [
                              Marker(
                                point: userPos,
                                width: 36,
                                height: 36,
                                child: KumbhUserLocationMarker(
                                  heading: routeProvider.simulatedHeading,
                                  isSimulated: routeProvider.isSimulating,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      // Proximity Alert Banner (Stage 8)
                      if (routeProvider.activeProximityPoi != null)
                        Positioned(
                          top: 12,
                          left: 16,
                          right: 16,
                          child: Material(
                            elevation: 6,
                            borderRadius: BorderRadius.circular(12),
                            color: AppColors.secondaryFixed,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              child: Row(
                                children: [
                                  const Icon(Icons.near_me, color: AppColors.primary),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Nearby: ${routeProvider.activeProximityPoi!.name}',
                                          style: AppTextStyles.labelLg.copyWith(color: AppColors.primary),
                                        ),
                                        Text(
                                          'On your ${routeProvider.activeProximityPoi!.side} • ${routeProvider.activeProximityPoi!.triggerDistanceM}m away',
                                          style: AppTextStyles.bodySm,
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.close, size: 20),
                                    onPressed: () => routeProvider.dismissProximityAlert(),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                      // Simulation Toolbar (Stage 6)
                      if (routeProvider.isSimulating)
                        Positioned(
                          top: routeProvider.activeProximityPoi != null ? 80 : 12,
                          left: 16,
                          right: 16,
                          child: SimulationToolbar(
                            isPlaying: routeProvider.isSimulating,
                            speedMultiplier: routeProvider.simulationSpeedMultiplier,
                            progressFraction: routeProvider.allRouteCoordinates.isEmpty
                                ? 0.0
                                : (routeProvider.simulatedStep / (routeProvider.allRouteCoordinates.length - 1)).clamp(0.0, 1.0),
                            currentStep: routeProvider.simulatedStep.toInt() + 1,
                            totalSteps: routeProvider.allRouteCoordinates.length,
                            onTogglePlay: () {
                              if (routeProvider.isSimulating) {
                                routeProvider.pauseSimulation();
                              } else {
                                routeProvider.startSimulation();
                              }
                            },
                            onReset: () => routeProvider.resetSimulation(),
                            onClose: () => routeProvider.pauseSimulation(),
                            onSpeedChanged: (s) => routeProvider.setSimulationSpeed(s),
                          ),
                        ),

                      // Return-to-Parking Banner (Stage 9)
                      if (routeProvider.showReturnToParkingBanner)
                        Positioned(
                          top: 12,
                          left: 16,
                          right: 16,
                          child: Material(
                            elevation: 8,
                            borderRadius: BorderRadius.circular(12),
                            color: AppColors.primaryFixed,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              child: Row(
                                children: [
                                  const Icon(Icons.local_parking, color: AppColors.primary, size: 28),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Destination Reached 🎉',
                                          style: AppTextStyles.labelLg.copyWith(color: AppColors.primary),
                                        ),
                                        const Text('Ready to return to your parking spot?'),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                    ),
                                    onPressed: () {
                                      _destCtrl.text = 'Panchavati Parking';
                                      _searchRoute();
                                    },
                                    child: const Text('Way Back'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                      // Route Cards Bottom Sheet Overlay
                      Align(
                        alignment: Alignment.bottomCenter,
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                            boxShadow: [
                              BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, -4)),
                            ],
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              WarningBanner(message: AppStrings.routeCongested.tr()),
                              const SizedBox(height: 12),

                              // Render Route Cards
                              ...routeProvider.routes.map(
                                (r) => RouteCard(
                                  route: r,
                                  isSelected: r.id == routeProvider.selectedRoute?.id,
                                  onTap: () => routeProvider.selectRoute(r),
                                ),
                              ),

                              const SizedBox(height: 8),

                              // Start Nav CTA
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    if (routeProvider.isSimulating) {
                                      routeProvider.pauseSimulation();
                                    } else {
                                      routeProvider.startSimulation();
                                    }
                                  },
                                  icon: Icon(
                                    routeProvider.isSimulating ? Icons.pause : Icons.navigation,
                                    color: Colors.white,
                                  ),
                                  label: Text(
                                    routeProvider.isSimulating
                                        ? 'Pause Navigation'
                                        : AppStrings.routeStartNav.tr(),
                                    style: AppTextStyles.labelLg.copyWith(color: Colors.white),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                AppStrings.routeOfflineVoice.tr(),
                                style: AppTextStyles.bodySm.copyWith(
                                  color: AppColors.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ModeChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ModeChip({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryContainer : AppColors.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isSelected ? AppColors.primaryContainer : AppColors.outlineVariant,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 18,
                color: isSelected ? AppColors.onPrimaryContainer : AppColors.onSurfaceVariant,
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: AppTextStyles.labelMd.copyWith(
                  color: isSelected ? AppColors.onPrimaryContainer : AppColors.onSurfaceVariant,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
