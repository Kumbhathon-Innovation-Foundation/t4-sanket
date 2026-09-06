import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:anubhav_app/models/itinerary_models.dart';
import 'package:anubhav_app/widgets/nearby_carousel.dart';
import 'package:anubhav_app/widgets/tactical_timeline.dart';

void main() {
  group('In-Journey Detour & Way Back to Parking Tests', () {
    testWidgets('NearbyPlacesCarousel triggers onDetourSelected with correct place data', (WidgetTester tester) async {
      NearbyPlaceCardData? selectedDetour;

      final places = [
        const NearbyPlaceCardData(
          id: 'toilet_1',
          name: 'Panchavati Public Toilet Block',
          category: 'Toilet',
          distanceText: '120m away',
          lat: 20.0075,
          lng: 73.7930,
        ),
        const NearbyPlaceCardData(
          id: 'food_1',
          name: 'Annakshetra Food Center',
          category: 'Food',
          distanceText: '150m away',
          lat: 20.0065,
          lng: 73.7910,
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NearbyPlacesCarousel(
              places: places,
              onPlaceSelected: (_) {},
              onDetourSelected: (place) {
                selectedDetour = place;
              },
            ),
          ),
        ),
      );

      // Verify place names and detour buttons are rendered
      expect(find.text('Panchavati Public Toilet Block'), findsOneWidget);
      expect(find.text('Detour Here'), findsNWidgets(2));

      // Tap on the first Detour Here button
      await tester.tap(find.text('Detour Here').first);
      await tester.pump();

      expect(selectedDetour, isNotNull);
      expect(selectedDetour!.id, 'toilet_1');
      expect(selectedDetour!.category, 'Toilet');
    });

    testWidgets('TacticalTimelineWidget renders hands-free active status and Way Back to Parking button', (WidgetTester tester) async {
      bool returnToParkingTapped = false;

      final sampleItin = Itinerary(
        tripId: 'test_trip_101',
        status: 'active',
        languageCode: 'en-IN',
        summaryText: 'Pilgrimage route to Ramkund Ghat',
        lastUpdated: DateTime.now().toIso8601String(),
        stops: [
          ItineraryStop(
            order: 1,
            type: 'parking',
            name: 'Tapovan Outer Parking P1',
            zoneType: 'outer',
            fareEstimate: 20,
            polyline: [
              [73.780, 19.995],
              [73.781, 19.996],
            ],
          ),
          ItineraryStop(
            order: 2,
            type: 'walk_segment',
            name: 'Ramkund Sacred Snan',
            durationMin: 20,
            polyline: [
              [73.781, 19.996],
              [73.792, 20.007],
            ],
          ),
        ],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: TacticalTimelineWidget(
                itinerary: sampleItin,
                onReturnToParking: () {
                  returnToParkingTapped = true;
                },
              ),
            ),
          ),
        ),
      );

      // Verify hands-free active text
      expect(find.text('Hands-Free Voice Active (Tap to Hear)'), findsOneWidget);

      // Verify Way Back to My Parking Lot button is present
      expect(find.text('Way Back to My Parking Lot'), findsOneWidget);

      // Tap on Way Back to My Parking Lot button
      await tester.tap(find.text('Way Back to My Parking Lot'));
      await tester.pump();

      expect(returnToParkingTapped, isTrue);
    });
  });
}
