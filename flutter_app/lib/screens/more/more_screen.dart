import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_strings.dart';
import '../../widgets/settings_list_tile.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text(AppStrings.navMore.tr()),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          SettingsListTile(
            icon: Icons.info_outline,
            title: AppStrings.moreAbout.tr(),
            subtitle: AppStrings.moreAboutDesc.tr(),
            onTap: () {},
          ),
          SettingsListTile(
            icon: Icons.book_outlined,
            title: AppStrings.moreGuide.tr(),
            subtitle: AppStrings.moreGuideDesc.tr(),
            onTap: () {},
          ),
          SettingsListTile(
            icon: Icons.feedback_outlined,
            title: AppStrings.moreFeedback.tr(),
            subtitle: AppStrings.moreFeedbackDesc.tr(),
            onTap: () {},
          ),
          const Divider(height: 32, indent: 16, endIndent: 16),
          SettingsListTile(
            icon: Icons.settings_outlined,
            title: AppStrings.moreSettings.tr(),
            subtitle: AppStrings.moreSettingsDesc.tr(),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}
