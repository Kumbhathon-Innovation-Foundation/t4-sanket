import 'itinerary_models.dart';

enum PlaceContentType {
  heritage,
  foodUtility,
}

class PlaceAmenity {
  final String title;
  final String description;
  final String iconType; // 'seating', 'water', 'food', 'medical', 'parking', 'ramp', 'shoes'

  const PlaceAmenity({
    required this.title,
    required this.description,
    required this.iconType,
  });
}

class PlaceDetailData {
  final String id;
  final String name;
  final String category; // 'Temple', 'Ghat', 'Food', 'Medical', 'Toilets', 'Parking'
  final PlaceContentType contentType;
  final double lat;
  final double lng;
  final String? address;
  final double? rating;
  final int? reviewCount;
  final String? openingHours;
  final String? description;
  final double? distanceMeters;
  final String? distanceText;
  final String? rankingReason; // from rank_by_experience e.g. "5 min away, low crowd, ~5 min wait"
  final String crowdStatus; // "Low Crowd", "Moderate Crowd", "High Crowd"
  final String? waitTimeText; // e.g. "15 min wait", "Meals Ready"
  final String? supplyPortions; // e.g. "1,250 Portions"
  final String? scheduleText; // e.g. "Continuous Till 11:00 PM", "Open 06:00 AM - 09:00 PM"
  final String? contactPhone;
  final String? zoneOrSector;
  final List<PlaceAmenity> amenities;
  final Map<String, dynamic>? rawData;

  const PlaceDetailData({
    required this.id,
    required this.name,
    required this.category,
    required this.contentType,
    required this.lat,
    required this.lng,
    this.address,
    this.rating,
    this.reviewCount,
    this.openingHours,
    this.description,
    this.distanceMeters,
    this.distanceText,
    this.rankingReason,
    this.crowdStatus = 'Low Crowd',
    this.waitTimeText,
    this.supplyPortions,
    this.scheduleText,
    this.contactPhone,
    this.zoneOrSector,
    this.amenities = const [],
    this.rawData,
  });

  /// Factory from PoiAlongRoute (heritage encounter during walk)
  factory PlaceDetailData.fromPoiAlongRoute(
    PoiAlongRoute poi, {
    double lat = 20.0068,
    double lng = 73.7919,
    double? userLat,
    double? userLng,
  }) {
    return PlaceDetailData(
      id: poi.poiId.isNotEmpty ? poi.poiId : 'poi_heritage',
      name: poi.name,
      category: 'Temple',
      contentType: PlaceContentType.heritage,
      lat: lat,
      lng: lng,
      address: poi.shortDescription.isNotEmpty
          ? poi.shortDescription
          : 'Panchavati Sacred Corridor, Nashik',
      rating: 4.8,
      reviewCount: 1420,
      openingHours: '06:00 AM – 09:30 PM (Daily)',
      description:
          'A sacred landmark on the Godavari pilgrimage corridor. Revered by pilgrims for holy darshan, heritage stone architecture, and serene spiritual ambience during the Nashik Kumbh Mela.',
      rankingReason: 'On your ${poi.side} (~${poi.triggerDistanceM}m), serene darshan window',
      crowdStatus: 'Low Crowd',
      waitTimeText: '15 min Darshan',
      scheduleText: 'Open Continuous',
      zoneOrSector: 'Zone 2 • Panchavati',
      distanceText: '~${poi.triggerDistanceM}m walk',
      amenities: const [
        PlaceAmenity(
          title: 'Wheelchair & Elder Access',
          description: 'Step-free ramp access and dedicated queue for senior citizens.',
          iconType: 'ramp',
        ),
        PlaceAmenity(
          title: 'Potable Jal Seva',
          description: 'Municipal RO continuous purified drinking water taps.',
          iconType: 'water',
        ),
        PlaceAmenity(
          title: 'Paduka Seva & Safe Locker',
          description: 'Free managed footwear deposit stand and luggage cubicles.',
          iconType: 'shoes',
        ),
      ],
      rawData: {'poi_along_route': poi.poiId},
    );
  }

  /// Factory from Map / Supabase item
  factory PlaceDetailData.fromSupabaseItem(
    Map<String, dynamic> item, {
    required String category,
  }) {
    final lat = (item['lat'] as num?)?.toDouble() ?? 20.0077;
    final lng = (item['lng'] as num?)?.toDouble() ?? 73.7926;
    final name = item['name']?.toString() ?? 'Nashik Kumbh Location';
    final id = item['id']?.toString() ?? name.toLowerCase().replaceAll(' ', '_');

    final isHeritage = category.toLowerCase() == 'temple' ||
        category.toLowerCase() == 'temples' ||
        category.toLowerCase() == 'ghat' ||
        category.toLowerCase() == 'ghats';

    final rating = (item['rating'] as num?)?.toDouble() ?? (isHeritage ? 4.8 : 4.4);
    final reviewCount = (item['review_count'] as num?)?.toInt() ?? 850;
    final address = item['address']?.toString() ?? 'Panchavati, Nashik';
    final openingHours = item['opening_hours']?.toString() ?? 'Open 05:30 AM – 10:00 PM';
    final crowd = item['current_crowd_level_SYNTH']?.toString() ?? 'low';
    final crowdFormatted = crowd.toLowerCase() == 'high'
        ? 'High Crowd'
        : (crowd.toLowerCase() == 'medium' ? 'Moderate Crowd' : 'Low Crowd');

    final waitMin = item['queue_wait_minutes_SYNTH'] ?? item['avg_visit_minutes'] ?? 10;

    List<PlaceAmenity> amenities;
    if (isHeritage) {
      amenities = const [
        PlaceAmenity(
          title: 'Elder & Divyang Access',
          description: 'Ramp corridor with volunteer assistance and battery cart transit.',
          iconType: 'ramp',
        ),
        PlaceAmenity(
          title: 'Continuous Jal Seva',
          description: 'Municipal RO purified clean drinking water points.',
          iconType: 'water',
        ),
        PlaceAmenity(
          title: 'Shoe Deposit & Prasaad Counter',
          description: 'Managed paduka lockers and official sanctum prasaad stall.',
          iconType: 'shoes',
        ),
      ];
    } else {
      amenities = const [
        PlaceAmenity(
          title: 'Communal & Elder Seating',
          description: 'Clean stainless steel benches, step-free ramps, and priority seating.',
          iconType: 'seating',
        ),
        PlaceAmenity(
          title: 'Water & Handwash Stations',
          description: 'Municipal continuous drinking taps and touchless handwash bays.',
          iconType: 'water',
        ),
        PlaceAmenity(
          title: 'Satvik Seva Meal / Service',
          description: 'Freshly prepared, hygienic meals served in adherence to Kumbh standards.',
          iconType: 'food',
        ),
      ];
    }

    return PlaceDetailData(
      id: id,
      name: name,
      category: category,
      contentType: isHeritage ? PlaceContentType.heritage : PlaceContentType.foodUtility,
      lat: lat,
      lng: lng,
      address: address,
      rating: rating,
      reviewCount: reviewCount,
      openingHours: openingHours,
      description: isHeritage
          ? 'An auspicious pilgrimage stop along the sacred Godavari Goda Ghats. Millions congregate here for snan and holy rituals.'
          : 'Verified Kumbh Mela public service centre operated under NTKMA civic mobility plan.',
      rankingReason: item['ranking_reason']?.toString() ??
          '~${waitMin}m wait, $crowdFormatted, smooth approach transit',
      crowdStatus: crowdFormatted,
      waitTimeText: '~$waitMin min wait',
      supplyPortions: isHeritage ? '1,500 Capacity' : '1,250 Portions Ready',
      scheduleText: 'Open Continuous Till 11:00 PM',
      contactPhone: item['phone']?.toString(),
      zoneOrSector: item['zone']?.toString() ?? 'Sector 4 • Godavari Zone',
      amenities: amenities,
      rawData: item,
    );
  }

  /// Factory from NearbyItem (from one-tap utility / rank_by_experience)
  factory PlaceDetailData.fromNearbyItem(NearbyItem item) {
    final isHeritage = item.category.toLowerCase() == 'temple' ||
        item.category.toLowerCase() == 'temples' ||
        item.category.toLowerCase() == 'ghat' ||
        item.category.toLowerCase() == 'ghats';

    final crowd = item.crowdLevel?.toLowerCase() ?? 'low';
    final crowdFormatted = crowd == 'high'
        ? 'High Crowd'
        : (crowd == 'medium' ? 'Moderate Crowd' : 'Low Crowd');

    final waitMin = item.waitTimeMinutes ?? 5;
    final distText = item.distanceText ??
        (item.distanceMeters != null
            ? (item.distanceMeters! >= 1000
                ? '${(item.distanceMeters! / 1000).toStringAsFixed(1)} km'
                : '${item.distanceMeters!.round()} m')
            : 'Nearby');

    final catLower = item.category.toLowerCase();
    final isToilet = catLower.contains('toilet') || catLower.contains('washroom');
    final isMedical = catLower.contains('medical') || catLower.contains('clinic') || catLower.contains('hospital');
    final isWater = catLower.contains('water') || catLower.contains('jal');

    List<PlaceAmenity> amenities;
    if (isHeritage) {
      amenities = const [
        PlaceAmenity(
          title: 'Elder & Divyang Access',
          description: 'Ramp corridor with volunteer assistance and battery cart transit.',
          iconType: 'ramp',
        ),
        PlaceAmenity(
          title: 'Continuous Jal Seva',
          description: 'Municipal RO purified clean drinking water points.',
          iconType: 'water',
        ),
        PlaceAmenity(
          title: 'Shoe Deposit & Prasaad Counter',
          description: 'Managed paduka lockers and official sanctum prasaad stall.',
          iconType: 'shoes',
        ),
      ];
    } else if (isToilet) {
      amenities = const [
        PlaceAmenity(
          title: 'Hygiene Sanitization Crew',
          description: 'Disinfected every 15 minutes by Nashik Municipal sanitation staff.',
          iconType: 'seating',
        ),
        PlaceAmenity(
          title: 'Running Water & Handwash',
          description: 'Continuous 24x7 pressurized tap water and antiseptic soap dispensers.',
          iconType: 'water',
        ),
        PlaceAmenity(
          title: 'Accessible Elder Stall',
          description: 'Wide entrance with safety handrails and zero-step ramp access.',
          iconType: 'ramp',
        ),
      ];
    } else if (isMedical) {
      amenities = const [
        PlaceAmenity(
          title: 'First Aid & Emergency Triage',
          description: 'Staffed by certified medical officers with oxygen, ORS and dressings.',
          iconType: 'food',
        ),
        PlaceAmenity(
          title: 'Free Essential Medication',
          description: 'Government distributed medicines, pain relief and dehydration packs.',
          iconType: 'seating',
        ),
        PlaceAmenity(
          title: 'Direct Ambulance Bay',
          description: 'Dedicated clear-corridor access to Nashik Civil Hospital.',
          iconType: 'ramp',
        ),
      ];
    } else if (isWater) {
      amenities = const [
        PlaceAmenity(
          title: 'Continuous 4-Stage RO Water',
          description: 'Certified safe drinking water with chiller and high-flow nozzles.',
          iconType: 'water',
        ),
        PlaceAmenity(
          title: 'Eco Bottle Refill Points',
          description: 'Multiple automated contactless taps to prevent bottle crowding.',
          iconType: 'seating',
        ),
        PlaceAmenity(
          title: 'Priority Elder Line',
          description: 'Volunteer assisted dispensing queue for seniors and small children.',
          iconType: 'ramp',
        ),
      ];
    } else {
      amenities = const [
        PlaceAmenity(
          title: 'Hygienic Satvik Food',
          description: 'Fresh warm nutritious meals served round the clock.',
          iconType: 'food',
        ),
        PlaceAmenity(
          title: 'Clean Seating Area',
          description: 'Shaded dining canopy with sanitized tables and drinking water.',
          iconType: 'seating',
        ),
        PlaceAmenity(
          title: 'Step-Free Ramp Entry',
          description: 'Wheelchair and stroller friendly ingress path.',
          iconType: 'ramp',
        ),
      ];
    }

    return PlaceDetailData(
      id: item.id,
      name: item.name,
      category: item.category,
      contentType: isHeritage ? PlaceContentType.heritage : PlaceContentType.foodUtility,
      lat: item.lat,
      lng: item.lng,
      distanceMeters: item.distanceMeters,
      distanceText: distText,
      rankingReason: item.recommendationReason ??
          '~${waitMin}m wait, $crowdFormatted, $distText away',
      crowdStatus: crowdFormatted,
      waitTimeText: '~$waitMin min wait',
      supplyPortions: item.category.toLowerCase() == 'food' ? '1,200 Meals Ready' : 'Operational',
      scheduleText: 'Open 24x7 Continuous',
      zoneOrSector: item.raw['zone']?.toString() ?? 'Nashik Kumbh Zone',
      rating: 4.6,
      reviewCount: 320,
      openingHours: 'Open 24x7 Continuous',
      amenities: amenities,
      rawData: item.raw,
    );
  }
}
