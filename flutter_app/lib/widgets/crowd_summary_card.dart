import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';
import '../constants/app_strings.dart';
import '../providers/crowd_provider.dart';

class CrowdSummaryCard extends StatelessWidget {
  const CrowdSummaryCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<CrowdProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading || provider.summary == null) {
          return const Card(
            child: SizedBox(
              height: 120,
              child: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        final summary = provider.summary!;
        final isIncreasing = summary.changePercent >= 0;
        final changeColor = isIncreasing ? AppColors.error : AppColors.crowdLow;
        final changeIcon = isIncreasing ? Icons.arrow_upward : Icons.arrow_downward;

        return Card(
          color: AppColors.surface,
          elevation: 4,
          shadowColor: Colors.black12,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppColors.surfaceContainerHigh, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      AppStrings.homeTotalCrowd.tr(),
                      style: AppTextStyles.labelLg.copyWith(color: AppColors.onSurfaceVariant),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.errorContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: AppColors.error,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            AppStrings.homeLive.tr(),
                            style: AppTextStyles.labelSm.copyWith(color: AppColors.onErrorContainer),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      NumberFormat.compact().format(summary.totalCount),
                      style: AppTextStyles.displayLg.copyWith(color: AppColors.primary),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: changeColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(changeIcon, size: 14, color: changeColor),
                          const SizedBox(width: 2),
                          Text(
                            '${summary.changePercent.abs().toStringAsFixed(1)}%',
                            style: AppTextStyles.labelMd.copyWith(color: changeColor),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${AppStrings.homeLiveHeatmap.tr()} • Updated ${AppStrings.homeJustNow.tr()}',
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.onSurfaceVariant),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
