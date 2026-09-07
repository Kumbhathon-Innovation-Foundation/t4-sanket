import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../constants/app_colors.dart';
import '../constants/app_strings.dart';
import '../constants/app_text_styles.dart';
import '../providers/locale_provider.dart';

class LanguageSelector extends StatelessWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context) {
    final Map<String, String> languages = {
      'en': 'English',
      'hi': 'हिन्दी',
      'mr': 'मराठी',
      'bn': 'বাংলা',
      'te': 'తెలుగు',
      'ta': 'தமிழ்',
      'kn': 'ಕನ್ನಡ',
      'ur': 'اردو',
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              AppStrings.helpSelectLang.tr(),
              style: AppTextStyles.headlineSm.copyWith(color: AppColors.onSurface),
            ),
            Text(
              AppStrings.helpLangCount.tr(),
              style: AppTextStyles.bodySm.copyWith(color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Consumer<LocaleProvider>(
          builder: (context, localeProvider, child) {
            final currentLocaleCode = context.locale.languageCode;
            
            return Wrap(
              spacing: 8,
              runSpacing: 12,
              children: languages.entries.map((entry) {
                final isSelected = entry.key == currentLocaleCode;
                return ChoiceChip(
                  label: Text(entry.value),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) {
                      localeProvider.setLocale(context, Locale(entry.key));
                    }
                  },
                  labelStyle: AppTextStyles.labelLg.copyWith(
                    color: isSelected ? AppColors.onPrimaryContainer : AppColors.onSurface,
                  ),
                  backgroundColor: AppColors.surface,
                  selectedColor: AppColors.primaryContainer.withValues(alpha: 0.8),
                  side: BorderSide(
                    color: isSelected ? AppColors.primaryContainer : AppColors.surfaceContainerHigh,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}
