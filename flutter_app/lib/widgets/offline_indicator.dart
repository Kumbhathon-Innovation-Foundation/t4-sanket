import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../constants/app_colors.dart';
import '../constants/app_strings.dart';
import '../constants/app_text_styles.dart';

class OfflineIndicator extends StatelessWidget {
  const OfflineIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
      color: AppColors.secondaryContainer,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.cloud_off, size: 14, color: AppColors.onSecondaryContainer),
          const SizedBox(width: 8),
          Text(
            AppStrings.cachedData.tr(),
            style: AppTextStyles.labelMd.copyWith(color: AppColors.onSecondaryContainer),
          ),
        ],
      ),
    );
  }
}
