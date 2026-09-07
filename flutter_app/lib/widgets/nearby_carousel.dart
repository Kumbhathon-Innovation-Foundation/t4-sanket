import 'package:flutter/material.dart';

class NearbyPlaceCardData {
  final String id;
  final String name;
  final String category;
  final String distanceText;
  final double lat;
  final double lng;

  const NearbyPlaceCardData({
    required this.id,
    required this.name,
    required this.category,
    required this.distanceText,
    required this.lat,
    required this.lng,
  });
}

class NearbyPlacesCarousel extends StatelessWidget {
  final List<NearbyPlaceCardData> places;
  final Function(NearbyPlaceCardData place) onPlaceSelected;
  final Function(NearbyPlaceCardData place)? onDetourSelected;

  const NearbyPlacesCarousel({
    super.key,
    required this.places,
    required this.onPlaceSelected,
    this.onDetourSelected,
  });

  @override
  Widget build(BuildContext context) {
    if (places.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: 165,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: places.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final p = places[index];
          final isTemple = p.category.toLowerCase().contains('temple') || p.category.toLowerCase().contains('heritage');
          final isParking = p.category.toLowerCase().contains('parking');
          final isFood = p.category.toLowerCase().contains('food');
          final isToilet = p.category.toLowerCase().contains('toilet');

          return InkWell(
            onTap: () => onPlaceSelected(p),
            borderRadius: BorderRadius.circular(18),
            child: Container(
              width: 175,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon Avatar + Distance badge row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: isTemple
                              ? const Color(0xFFFFE0B2)
                              : isParking
                                  ? const Color(0xFFFFCCBC)
                                  : isFood
                                      ? const Color(0xFFE8F5E9)
                                      : isToilet
                                          ? const Color(0xFFEFEBE9)
                                          : const Color(0xFFE1F5FE),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isTemple
                              ? Icons.temple_hindu
                              : isParking
                                  ? Icons.directions_car
                                  : isFood
                                      ? Icons.restaurant
                                      : isToilet
                                          ? Icons.wc
                                          : Icons.water,
                          color: isTemple
                              ? const Color(0xFFE65100)
                              : isParking
                                  ? const Color(0xFFD84315)
                                  : isFood
                                      ? const Color(0xFF2E7D32)
                                      : isToilet
                                          ? const Color(0xFF5D4037)
                                          : const Color(0xFF0288D1),
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            p.distanceText,
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                            style: const TextStyle(
                              color: Color(0xFFE65100),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Name
                  Text(
                    p.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12.5,
                    ),
                  ),
                  const SizedBox(height: 2),
                  // Category
                  Text(
                    p.category,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Detour Button
                  if (onDetourSelected != null)
                    SizedBox(
                      width: double.infinity,
                      child: InkWell(
                        onTap: () => onDetourSelected!(p),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE65100),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.alt_route, color: Colors.white, size: 12),
                              SizedBox(width: 4),
                              Text(
                                'Detour Here',
                                style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
