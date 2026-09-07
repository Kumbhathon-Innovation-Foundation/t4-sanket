import 'dart:math' as math;
import 'package:flutter/material.dart';

class KumbhUserLocationMarker extends StatefulWidget {
  final double? heading;
  final bool isSimulated;

  const KumbhUserLocationMarker({
    super.key,
    this.heading,
    this.isSimulated = false,
  });

  @override
  State<KumbhUserLocationMarker> createState() => _KumbhUserLocationMarkerState();
}

class _KumbhUserLocationMarkerState extends State<KumbhUserLocationMarker>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();
    _pulseAnimation = CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final coreColor = widget.isSimulated ? const Color(0xFFE65100) : const Color(0xFF0288D1);

    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Stack(
          alignment: Alignment.center,
          children: [
            // Expanding pulse halo
            Container(
              width: 46 * (1.0 + _pulseAnimation.value * 0.4),
              height: 46 * (1.0 + _pulseAnimation.value * 0.4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: coreColor.withValues(alpha: (1.0 - _pulseAnimation.value) * 0.35),
              ),
            ),

            // Core Pin
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: coreColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2.8),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black38,
                    blurRadius: 6,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: widget.heading != null
                  ? Transform.rotate(
                      angle: (widget.heading! * math.pi) / 180.0,
                      child: const Icon(Icons.navigation, color: Colors.white, size: 16),
                    )
                  : Icon(
                      widget.isSimulated ? Icons.directions_walk : Icons.my_location,
                      color: Colors.white,
                      size: 16,
                    ),
            ),
          ],
        );
      },
    );
  }
}
