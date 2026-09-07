import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_strings.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/crowd_map_widget.dart';
import '../../widgets/crowd_summary_card.dart';
import '../../widgets/search_bar_widget.dart';
import '../../widgets/shortcut_icons.dart';
import '../../widgets/banner_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Stack(
        children: [
          // Background Map
          const Positioned.fill(
            child: CrowdMapWidget(),
          ),
          
          // Top UI Overlay
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppStrings.appName.tr(),
                            style: AppTextStyles.headlineLg.copyWith(color: AppColors.primary),
                          ),
                          Text(
                            AppStrings.homeWelcome.tr(),
                            style: AppTextStyles.bodySm.copyWith(color: AppColors.onSurfaceVariant),
                          ),
                        ],
                      ),
                      Stack(
                        children: [
                          Container(
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.notifications_outlined, color: AppColors.onSurface),
                              onPressed: () {},
                            ),
                          ),
                          Positioned(
                            right: 8,
                            top: 8,
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: const BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Search Bar
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: SearchBarWidget(),
                ),

                const SizedBox(height: 16),
                
                // Shortcut Icons
                const ShortcutIcons(),
                
                const SizedBox(height: 16),
                
                // Banner
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: BannerCard(
                    title: AppStrings.homeBannerTitle.tr(),
                    subtitle: AppStrings.homeBannerSubtitle.tr(),
                    buttonText: AppStrings.homeBannerLabel.tr(),
                    onTap: () {},
                  ),
                ),
              ],
            ),
          ),
          
          // Bottom UI Overlay (Crowd Summary)
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Floating map controls
                Align(
                  alignment: Alignment.centerRight,
                  child: Column(
                    children: [
                      FloatingActionButton.small(
                        heroTag: 'layers',
                        backgroundColor: Colors.white,
                        child: const Icon(Icons.layers_outlined, color: AppColors.onSurface),
                        onPressed: () {},
                      ),
                      const SizedBox(height: 8),
                      FloatingActionButton.small(
                        heroTag: 'location',
                        backgroundColor: Colors.white,
                        child: const Icon(Icons.my_location, color: AppColors.tertiary),
                        onPressed: () {},
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
                // Summary Card
                const CrowdSummaryCard(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
