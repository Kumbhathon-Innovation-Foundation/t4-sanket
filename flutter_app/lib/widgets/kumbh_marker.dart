import 'package:flutter/material.dart';

enum PoiCategory { ghat, temple, medical, toilet, parking, other }

class KumbhMarkerPin extends StatelessWidget {
  final PoiCategory category;
  final String label;
  final String? crowdColor; // 'green', 'yellow', 'red' (Stage 10)
  final VoidCallback? onTap;

  const KumbhMarkerPin({
    super.key,
    required this.category,
    required this.label,
    this.crowdColor,
    this.onTap,
  });

  Color? get _crowdIndicatorColor {
    if (crowdColor == null) return null;
    switch (crowdColor!.toLowerCase()) {
      case 'green':
      case 'low':
        return const Color(0xFF2E7D32); // Low crowd
      case 'yellow':
      case 'medium':
        return const Color(0xFFF57F17); // Medium crowd
      case 'red':
      case 'high':
        return const Color(0xFFD32F2F); // High crowd
      default:
        return const Color(0xFF2E7D32);
    }
  }

  Color get _pinColor {
    switch (category) {
      case PoiCategory.ghat:
        return const Color(0xFF0288D1); // Vibrant blue
      case PoiCategory.temple:
        return const Color(0xFFE65100); // Sacred orange
      case PoiCategory.medical:
        return const Color(0xFFD32F2F); // Red
      case PoiCategory.toilet:
        return const Color(0xFF7B1FA2); // Purple
      case PoiCategory.parking:
        return const Color(0xFF303F9F); // Indigo
      case PoiCategory.other:
        return const Color(0xFF00897B); // Teal
    }
  }

  IconData get _icon {
    switch (category) {
      case PoiCategory.ghat:
        return Icons.waves;
      case PoiCategory.temple:
        return Icons.temple_hindu;
      case PoiCategory.medical:
        return Icons.local_hospital;
      case PoiCategory.toilet:
        return Icons.wc;
      case PoiCategory.parking:
        return Icons.local_parking;
      case PoiCategory.other:
        return Icons.place;
    }
  }

  @override
  Widget build(BuildContext context) {
    final crowdIndicator = _crowdIndicatorColor;

    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: '$label ${crowdColor != null ? "• Crowd: ${crowdColor!.toUpperCase()}" : ""}',
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: _pinColor,
                shape: BoxShape.circle,
                border: Border.all(
                  color: crowdIndicator ?? Colors.white,
                  width: crowdIndicator != null ? 3.0 : 2.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: (crowdIndicator ?? Colors.black26).withValues(alpha: 0.35),
                    blurRadius: crowdIndicator != null ? 8 : 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                _icon,
                color: Colors.white,
                size: 18,
              ),
            ),
            if (crowdIndicator != null)
              Positioned(
                top: -2,
                right: -2,
                child: Container(
                  width: 13,
                  height: 13,
                  decoration: BoxDecoration(
                    color: crowdIndicator,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: const [
                      BoxShadow(color: Colors.black26, blurRadius: 3),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
