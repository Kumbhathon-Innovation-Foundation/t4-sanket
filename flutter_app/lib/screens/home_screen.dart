import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../models/itinerary_models.dart';
import '../models/place_detail_model.dart';
import '../services/api_service.dart';
import '../widgets/voice_assistant_sheet.dart';
import 'place_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  final Function(Itinerary itinerary, {bool autoStart}) onItineraryLoaded;

  const HomeScreen({super.key, required this.onItineraryLoaded});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _promptController = TextEditingController(
    text: "Coming from Dhule by car, want to perform holy snan at Ramkund, full journey plan please.",
  );

  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  bool _isStructured = false;
  Itinerary? _generatedItinerary;

  // STAGE 11: One-tap utility search state
  bool _isFetchingUtility = false;
  String? _loadingUtilityCategory;

  // Structured form fields
  String _origin = 'Dhule';
  String _modeOfTransport = 'car';
  String _arrivalTime = '07:00 AM';
  String _duration = 'Full day';
  int _partySize = 4;
  final Set<String> _purposes = {'snan', 'heritage'};
  final Set<String> _preferences = {'avoid_crowd', 'prefer_safety'};

  final List<String> _samplePrompts = [
    "Coming from Dhule by car, snan at Ramkund, full journey plan.",
    "With my parents I want to visit prominent temples in Nashik, create itinerary.",
    "मुझे रामकुंड पर पवित्र स्नान करना है, गाड़ी कहाँ पार्क करूँ?",
    "मला रामकुंडाला स्नानासाठी जायचे आहे, गाडी कुठे पार्क करावी?",
    "Panchavati temples darshan with elderly parents, minimize walking."
  ];

  Future<void> _openOneTapUtility(String category) async {
    setState(() {
      _isFetchingUtility = true;
      _loadingUtilityCategory = category;
    });

    try {
      const userLat = 20.0077;
      const userLng = 73.7926;

      final rankedItems = await _apiService.getNearbyRanked(
        category: category,
        lat: userLat,
        lng: userLng,
        radiusMeters: 3000,
        limit: 6,
      );

      if (!mounted) return;

      if (rankedItems.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('No $category facilities found nearby.'),
            backgroundColor: Colors.orange.shade800,
          ),
        );
        return;
      }

      final topPick = PlaceDetailData.fromNearbyItem(rankedItems.first);
      final alternatives = rankedItems.length > 1
          ? rankedItems.sublist(1).map((item) => PlaceDetailData.fromNearbyItem(item)).toList()
          : <PlaceDetailData>[];

      final updatedItinerary = await PlaceDetailPage.open(
        context,
        place: topPick,
        activeItinerary: _generatedItinerary,
        userPosition: const LatLng(userLat, userLng),
        rankedAlternatives: alternatives,
      );

      if (updatedItinerary != null && mounted) {
        setState(() {
          _generatedItinerary = updatedItinerary;
        });
        widget.onItineraryLoaded(updatedItinerary, autoStart: true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error finding $category: $e'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isFetchingUtility = false;
          _loadingUtilityCategory = null;
        });
      }
    }
  }

  Future<void> _submitPlan() async {
    setState(() => _isLoading = true);

    try {
      final message = _isStructured
          ? "Plan trip from $_origin arriving at $_arrivalTime via $_modeOfTransport for ${_purposes.join(', ')}. Preferences: ${_preferences.join(', ')}. Party size: $_partySize, duration: $_duration."
          : _promptController.text.trim();

      final itinerary = await _apiService.createPlan(
        userId: 'pilgrim_${DateTime.now().millisecondsSinceEpoch}',
        message: message,
        mode: _isStructured ? 'structured' : 'nl',
        formData: _isStructured
            ? {
                'origin': _origin,
                'mode_of_transport': _modeOfTransport,
                'arrival_time': _arrivalTime,
                'purposes': _purposes.toList(),
                'preferences': _preferences.toList(),
                'duration': _duration,
                'party_size': _partySize,
              }
            : null,
      );

      if (mounted) {
        setState(() {
          _generatedItinerary = itinerary;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFE65100),
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(child: Text('Plan ready with ${itinerary.stops.length} stops! Tap Start Journey.')),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.shade700,
            content: Text('Error generating plan: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Premium Sacred Kumbh Header
          SliverAppBar(
            expandedHeight: 180.0,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'ANUBHAV अनुभव',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.1,
                  color: Colors.white,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFFBF360C), // Deep saffron
                      Color(0xFFE65100), // Rich orange
                      Color(0xFF1B263B), // Navy night contrast
                    ],
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.auto_awesome, color: Colors.amber, size: 14),
                            SizedBox(width: 6),
                            Text(
                              'Nashik Kumbh Mobility AI Agent',
                              style: TextStyle(color: Colors.white, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 48),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Mode Toggle
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('Ask ANUBHAV (NL)')),
                          selected: !_isStructured,
                          selectedColor: const Color(0xFFFFE0B2),
                          onSelected: (val) => setState(() => _isStructured = false),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('Trip Planner Form')),
                          selected: _isStructured,
                          selectedColor: const Color(0xFFFFE0B2),
                          onSelected: (val) => setState(() => _isStructured = true),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Journey Ready Card with prominent "Start Journey" CTA
                  if (_generatedItinerary != null)
                    _buildJourneyReadyCard(_generatedItinerary!),

                  if (!_isStructured) ...[
                    // Natural Language Search Box
                    Card(
                      elevation: 3,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Where are you arriving from and what is your plan?',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: _promptController,
                              maxLines: 3,
                              decoration: InputDecoration(
                                hintText: "e.g. Coming from Dhule by car, holy snan at Ramkund, food...",
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                fillColor: Colors.grey.shade50,
                                filled: true,
                                suffixIcon: IconButton(
                                  icon: const Icon(Icons.mic, color: Color(0xFFE65100), size: 28),
                                  tooltip: 'Voice Search (Hindi / Marathi / English)',
                                  onPressed: () {
                                    VoiceAssistantSheet.show(
                                      context,
                                      onPlanGenerated: (newItinerary, {bool autoStart = true}) {
                                        setState(() {
                                          _generatedItinerary = newItinerary;
                                        });
                                        if (autoStart) {
                                          widget.onItineraryLoaded(newItinerary, autoStart: true);
                                        }
                                      },
                                    );
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // STAGE 11: One-tap Utility Search Card (Toilet, Medical, Food, Water)
                    _buildOneTapUtilitySection(),
                    const SizedBox(height: 16),

                    // Quick Prompt Suggestions
                    const Text(
                      'Sample Pilgrim Inquiries:',
                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _samplePrompts.map((p) {
                        return ActionChip(
                          label: Text(p, style: const TextStyle(fontSize: 12)),
                          backgroundColor: Colors.white,
                          elevation: 1,
                          onPressed: () {
                            _promptController.text = p;
                          },
                        );
                      }).toList(),
                    ),
                  ] else ...[
                    // Structured Trip Planner Form (matching architecture.md section 2)
                    Card(
                      elevation: 3,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Pilgrimage Parameters',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            const Divider(height: 24),

                            // Origin & Arrival Time
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    initialValue: _origin,
                                    decoration: const InputDecoration(
                                      labelText: 'Origin City',
                                      prefixIcon: Icon(Icons.location_on),
                                    ),
                                    onChanged: (val) => _origin = val,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    initialValue: _arrivalTime,
                                    decoration: const InputDecoration(
                                      labelText: 'Arrival Time',
                                      prefixIcon: Icon(Icons.access_time),
                                    ),
                                    onChanged: (val) => _arrivalTime = val,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Transport Mode
                            DropdownButtonFormField<String>(
                              initialValue: _modeOfTransport,
                              decoration: const InputDecoration(
                                labelText: 'Mode of Transport',
                                prefixIcon: Icon(Icons.directions_car),
                              ),
                              items: const [
                                DropdownMenuItem(value: 'car', child: Text('Car / Private Vehicle')),
                                DropdownMenuItem(value: 'bus', child: Text('MSRTC / Pilgrim Bus')),
                                DropdownMenuItem(value: 'train', child: Text('Train (Nashik Road Station)')),
                                DropdownMenuItem(value: 'walking', child: Text('Walking / On Foot')),
                              ],
                              onChanged: (val) => setState(() => _modeOfTransport = val ?? 'car'),
                            ),
                            const SizedBox(height: 16),

                            // Purposes
                            const Text('Purposes of Visit:', style: TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 8,
                              children: ['snan', 'heritage', 'food', 'shopping'].map((p) {
                                final isSelected = _purposes.contains(p);
                                return FilterChip(
                                  label: Text(p.toUpperCase()),
                                  selected: isSelected,
                                  onSelected: (selected) {
                                    setState(() {
                                      if (selected) {
                                        _purposes.add(p);
                                      } else {
                                        _purposes.remove(p);
                                      }
                                    });
                                  },
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 16),

                            // Preferences
                            const Text('Preferences:', style: TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 8,
                              children: ['avoid_crowd', 'prefer_safety', 'minimize_walking'].map((pref) {
                                final isSelected = _preferences.contains(pref);
                                return FilterChip(
                                  label: Text(pref.replaceAll('_', ' ')),
                                  selected: isSelected,
                                  onSelected: (selected) {
                                    setState(() {
                                      if (selected) {
                                        _preferences.add(pref);
                                      } else {
                                        _preferences.remove(pref);
                                      }
                                    });
                                  },
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 16),

                            // Duration & Party Size
                            Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    initialValue: _duration,
                                    decoration: const InputDecoration(labelText: 'Duration'),
                                    items: const [
                                      DropdownMenuItem(value: 'Half day', child: Text('Half day (4h)')),
                                      DropdownMenuItem(value: 'Full day', child: Text('Full day (8h)')),
                                      DropdownMenuItem(value: '2 days', child: Text('2 Days')),
                                    ],
                                    onChanged: (val) => setState(() => _duration = val ?? 'Full day'),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    initialValue: '$_partySize',
                                    keyboardType: TextInputType.number,
                                    decoration: const InputDecoration(
                                      labelText: 'Party Size',
                                      prefixIcon: Icon(Icons.people),
                                    ),
                                    onChanged: (val) => _partySize = int.tryParse(val) ?? 1,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Generate Plan Button
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE65100),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 4,
                      ),
                      onPressed: _isLoading ? null : _submitPlan,
                      child: _isLoading
                          ? const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                ),
                                SizedBox(width: 12),
                                Text('Consulting ANUBHAV AI & OSRM...'),
                              ],
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.map, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Generate Sacred Itinerary',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                    ),
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJourneyReadyCard(Itinerary itin) {
    final parkingStop = itin.stops.firstWhere(
      (s) => s.type == 'parking',
      orElse: () => itin.stops.first,
    );
    final transitStop = itin.stops.where((s) => s.type == 'transit_segment').firstOrNull;
    final isOuter = parkingStop.zoneType == 'outer' || transitStop != null;
    final visitStop = itin.stops.where((s) => s.type == 'visit').lastOrNull;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFB74D), width: 1.5),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE65100),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.auto_awesome, color: Colors.white, size: 14),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'JOURNEY PLAN READY',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      letterSpacing: 0.8,
                      color: Color(0xFFE65100),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  itin.detectedLanguage == 'mr'
                      ? 'मराठी'
                      : (itin.detectedLanguage == 'hi' ? 'हिंदी' : 'English'),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFE65100),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Assistant Speech Bubble
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.amber.shade200),
            ),
            child: Text(
              itin.summaryText,
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                color: Color(0xFF3E2723),
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Route Sequence Badges
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _buildMetricChip(
                icon: Icons.local_parking,
                label: '${parkingStop.name} (${isOuter ? 'Outer Lot' : 'Inner Lot'})',
                color: Colors.indigo,
              ),
              if (transitStop != null)
                _buildMetricChip(
                  icon: Icons.directions_bus,
                  label: 'Shuttle to ${transitStop.toLoc}',
                  color: Colors.teal,
                ),
              if (visitStop != null)
                _buildMetricChip(
                  icon: Icons.temple_hindu,
                  label: visitStop.name ?? 'Ramkund',
                  color: const Color(0xFFE65100),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // Action Buttons: "Start Journey" + "View Map"
          Row(
            children: [
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => widget.onItineraryLoaded(itin, autoStart: false),
                icon: const Icon(Icons.map_outlined, size: 18),
                label: const Text('View Map'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE65100),
                    foregroundColor: Colors.white,
                    elevation: 3,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () => widget.onItineraryLoaded(itin, autoStart: true),
                  icon: const Icon(Icons.navigation, size: 18),
                  label: const Text(
                    'Start Journey',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricChip({required IconData icon, required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildOneTapUtilitySection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.bolt, color: Color(0xFFE65100), size: 20),
                  SizedBox(width: 8),
                  Text(
                    'One-Tap Pilgrim Relief',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: Color(0xFF0D1B2A),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'NO TYPING',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2E7D32),
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Instant queue & crowd ranked utilities with live route addition',
            style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _buildUtilityCard(
                label: 'Toilet',
                subtitle: 'Sanitized',
                icon: Icons.wc,
                accentColor: const Color(0xFF5D4037),
                bgColor: const Color(0xFFFBE9E7),
                categoryKey: 'toilets',
              ),
              const SizedBox(width: 8),
              _buildUtilityCard(
                label: 'Medical',
                subtitle: 'First Aid',
                icon: Icons.local_hospital,
                accentColor: const Color(0xFFD32F2F),
                bgColor: const Color(0xFFFFEBEE),
                categoryKey: 'medical',
              ),
              const SizedBox(width: 8),
              _buildUtilityCard(
                label: 'Food',
                subtitle: 'Satvik Seva',
                icon: Icons.restaurant,
                accentColor: const Color(0xFF2E7D32),
                bgColor: const Color(0xFFE8F5E9),
                categoryKey: 'food',
              ),
              const SizedBox(width: 8),
              _buildUtilityCard(
                label: 'Water',
                subtitle: 'RO Jal Seva',
                icon: Icons.water_drop,
                accentColor: const Color(0xFF0288D1),
                bgColor: const Color(0xFFE1F5FE),
                categoryKey: 'water',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUtilityCard({
    required String label,
    required String subtitle,
    required IconData icon,
    required Color accentColor,
    required Color bgColor,
    required String categoryKey,
  }) {
    final isLoading = _isFetchingUtility && _loadingUtilityCategory == categoryKey;

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _isFetchingUtility ? null : () => _openOneTapUtility(categoryKey),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: accentColor.withValues(alpha: 0.25)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  child: isLoading
                      ? Center(
                          child: SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: accentColor,
                            ),
                          ),
                        )
                      : Icon(icon, color: accentColor, size: 20),
                ),
                const SizedBox(height: 6),
                Text(
                  label,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 12.5,
                    color: Color(0xFF0D1B2A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w600,
                    color: accentColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
