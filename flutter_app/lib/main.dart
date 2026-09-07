import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import 'app.dart';
export 'app.dart';
import 'providers/crowd_provider.dart';
import 'providers/route_provider.dart';
import 'providers/location_provider.dart';
import 'providers/locale_provider.dart';
import 'services/supabase_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  // Initialize Supabase with Realtime
  try {
    await SupabaseService.initialize();
  } catch (e) {
    debugPrint('Supabase init warning: $e');
  }

  runApp(
    EasyLocalization(
      supportedLocales: const [
        Locale('en'),
        Locale('hi'),
        Locale('mr'),
        Locale('bn'),
        Locale('te'),
        Locale('ta'),
        Locale('kn'),
        Locale('ur'),
      ],
      path: 'assets/translations',
      useOnlyLangCode: true,
      fallbackLocale: const Locale('en'),
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => LocaleProvider()),
          ChangeNotifierProvider(create: (_) => LocationProvider()),
          ChangeNotifierProvider(create: (_) => CrowdProvider()),
          ChangeNotifierProvider(create: (_) => RouteProvider()),
        ],
        child: const AnubhavApp(),
      ),
    ),
  );
}
