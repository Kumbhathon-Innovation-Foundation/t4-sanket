import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary — Saffron (from Stitch "Sacred Utility" design system)
  static const Color primary = Color(0xFFA33900);
  static const Color primaryContainer = Color(0xFFCC4900);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onPrimaryContainer = Color(0xFFFFFBFF);
  static const Color primaryFixed = Color(0xFFFFDBCE);
  static const Color primaryFixedDim = Color(0xFFFFB599);

  // Secondary — Marigold Gold
  static const Color secondary = Color(0xFF855300);
  static const Color secondaryContainer = Color(0xFFFEA619);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color onSecondaryContainer = Color(0xFF684000);
  static const Color secondaryFixed = Color(0xFFFFDDB8);
  static const Color secondaryFixedDim = Color(0xFFFFB95F);

  // Tertiary — Sacred Blue (wayfinding, GPS)
  static const Color tertiary = Color(0xFF1D4ED8);
  static const Color tertiaryContainer = Color(0xFF4069F2);
  static const Color onTertiary = Color(0xFFFFFFFF);
  static const Color onTertiaryContainer = Color(0xFFFFFBFF);
  static const Color tertiaryFixed = Color(0xFFDCE1FF);
  static const Color tertiaryFixedDim = Color(0xFFB7C4FF);

  // Error — Crimson (SOS, high-crowd)
  static const Color error = Color(0xFFBA1A1A);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color onErrorContainer = Color(0xFF93000A);

  // Surfaces
  static const Color surface = Color(0xFFFBF8FF);
  static const Color surfaceDim = Color(0xFFDBD9E1);
  static const Color surfaceBright = Color(0xFFFBF8FF);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF5F2FB);
  static const Color surfaceContainer = Color(0xFFEFECF5);
  static const Color surfaceContainerHigh = Color(0xFFEAE7EF);
  static const Color surfaceContainerHighest = Color(0xFFE4E1EA);
  static const Color surfaceVariant = Color(0xFFE4E1EA);

  // On-Surface
  static const Color onSurface = Color(0xFF1B1B21);
  static const Color onSurfaceVariant = Color(0xFF5A4138);
  static const Color onBackground = Color(0xFF1B1B21);
  static const Color background = Color(0xFFFBF8FF);

  // Outline
  static const Color outline = Color(0xFF8E7166);
  static const Color outlineVariant = Color(0xFFE2BFB2);

  // Inverse
  static const Color inverseSurface = Color(0xFF303036);
  static const Color inverseOnSurface = Color(0xFFF2EFF8);
  static const Color inversePrimary = Color(0xFFFFB599);

  // Surface tint
  static const Color surfaceTint = Color(0xFFA73A00);

  // ── Crowd Density Status Colors ──
  static const Color crowdLow = Color(0xFF059669);
  static const Color crowdLowBg = Color(0xFFECFDF5);
  static const Color crowdModerate = Color(0xFFD97706);
  static const Color crowdModerateBg = Color(0xFFFFFBEB);
  static const Color crowdHigh = Color(0xFFDC2626);
  static const Color crowdHighBg = Color(0xFFFEF2F2);

  // ── Semantic Helpers ──
  static const Color saffronAccent = Color(0xFFEA580C);
  static const Color marigoldGold = Color(0xFFF59E0B);
  static const Color sacredBlue = Color(0xFF1D4ED8);
  static const Color templeCharcoal = Color(0xFF1E1E24);
  static const Color riverSand = Color(0xFFFDFBF7);
  static const Color wetSand = Color(0xFFF3EFEA);

  // Helper mappings for Stage 10 crowd color
  static Color fromCrowdColor(String? colorName) {
    switch (colorName?.toLowerCase()) {
      case 'red':
        return crowdHigh;
      case 'yellow':
        return crowdModerate;
      case 'green':
      default:
        return crowdLow;
    }
  }

  static Color fromCrowdLevel(String? level) {
    switch (level?.toLowerCase()) {
      case 'high':
      case 'red':
        return crowdHigh;
      case 'medium':
      case 'moderate':
      case 'yellow':
        return crowdModerate;
      case 'low':
      case 'green':
      default:
        return crowdLow;
    }
  }
}
