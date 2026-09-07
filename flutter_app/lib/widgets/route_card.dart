import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';
import '../constants/app_strings.dart';
import '../models/route_data.dart';

class RouteCard extends StatelessWidget {
  final RouteData route;
  final VoidCallback onTap;
  final bool isSelected;

  const RouteCard({
    super.key,
    required this.route,
    required this.onTap,
    this.isSelected = false,
  });

  @override
  Widget build(BuildContext context) {
    final bool isRecommended = route.isRecommended;
    final Color borderColor = isSelected 
        ? (isRecommended ? AppColors.crowdLow : AppColors.error) 
        : Colors.transparent;
    final Color badgeColor = isRecommended ? AppColors.crowdLow : AppColors.error;
    final String badgeText = isRecommended 
        ? AppStrings.routeBestChoice.tr() 
        : AppStrings.routeHeavyDelay.tr();
    final IconData badgeIcon = isRecommended ? Icons.check_circle : Icons.warning;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: 2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            // Badge
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
              decoration: BoxDecoration(
                color: badgeColor.withValues(alpha: 0.1),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(14),
                  topRight: Radius.circular(14),
                ),
              ),
              child: Row(
                children: [
                  Icon(badgeIcon, size: 16, color: badgeColor),
                  const SizedBox(width: 8),
                  Text(
                    badgeText,
                    style: AppTextStyles.labelMd.copyWith(color: badgeColor),
                  ),
                ],
              ),
            ),
            
            // Content
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          route.name,
                          style: AppTextStyles.headlineSm.copyWith(color: AppColors.onSurface),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.route, size: 16, color: AppColors.onSurfaceVariant),
                            const SizedBox(width: 4),
                            Text(
                              '${route.distanceKm} ${AppStrings.routeKm.tr()} • ${route.via}',
                              style: AppTextStyles.bodySm.copyWith(color: AppColors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${route.durationMinutes} ${AppStrings.routeMin.tr()}',
                        style: AppTextStyles.headlineMd.copyWith(
                          color: isRecommended ? AppColors.crowdLow : AppColors.error,
                        ),
                      ),
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: isRecommended ? AppColors.crowdLow.withValues(alpha: 0.1) : AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isRecommended ? AppStrings.routeLowCrowd.tr() : AppStrings.routeSevereJam.tr(),
                          style: AppTextStyles.labelSm.copyWith(
                            color: isRecommended ? AppColors.crowdLow : AppColors.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
