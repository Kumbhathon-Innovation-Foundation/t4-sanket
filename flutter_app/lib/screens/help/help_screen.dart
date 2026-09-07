import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_strings.dart';
import '../../constants/app_text_styles.dart';
import '../../models/help_category.dart';
import '../../widgets/sos_button.dart';
import '../../widgets/help_category_card.dart';
import '../../widgets/language_selector.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final List<HelpCategory> categories = [
      HelpCategory(
        id: 'emergency',
        title: AppStrings.helpEmergency.tr(),
        description: AppStrings.helpEmergencyDesc.tr(),
        icon: Icons.local_police,
        routeName: '/help/emergency',
      ),
      HelpCategory(
        id: 'medical',
        title: AppStrings.helpMedicalCamp.tr(),
        description: AppStrings.helpMedicalDesc.tr(),
        icon: Icons.medical_services,
        routeName: '/help/medical',
      ),
      HelpCategory(
        id: 'lost_found',
        title: AppStrings.helpLostFound.tr(),
        description: AppStrings.helpLostFoundDesc.tr(),
        icon: Icons.find_in_page,
        routeName: '/help/lost-found',
      ),
      HelpCategory(
        id: 'volunteer',
        title: AppStrings.helpVolunteer.tr(),
        description: AppStrings.helpVolunteerDesc.tr(),
        icon: Icons.volunteer_activism,
        routeName: '/help/volunteer',
      ),
      HelpCategory(
        id: 'contacts',
        title: AppStrings.helpContacts.tr(),
        description: AppStrings.helpContactsDesc.tr(),
        icon: Icons.contact_phone,
        routeName: '/help/contacts',
      ),
      HelpCategory(
        id: 'safety',
        title: AppStrings.helpSafety.tr(),
        description: AppStrings.helpSafetyDesc.tr(),
        icon: Icons.security,
        routeName: '/help/safety',
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 280.0,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.secondary],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          AppStrings.helpTitle.tr(),
                          style: AppTextStyles.displayLgMobile.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          AppStrings.helpSubtitle.tr(),
                          style: AppTextStyles.bodyLg.copyWith(color: Colors.white70),
                        ),
                        const SizedBox(height: 32),
                        const SosButton(),
                        const SizedBox(height: 12),
                        Text(
                          AppStrings.helpTapDispatch.tr(),
                          style: AppTextStyles.bodySm.copyWith(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              transform: Matrix4.translationValues(0, -32, 0),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppStrings.helpEssential.tr(),
                      style: AppTextStyles.headlineMd.copyWith(color: AppColors.onSurface),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      AppStrings.helpAllDesksActive.tr(),
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.crowdLow),
                    ),
                    const SizedBox(height: 24),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 1.1,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: categories.length,
                      itemBuilder: (context, index) {
                        return HelpCategoryCard(
                          category: categories[index],
                          onTap: () {
                            context.push(categories[index].routeName);
                          },
                        );
                      },
                    ),
                    const SizedBox(height: 40),
                    const Divider(color: AppColors.surfaceContainerHigh),
                    const SizedBox(height: 32),
                    const LanguageSelector(),
                    const SizedBox(height: 40),
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.spa, color: AppColors.primaryContainer.withValues(alpha: 0.5), size: 48),
                          const SizedBox(height: 16),
                          Text(
                            AppStrings.helpBlessing.tr(),
                            style: AppTextStyles.headlineSm.copyWith(color: AppColors.primary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            AppStrings.helpBlessingMsg.tr(),
                            style: AppTextStyles.bodySm.copyWith(color: AppColors.onSurfaceVariant),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            AppStrings.helpTollFree.tr(),
                            style: AppTextStyles.labelLg.copyWith(color: AppColors.onSurfaceVariant),
                          ),
                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
