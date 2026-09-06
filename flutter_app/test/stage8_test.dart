import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:anubhav_app/models/itinerary_models.dart';
import 'package:anubhav_app/models/place_detail_model.dart';
import 'package:anubhav_app/screens/place_detail_screen.dart';

void main() {
  group('Stage 8 — POI Detail Page & Data Models', () {
    test('PlaceDetailData.fromPoiAlongRoute maps fields accurately', () {
      final poi = PoiAlongRoute(
        poiId: 'kalaram_temple',
        name: 'Kalaram Sansthan Temple',
        side: 'left',
        triggerDistanceM: 40,
        shortDescription: 'Historic black stone temple dedicated to Lord Rama',
      );

      final detail = PlaceDetailData.fromPoiAlongRoute(poi);

      expect(detail.id, equals('kalaram_temple'));
      expect(detail.name, equals('Kalaram Sansthan Temple'));
      expect(detail.contentType, equals(PlaceContentType.heritage));
      expect(detail.category, equals('Temple'));
      expect(detail.amenities.length, greaterThanOrEqualTo(3));
      expect(detail.crowdStatus, equals('Low Crowd'));
    });

    test('PlaceDetailData.fromSupabaseItem maps food and utility correctly', () {
      final foodMap = {
        'id': 'annakshetra_p4',
        'name': 'Community Food Centre',
        'category': 'Food',
        'lat': 20.0055,
        'lng': 73.7940,
        'address': 'Near Sangam Marg, Zone 4',
        'current_crowd_level_SYNTH': 'low',
        'queue_wait_minutes_SYNTH': 5,
        'ranking_reason': '5 min away, low crowd, ~5 min wait',
      };

      final detail = PlaceDetailData.fromSupabaseItem(foodMap, category: 'Food');

      expect(detail.id, equals('annakshetra_p4'));
      expect(detail.contentType, equals(PlaceContentType.foodUtility));
      expect(detail.rankingReason, contains('5 min away'));
      expect(detail.amenities.any((a) => a.iconType == 'food'), isTrue);
    });

    testWidgets('PlaceDetailPage displays heritage cards and CTAs', (WidgetTester tester) async {
      final poi = PoiAlongRoute(
        poiId: 'kalaram_temple',
        name: 'Kalaram Temple',
        side: 'left',
        triggerDistanceM: 50,
      );
      final place = PlaceDetailData.fromPoiAlongRoute(poi);

      await tester.pumpWidget(
        MaterialApp(
          home: PlaceDetailPage(place: place),
        ),
      );
      await tester.pumpAndSettle();

      // Check title and badges
      expect(find.text('Kalaram Temple'), findsNWidgets(2)); // in header & title
      expect(find.text('VERIFIED HERITAGE SITE'), findsOneWidget);
      expect(find.text('LOW CROWD'), findsOneWidget);

      // Check cards
      expect(find.text('Why we recommend this'), findsOneWidget);
      expect(find.text('Crowd trend'), findsOneWidget);
      expect(find.text('On-site Amenities'), findsOneWidget);

      // Check Heritage CTAs
      expect(find.text('Visit this place'), findsOneWidget);
      expect(find.text('Skip'), findsOneWidget);

      // Tap Skip -> closes page
      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();
    });

    testWidgets('PlaceDetailPage displays food/utility CTAs', (WidgetTester tester) async {
      final foodMap = {
        'id': 'food_centre',
        'name': 'Community Food Centre',
        'category': 'Food',
        'lat': 20.0055,
        'lng': 73.7940,
        'current_crowd_level_SYNTH': 'low',
      };
      final place = PlaceDetailData.fromSupabaseItem(foodMap, category: 'Food');

      await tester.pumpWidget(
        MaterialApp(
          home: PlaceDetailPage(place: place),
        ),
      );
      await tester.pumpAndSettle();

      // Check Food/Utility CTAs
      expect(find.text('Add to my route'), findsOneWidget);
      expect(find.text('Navigate here'), findsOneWidget);
    });
  });
}
