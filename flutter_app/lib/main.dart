import 'package:flutter/material.dart';
import 'models/itinerary_models.dart';
import 'screens/daily_plan_screen.dart';
import 'screens/home_screen.dart';
import 'screens/map_screen.dart';
import 'screens/explore_screen.dart';
import 'services/supabase_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase with Anon key
  try {
    await SupabaseService.initialize();
  } catch (e) {
    debugPrint('Supabase init warning: $e');
  }

  runApp(const AnubhavApp());
}

class AnubhavApp extends StatelessWidget {
  const AnubhavApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ANUBHAV Kumbh Mela Assistant',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE65100), // Sacred Saffron/Orange
          primary: const Color(0xFFE65100),
          secondary: const Color(0xFF1B263B), // Navy night
          surface: Colors.grey.shade50,
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFE65100),
          foregroundColor: Colors.white,
          elevation: 2,
        ),
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;
  Itinerary? _activeItinerary;
  bool _autoStartSimulation = false;

  void _onItineraryLoaded(Itinerary itinerary, {bool autoStart = true}) {
    setState(() {
      _activeItinerary = itinerary;
      _autoStartSimulation = autoStart;
      _currentIndex = 2; // Switch to Map Screen
    });
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(onItineraryLoaded: _onItineraryLoaded),
      DailyPlanScreen(
        onItineraryLoaded: _onItineraryLoaded,
        activeItinerary: _activeItinerary,
      ),
      MapScreen(
        itinerary: _activeItinerary,
        autoStartSimulation: _autoStartSimulation,
      ),
      const ExploreScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble, color: Color(0xFFE65100)),
            label: 'Ask ANUBHAV',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today, color: Color(0xFFE65100)),
            label: 'Plan',
          ),
          NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map, color: Color(0xFFE65100)),
            label: 'Live Map',
          ),
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore, color: Color(0xFFE65100)),
            label: 'Explore',
          ),
        ],
      ),
    );
  }
}
