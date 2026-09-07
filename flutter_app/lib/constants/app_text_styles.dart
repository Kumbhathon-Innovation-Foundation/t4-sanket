import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTextStyles {
  AppTextStyles._();

  // ── Display ──
  static TextStyle displayLg = GoogleFonts.epilogue(
    fontSize: 44,
    fontWeight: FontWeight.w700,
    height: 52 / 44,
    letterSpacing: -0.02 * 44,
  );

  static TextStyle displayLgMobile = GoogleFonts.epilogue(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 40 / 32,
    letterSpacing: -0.01 * 32,
  );

  // ── Headlines ──
  static TextStyle headlineLg = GoogleFonts.epilogue(
    fontSize: 32,
    fontWeight: FontWeight.w600,
    height: 40 / 32,
    letterSpacing: -0.01 * 32,
  );

  static TextStyle headlineLgMobile = GoogleFonts.epilogue(
    fontSize: 26,
    fontWeight: FontWeight.w600,
    height: 34 / 26,
    letterSpacing: -0.01 * 26,
  );

  static TextStyle headlineMd = GoogleFonts.epilogue(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 32 / 24,
  );

  static TextStyle headlineSm = GoogleFonts.epilogue(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 28 / 20,
  );

  // ── Body ──
  static TextStyle bodyLg = GoogleFonts.plusJakartaSans(
    fontSize: 18,
    fontWeight: FontWeight.w400,
    height: 28 / 18,
  );

  static TextStyle bodyMd = GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 24 / 16,
  );

  static TextStyle bodySm = GoogleFonts.plusJakartaSans(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 20 / 14,
  );

  // ── Labels ──
  static TextStyle labelLg = GoogleFonts.plusJakartaSans(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 20 / 14,
    letterSpacing: 0.02 * 14,
  );

  static TextStyle labelMd = GoogleFonts.plusJakartaSans(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    height: 16 / 12,
    letterSpacing: 0.04 * 12,
  );

  static TextStyle labelSm = GoogleFonts.plusJakartaSans(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    height: 14 / 11,
    letterSpacing: 0.06 * 11,
  );
}
