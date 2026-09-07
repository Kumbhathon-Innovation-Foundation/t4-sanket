import 'package:supabase_flutter/supabase_flutter.dart';
import '../config.dart';

class SupabaseService {
  static SupabaseClient get client => Supabase.instance.client;

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      // ignore: deprecated_member_use
      anonKey: AppConfig.supabaseAnonKey,
      realtimeClientOptions: const RealtimeClientOptions(
        eventsPerSecond: 10,
      ),
    );
  }

  // --- Reference Data Queries (Direct Anon Read) ---

  Future<List<Map<String, dynamic>>> getTemples({int limit = 25}) async {
    final res = await client
        .from('pois_temples')
        .select()
        .order('rating', ascending: false)
        .limit(limit);
    return List<Map<String, dynamic>>.from(res);
  }

  Future<List<Map<String, dynamic>>> getGhats() async {
    final res = await client.from('pois_ghats').select();
    return List<Map<String, dynamic>>.from(res);
  }

  Future<List<Map<String, dynamic>>> getParkingZones() async {
    final res = await client.from('parking_zones').select();
    return List<Map<String, dynamic>>.from(res);
  }

  Future<List<Map<String, dynamic>>> getFacilities({String? category}) async {
    var query = client.from('facilities').select();
    if (category != null) {
      query = query.eq('category', category);
    }
    final res = await query.limit(30);
    return List<Map<String, dynamic>>.from(res);
  }

  Future<List<Map<String, dynamic>>> getFoodSpots() async {
    final res = await client
        .from('food_utility')
        .select()
        .order('rating', ascending: false)
        .limit(30);
    return List<Map<String, dynamic>>.from(res);
  }

  Future<List<Map<String, dynamic>>> getAdvisoryCorridors() async {
    final res = await client.from('advisory_corridors').select();
    return List<Map<String, dynamic>>.from(res);
  }

  // --- Realtime Subscriptions ---

  /// Subscribes to changes on advisory_corridors (status/severity changes)
  RealtimeChannel subscribeToAdvisories({
    required Function(Map<String, dynamic> record) onAdvisoryChanged,
  }) {
    final channel = client.channel('public:advisory_corridors');
    channel.onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'advisory_corridors',
      callback: (payload) {
        final newRecord = payload.newRecord;
        if (newRecord.isNotEmpty) {
          onAdvisoryChanged(newRecord);
        }
      },
    ).subscribe();

    return channel;
  }

  /// Subscribes to new trip_patches for an active trip
  RealtimeChannel subscribeToTripPatches({
    required String tripId,
    required Function(Map<String, dynamic> patchPayload) onPatchReceived,
  }) {
    final channel = client.channel('public:trip_patches:$tripId');
    channel.onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'trip_patches',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'trip_id',
        value: tripId,
      ),
      callback: (payload) {
        final newRecord = payload.newRecord;
        if (newRecord.isNotEmpty) {
          onPatchReceived(newRecord);
        }
      },
    ).subscribe();

    return channel;
  }
}
