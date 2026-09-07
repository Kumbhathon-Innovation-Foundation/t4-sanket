import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import 'constants/app_colors.dart';
import 'constants/app_text_styles.dart';
import 'screens/shell_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/daily_plan_screen.dart';
import 'screens/route/route_screen.dart';
import 'screens/help/help_screen.dart';
import 'screens/help/lost_found_screen.dart';
import 'screens/help/emergency_screen.dart';
import 'screens/help/medical_screen.dart';
import 'screens/help/volunteer_screen.dart';
import 'screens/help/contacts_screen.dart';
import 'screens/help/safety_screen.dart';
import 'screens/more/more_screen.dart';

class AnubhavApp extends StatelessWidget {
  const AnubhavApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ANUBHAV',
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.secondary,
          tertiary: AppColors.tertiary,
          error: AppColors.error,
          surface: AppColors.surface,
        ),
        textTheme: TextTheme(
          displayLarge: AppTextStyles.displayLg,
          headlineLarge: AppTextStyles.headlineLg,
          headlineMedium: AppTextStyles.headlineMd,
          headlineSmall: AppTextStyles.headlineSm,
          bodyLarge: AppTextStyles.bodyLg,
          bodyMedium: AppTextStyles.bodyMd,
          bodySmall: AppTextStyles.bodySm,
          labelLarge: AppTextStyles.labelLg,
          labelMedium: AppTextStyles.labelMd,
          labelSmall: AppTextStyles.labelSm,
        ),
      ),
      routerConfig: _router,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/home',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ShellScreen(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/plan',
              builder: (context, state) => const DailyPlanScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/route',
              builder: (context, state) => const RouteScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/help',
              builder: (context, state) => const HelpScreen(),
              routes: [
                GoRoute(
                  path: 'lost-found',
                  builder: (context, state) => const LostFoundScreen(),
                ),
                GoRoute(
                  path: 'emergency',
                  builder: (context, state) => const EmergencyScreen(),
                ),
                GoRoute(
                  path: 'medical',
                  builder: (context, state) => const MedicalScreen(),
                ),
                GoRoute(
                  path: 'volunteer',
                  builder: (context, state) => const VolunteerScreen(),
                ),
                GoRoute(
                  path: 'contacts',
                  builder: (context, state) => const ContactsScreen(),
                ),
                GoRoute(
                  path: 'safety',
                  builder: (context, state) => const SafetyScreen(),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/more',
              builder: (context, state) => const MoreScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
