import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_strings.dart';
import '../constants/app_text_styles.dart';
import '../models/place_detail_model.dart';
import '../providers/location_provider.dart';
import '../providers/route_provider.dart';
import '../screens/place_detail_screen.dart';
import '../services/api_service.dart';

class ShortcutIcons extends StatefulWidget {
  const ShortcutIcons({super.key});

  @override
  State<ShortcutIcons> createState() => _ShortcutIconsState();
}

class _ShortcutIconsState extends State<ShortcutIcons> {
  final ApiService _apiService = ApiService();
  String? _activeLoadingCategory;

  Future<void> _handleShortcutTap(String category, String label) async {
    setState(() => _activeLoadingCategory = category);

    final messenger = ScaffoldMessenger.of(context);
    final locProvider = Provider.of<LocationProvider>(context, listen: false);
    final routeProvider = Provider.of<RouteProvider>(context, listen: false);

    try {
      final userLat = locProvider.currentLocation?.latitude ?? 20.0077;
      final userLng = locProvider.currentLocation?.longitude ?? 73.7926;

      final rankedItems = await _apiService.getNearbyRanked(
        category: category,
        lat: userLat,
        lng: userLng,
        radiusMeters: 3000,
        limit: 6,
      );

      if (!mounted) return;
      setState(() => _activeLoadingCategory = null);

      if (rankedItems.isEmpty) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('No $label found within walking radius.'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }

      final topPick = PlaceDetailData.fromNearbyItem(rankedItems.first);
      final alternatives = rankedItems.length > 1
          ? rankedItems.sublist(1).map((i) => PlaceDetailData.fromNearbyItem(i)).toList()
          : <PlaceDetailData>[];

      if (!mounted) return;
      await PlaceDetailPage.open(
        context,
        place: topPick,
        activeItinerary: routeProvider.itinerary,
        userPosition: LatLng(userLat, userLng),
        rankedAlternatives: alternatives,
      );
    } catch (e) {
      if (mounted) {
        setState(() => _activeLoadingCategory = null);
        messenger.showSnackBar(
          SnackBar(
            content: Text('Error finding $label: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final shortcuts = [
      {'category': 'ghat', 'icon': Icons.water, 'label': AppStrings.homeGhats.tr()},
      {'category': 'temple', 'icon': Icons.temple_hindu, 'label': AppStrings.homeTemples.tr()},
      {'category': 'food', 'icon': Icons.restaurant, 'label': AppStrings.homeFood.tr()},
      {'category': 'water', 'icon': Icons.water_drop, 'label': AppStrings.homeWater.tr()},
      {'category': 'toilet', 'icon': Icons.wc, 'label': AppStrings.homeToilets.tr()},
      {'category': 'medical', 'icon': Icons.medical_services, 'label': AppStrings.homeMedical.tr()},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: shortcuts.map((shortcut) {
          final category = shortcut['category'] as String;
          final label = shortcut['label'] as String;
          final icon = shortcut['icon'] as IconData;
          final isLoading = _activeLoadingCategory == category;

          return Padding(
            padding: const EdgeInsets.only(right: 20.0),
            child: InkWell(
              borderRadius: BorderRadius.circular(30),
              onTap: isLoading ? null : () => _handleShortcutTap(category, label),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      color: AppColors.surface,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Center(
                      child: isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                              ),
                            )
                          : Icon(
                              icon,
                              color: AppColors.secondary,
                              size: 28,
                            ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    label,
                    style: AppTextStyles.labelMd.copyWith(color: AppColors.onSurface),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
