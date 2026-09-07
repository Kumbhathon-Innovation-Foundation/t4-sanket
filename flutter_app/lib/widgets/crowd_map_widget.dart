import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/crowd_data.dart';
import '../providers/crowd_provider.dart';
import '../providers/location_provider.dart';

class CrowdMapWidget extends StatelessWidget {
  const CrowdMapWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<LocationProvider, CrowdProvider>(
      builder: (context, locationProvider, crowdProvider, child) {
        final center = locationProvider.currentLocation ?? const LatLng(19.9975, 73.7898);
        final summary = crowdProvider.summary;

        return FlutterMap(
          options: MapOptions(
            initialCenter: center,
            initialZoom: 14.5,
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
            ),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.example.anubhav',
              // Use grayscale or custom styling in production
            ),
            if (summary != null)
              MarkerLayer(
                markers: summary.zones.map((zone) {
                  // Approximate coordinates for Nashik zones for demo
                  LatLng pos;
                  switch (zone.zoneId) {
                    case 'ramkund': pos = const LatLng(20.003, 73.791); break;
                    case 'trimbakeshwar': pos = const LatLng(19.932, 73.530); break;
                    case 'kushavarta': pos = const LatLng(19.931, 73.531); break;
                    case 'sita_gufa': pos = const LatLng(20.006, 73.795); break;
                    case 'panchavati': pos = const LatLng(20.008, 73.793); break;
                    default: pos = center;
                  }

                  Color color;
                  switch (zone.level) {
                    case CrowdLevel.high: color = AppColors.error; break;
                    case CrowdLevel.moderate: color = AppColors.secondaryContainer; break;
                    case CrowdLevel.low: color = AppColors.crowdLow; break;
                  }

                  return Marker(
                    point: pos,
                    width: 60,
                    height: 60,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: color,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${(zone.count / 1000).toStringAsFixed(0)}k',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                        Icon(Icons.location_on, color: color, size: 32),
                      ],
                    ),
                  );
                }).toList(),
              ),
            if (locationProvider.currentLocation != null)
              MarkerLayer(
                markers: [
                  Marker(
                    point: locationProvider.currentLocation!,
                    width: 24,
                    height: 24,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.tertiary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.tertiary.withValues(alpha: 0.4),
                            blurRadius: 10,
                            spreadRadius: 4,
                          )
                        ],
                      ),
                    ),
                  ),
                ],
              ),
          ],
        );
      },
    );
  }
}
