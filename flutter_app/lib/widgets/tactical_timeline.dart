import 'package:flutter/material.dart';
import '../models/itinerary_models.dart';

class TacticalTimelineWidget extends StatelessWidget {
  final Itinerary itinerary;
  final VoidCallback? onStartAudioNavigation;
  final VoidCallback? onReturnToParking;

  const TacticalTimelineWidget({
    super.key,
    required this.itinerary,
    this.onStartAudioNavigation,
    this.onReturnToParking,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. Ghat Congestion / Optimal Dip Telemetry Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F8E9),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.lightGreen.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Color(0xFF2E7D32),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_circle_outline, color: Colors.white, size: 16),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'OPTIMAL DIP WINDOW • LIVE TELEMETRY',
                    style: TextStyle(
                      color: Color(0xFF2E7D32),
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                '07:15 AM — 08:30 AM',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1B5E20),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Target snan queue wait: <15 mins at Ramkund barrier #2. Low crowd density detected.',
                style: TextStyle(color: Colors.grey.shade800, fontSize: 12),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // 2. Tactical Route Plan Section Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Row(
              children: [
                Icon(Icons.alt_route, size: 18, color: Color(0xFFE65100)),
                SizedBox(width: 6),
                Text(
                  'Tactical Route Plan',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Corridor 4-B Active',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // 3. Step by step timeline
        ...itinerary.stops.asMap().entries.map((entry) {
          final index = entry.key;
          final stop = entry.value;
          final isLast = index == itinerary.stops.length - 1;
          final isWalk = stop.type == 'walk_segment';
          final isParking = stop.type == 'parking';
          final isTransit = stop.type == 'transit_segment';

          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Step Number Circle + Connecting Line
                Column(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isParking
                            ? const Color(0xFF303F9F)
                            : isTransit
                                ? const Color(0xFF00838F)
                                : isWalk
                                    ? const Color(0xFFE65100)
                                    : const Color(0xFF2E7D32),
                        shape: BoxShape.circle,
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                      ),
                      child: Center(
                        child: isTransit
                            ? const Icon(Icons.directions_bus, color: Colors.white, size: 16)
                            : Text(
                                '${stop.order}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                      ),
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2.5,
                          color: Colors.grey.shade300,
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 14),

                // Step Content Details
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              stop.eta ?? '07:00 AM',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: Color(0xFFE65100),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isTransit
                                    ? Colors.teal.shade50
                                    : isWalk
                                        ? Colors.blue.shade50
                                        : isParking
                                            ? Colors.indigo.shade50
                                            : Colors.green.shade50,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                isTransit
                                    ? 'SHUTTLE • ₹${stop.fareEstimate ?? 15}'
                                    : isWalk
                                        ? '${stop.durationMin ?? 15} MIN WALK'
                                        : isParking
                                            ? (stop.zoneType == 'outer'
                                                ? 'OUTER PARKING • ₹${stop.fareEstimate ?? 20}'
                                                : 'INNER PARKING • ₹${stop.fareEstimate ?? 20}')
                                            : 'LOW DENSITY SNAN',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isTransit
                                      ? Colors.teal.shade900
                                      : isWalk
                                          ? Colors.blue.shade900
                                          : isParking
                                              ? Colors.indigo.shade900
                                              : Colors.green.shade900,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isTransit
                              ? 'Govt Shuttle: ${stop.fromLoc ?? 'Outer Lot'} → ${stop.toLoc ?? 'Drop Point'}'
                              : stop.name ?? (isWalk ? 'Walk to ${stop.toLoc}' : 'Holy Visit'),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isTransit
                              ? (stop.note ?? 'Board govt electric feeder shuttle to inner drop point (~${stop.durationMin ?? 12} mins).')
                              : isWalk
                                  ? 'Follow pedestrian pathway. ${stop.poisAlongRoute.length} holy spots along route.'
                                  : isParking
                                      ? (stop.zoneType == 'outer'
                                          ? 'Outer zone parking. Feeder shuttle departs every 5 mins.'
                                          : 'Inner zone parking bay. Walk directly to destination.')
                                      : 'Family-friendly changing cubicles active at ghat.',
                          style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }),

        const SizedBox(height: 12),

        // 4. Hands-Free Navigation Status Bar (Active by default)
        InkWell(
          onTap: onStartAudioNavigation,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)],
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 3))],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: Colors.lightGreenAccent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.headphones, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Hands-Free Voice Active (Tap to Hear)',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const Icon(Icons.volume_up, color: Colors.white, size: 18),
              ],
            ),
          ),
        ),

        // 5. Way Back to Parking Option
        if (onReturnToParking != null) ...[
          const SizedBox(height: 12),
          InkWell(
            onTap: onReturnToParking,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF0D1B2A),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.amber.shade400, width: 1.2),
                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2))],
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.directions_car, color: Colors.amber, size: 20),
                  SizedBox(width: 10),
                  Text(
                    'Way Back to My Parking Lot',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_ios, color: Colors.amber, size: 13),
                ],
              ),
            ),
          ),
        ],

        const SizedBox(height: 24),
      ],
    );
  }
}
