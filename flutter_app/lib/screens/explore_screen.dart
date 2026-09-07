import 'package:flutter/material.dart';
import '../models/place_detail_model.dart';
import '../services/supabase_service.dart';
import 'place_detail_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final SupabaseService _supabase = SupabaseService();

  List<Map<String, dynamic>> _temples = [];
  List<Map<String, dynamic>> _ghats = [];
  List<Map<String, dynamic>> _parking = [];
  List<Map<String, dynamic>> _facilities = [];
  List<Map<String, dynamic>> _food = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _loadAllReferenceData();
  }

  Future<void> _loadAllReferenceData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _supabase.getTemples(limit: 50),
        _supabase.getGhats(),
        _supabase.getParkingZones(),
        _supabase.getFacilities(),
        _supabase.getFoodSpots(),
      ]);

      if (mounted) {
        setState(() {
          _temples = results[0];
          _ghats = results[1];
          _parking = results[2];
          _facilities = results[3];
          _food = results[4];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading reference data from Supabase: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Direct Supabase Explorer (Anon)'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: const Color(0xFFE65100),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFFE65100),
          tabs: [
            Tab(text: 'Temples (${_temples.length})'),
            Tab(text: 'Ghats (${_ghats.length})'),
            Tab(text: 'Parking (${_parking.length})'),
            Tab(text: 'Facilities (${_facilities.length})'),
            Tab(text: 'Food (${_food.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildItemList(_temples, Icons.temple_hindu, 'name', 'address', 'rating', 'Temple'),
                _buildItemList(_ghats, Icons.water, 'name', 'source', 'avg_visit_minutes', 'Ghat'),
                _buildItemList(_parking, Icons.local_parking, 'name', 'zone_type', 'fare_estimate_inr_SYNTH', 'Parking'),
                _buildItemList(_facilities, Icons.medical_services, 'name', 'address', 'facility_type', 'Facility'),
                _buildItemList(_food, Icons.restaurant, 'name', 'address', 'rating', 'Food'),
              ],
            ),
    );
  }

  Widget _buildItemList(
    List<Map<String, dynamic>> items,
    IconData icon,
    String titleKey,
    String subtitleKey,
    String badgeKey,
    String categoryName,
  ) {
    if (items.isEmpty) {
      return const Center(child: Text('No data records found.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: items.length,
      itemBuilder: (ctx, i) {
        final item = items[i];
        final title = item[titleKey]?.toString() ?? 'Unnamed';
        final subtitle = item[subtitleKey]?.toString() ?? '';
        final badge = item[badgeKey]?.toString() ?? '';

        return Card(
          elevation: 1.5,
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            onTap: () {
              final placeData = PlaceDetailData.fromSupabaseItem(item, category: categoryName);
              PlaceDetailPage.open(context, place: placeData);
            },
            leading: CircleAvatar(
              backgroundColor: const Color(0xFFFFE0B2),
              child: Icon(icon, color: const Color(0xFFE65100), size: 20),
            ),
            title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            subtitle: subtitle.isNotEmpty ? Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis) : null,
            trailing: badge.isNotEmpty
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(badge, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  )
                : null,
          ),
        );
      },
    );
  }
}
