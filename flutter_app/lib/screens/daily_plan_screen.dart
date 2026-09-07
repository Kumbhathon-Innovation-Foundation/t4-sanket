import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/itinerary_models.dart';
import '../providers/route_provider.dart';
import '../services/api_service.dart';

class DailyPlanScreen extends StatefulWidget {
  final Function(Itinerary itinerary, {bool autoStart})? onItineraryLoaded;
  final Itinerary? activeItinerary;

  const DailyPlanScreen({
    super.key,
    this.onItineraryLoaded,
    this.activeItinerary,
  });

  @override
  State<DailyPlanScreen> createState() => _DailyPlanScreenState();
}

class _DailyPlanScreenState extends State<DailyPlanScreen> {
  final ApiService _apiService = ApiService();

  // Forecast state
  String _selectedForecastGhat = 'Ramkund';
  bool _isLoadingForecast = false;
  Map<String, dynamic>? _forecastData;

  // Intake Form state
  int _partySize = 4;
  int _elderlyCount = 1;
  int _childrenCount = 0;
  String _arrivalTime = '07:30 AM';
  String _modeOfTransport = 'car';
  String _origin = 'Dhule';

  // Planning result state
  bool _isPlanning = false;
  Itinerary? _currentPlan;
  String? _planErrorMessage;

  final List<String> _arrivalTimes = [
    '05:30 AM',
    '07:00 AM',
    '07:30 AM',
    '08:30 AM',
    '10:00 AM',
    '02:00 PM',
    '05:00 PM',
  ];

  final List<Map<String, dynamic>> _transportModes = [
    {'id': 'car', 'label': 'Car / SUV', 'icon': Icons.directions_car},
    {'id': 'bus', 'label': 'Pilgrim Bus', 'icon': Icons.directions_bus},
    {'id': 'train', 'label': 'Train', 'icon': Icons.train},
    {'id': 'walk', 'label': 'On Foot', 'icon': Icons.directions_walk},
  ];

  @override
  void initState() {
    super.initState();
    _loadForecast(_selectedForecastGhat);
    if (widget.activeItinerary != null) {
      _currentPlan = widget.activeItinerary;
    }
  }

  Future<void> _loadForecast(String ghatName) async {
    setState(() => _isLoadingForecast = true);
    try {
      final data = await _apiService.getGhatForecast(ghatName: ghatName);
      if (mounted) {
        setState(() {
          _forecastData = data;
          _isLoadingForecast = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingForecast = false);
      }
    }
  }

  Future<void> _generatePlan({bool override = false}) async {
    setState(() {
      _isPlanning = true;
      _planErrorMessage = null;
    });

    try {
      final formData = {
        'origin': _origin,
        'mode_of_transport': _modeOfTransport,
        'arrival_time': _arrivalTime,
        'party_size': _partySize,
        'elderly_count': _elderlyCount,
        'children_count': _childrenCount,
        'override_ramkund': override,
        'purposes': ['snan', 'heritage'],
        'preferences': ['prefer_safety'],
      };

      final message = override
          ? "Plan trip from $_origin arriving at $_arrivalTime with $_partySize people ($_elderlyCount seniors). Explicit override: Visit Ramkund."
          : "Plan trip from $_origin arriving at $_arrivalTime with $_partySize people ($_elderlyCount seniors, $_childrenCount children).";

      final itin = await _apiService.createPlan(
        userId: 'pilgrim_planner_${DateTime.now().millisecondsSinceEpoch}',
        message: message,
        mode: 'structured',
        formData: formData,
      );

      if (mounted) {
        setState(() {
          _currentPlan = itin;
          _isPlanning = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isPlanning = false;
          _planErrorMessage = 'Failed to generate plan: $e';
        });
      }
    }
  }

  void _startJourney() {
    if (_currentPlan != null) {
      if (widget.onItineraryLoaded != null) {
        widget.onItineraryLoaded!(_currentPlan!, autoStart: true);
      }
      final routeProvider = Provider.of<RouteProvider>(context, listen: false);
      routeProvider.fetchItinerary(message: _currentPlan!.summaryText);
      context.go('/route');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FA),
      body: CustomScrollView(
        slivers: [
          // Header
          SliverAppBar(
            expandedHeight: 140.0,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'Travel Planner',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                  color: Colors.white,
                  fontSize: 18,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFFBF360C),
                      Color(0xFFE65100),
                      Color(0xFF1B263B),
                    ],
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
                alignment: Alignment.centerLeft,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.family_restroom, color: Colors.amber, size: 14),
                          SizedBox(width: 6),
                          Text(
                            'Group & Crowd-Aware Routing',
                            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Main Body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // SECTION 1: Today's Overview & Ghat Congestion Forecast
                  _buildSectionHeader(
                    title: "Today's Overview",
                    subtitle: 'Real-time ghat congestion forecast and optimal darshan windows',
                    icon: Icons.trending_up,
                  ),
                  const SizedBox(height: 12),
                  _buildGhatForecastCard(),
                  const SizedBox(height: 24),

                  // SECTION 2: Plan for Today (Intake Form)
                  _buildSectionHeader(
                    title: 'Plan for Today',
                    subtitle: 'Group size, vulnerable members & arrival telemetry',
                    icon: Icons.groups_outlined,
                  ),
                  const SizedBox(height: 12),
                  _buildIntakeFormCard(),
                  const SizedBox(height: 24),

                  // Error banner if any
                  if (_planErrorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Colors.red),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _planErrorMessage!,
                              style: TextStyle(color: Colors.red.shade900, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // SECTION 3: Suggested Plan & Rule 1a Reasoning
                  if (_currentPlan != null || _isPlanning) ...[
                    _buildSectionHeader(
                      title: 'Your Recommended Journey',
                      subtitle: 'Optimized for minimal wait times and vulnerable group comfort',
                      icon: Icons.navigation_outlined,
                    ),
                    const SizedBox(height: 12),
                    if (_isPlanning)
                      _buildPlanningLoadingCard()
                    else if (_currentPlan != null)
                      _buildPlanResultCard(),
                    const SizedBox(height: 32),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    required String subtitle,
    required IconData icon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFFE65100)),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0D1B2A),
                letterSpacing: -0.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 3),
        Padding(
          padding: const EdgeInsets.only(left: 28.0),
          child: Text(
            subtitle,
            style: TextStyle(fontSize: 12.5, color: Colors.grey.shade600),
          ),
        ),
      ],
    );
  }

  // -------------------------------------------------------------
  // SECTION 1: GHAT CONGESTION FORECAST
  // -------------------------------------------------------------
  Widget _buildGhatForecastCard() {
    final bars = (_forecastData?['hourly_bars'] as List?) ?? _getDefaultHourlyBars();
    final optimal = _forecastData?['optimal_window'] as Map<String, dynamic>? ?? {
      'start': '07:15 AM',
      'end': '08:30 AM',
      'wait_target': '<15 min',
      'reason': 'Early morning post-Aarti transition lull',
    };

    final isRamkund = _selectedForecastGhat.toLowerCase().contains('ramkund');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ghat Selector Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(3),
                child: Row(
                  children: [
                    _buildGhatToggleChip('Ramkund', isRamkund),
                    _buildGhatToggleChip('Talkuteshwar', !isRamkund),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isRamkund ? const Color(0xFFFFEBEE) : const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isRamkund ? const Color(0xFFFFCDD2) : const Color(0xFFC8E6C9),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: isRamkund ? const Color(0xFFD32F2F) : const Color(0xFF2E7D32),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      isRamkund ? 'HIGH CROWD • 45m' : 'LOW CROWD • <10m',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        color: isRamkund ? const Color(0xFFB71C1C) : const Color(0xFF1B5E20),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Hourly Congestion Bar Chart
          if (_isLoadingForecast)
            const SizedBox(
              height: 100,
              child: Center(
                child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFE65100)),
              ),
            )
          else
            _buildBarChart(bars),
          const SizedBox(height: 16),

          // Optimal Window Callout
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFFFFF8E1),
                  const Color(0xFFFFF3E0),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFFFE082)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFB300),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.access_time_filled, color: Colors.white, size: 18),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Optimal Window: ${optimal['start']} – ${optimal['end']}',
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF5D4037),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2E7D32),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Target wait ${optimal['wait_target']}',
                              style: const TextStyle(
                                fontSize: 9.5,
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        optimal['reason']?.toString() ??
                            'Lowest queue density and priority corridor clearance.',
                        style: TextStyle(fontSize: 11.5, color: Colors.brown.shade800),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGhatToggleChip(String label, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() => _selectedForecastGhat = label);
        _loadForecast(label);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 4,
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
            color: isSelected ? const Color(0xFF0D1B2A) : Colors.grey.shade600,
          ),
        ),
      ),
    );
  }

  Widget _buildBarChart(List bars) {
    return SizedBox(
      height: 96,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: bars.map((b) {
          final time = b['time']?.toString() ?? '';
          final colorCode = b['color']?.toString() ?? 'green';
          final waitMin = b['wait_min'] ?? 15;

          Color barColor = const Color(0xFF2E7D32);
          if (colorCode == 'red') {
            barColor = const Color(0xFFD32F2F);
          } else if (colorCode == 'orange' || colorCode == 'yellow') {
            barColor = const Color(0xFFF57C00);
          }

          final double barHeight = ((waitMin as num).clamp(8, 60) / 60.0) * 58.0 + 14.0;

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${waitMin}m',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: barColor,
                ),
              ),
              const SizedBox(height: 3),
              Container(
                width: 28,
                height: barHeight,
                decoration: BoxDecoration(
                  color: barColor,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              const SizedBox(height: 5),
              Text(
                time.split(' ').first,
                style: TextStyle(fontSize: 10, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  List<Map<String, dynamic>> _getDefaultHourlyBars() {
    return [
      {'time': '05:00 AM', 'level': 'low', 'color': 'green', 'wait_min': 10},
      {'time': '07:00 AM', 'level': 'medium', 'color': 'orange', 'wait_min': 20},
      {'time': '09:00 AM', 'level': 'high', 'color': 'red', 'wait_min': 45},
      {'time': '12:00 PM', 'level': 'medium', 'color': 'orange', 'wait_min': 25},
      {'time': '03:00 PM', 'level': 'low', 'color': 'green', 'wait_min': 15},
      {'time': '06:00 PM', 'level': 'high', 'color': 'red', 'wait_min': 55},
      {'time': '08:00 PM', 'level': 'medium', 'color': 'orange', 'wait_min': 20},
    ];
  }

  // -------------------------------------------------------------
  // SECTION 2: INTAKE FORM (PARTY & VULNERABLE MEMBERS)
  // -------------------------------------------------------------
  Widget _buildIntakeFormCard() {
    final hasVulnerable = _elderlyCount > 0 || _childrenCount > 0;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Origin & Arrival Time
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Origin City',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF475569)),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _origin,
                          isExpanded: true,
                          items: const [
                            DropdownMenuItem(value: 'Dhule', child: Text('Dhule (NH-3)')),
                            DropdownMenuItem(value: 'Mumbai', child: Text('Mumbai (NH-160)')),
                            DropdownMenuItem(value: 'Pune', child: Text('Pune (NH-60)')),
                            DropdownMenuItem(value: 'Nashik Road', child: Text('Nashik Road Station')),
                            DropdownMenuItem(value: 'Trimbak', child: Text('Trimbakeshwar')),
                          ],
                          onChanged: (v) => setState(() => _origin = v ?? 'Dhule'),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Arrival Time',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF475569)),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _arrivalTime,
                          isExpanded: true,
                          items: _arrivalTimes
                              .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                              .toList(),
                          onChanged: (v) => setState(() => _arrivalTime = v ?? '07:30 AM'),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Transport Mode Selector
          const Text(
            'Mode of Transport',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF475569)),
          ),
          const SizedBox(height: 8),
          Row(
            children: _transportModes.map((m) {
              final isSelected = _modeOfTransport == m['id'];
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _modeOfTransport = m['id']),
                  child: Container(
                    margin: const EdgeInsets.only(right: 6),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFFFF3E0) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? const Color(0xFFE65100) : Colors.grey.shade300,
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          m['icon'] as IconData,
                          color: isSelected ? const Color(0xFFE65100) : Colors.grey.shade600,
                          size: 20,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          m['label'].toString().split(' ').first,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? const Color(0xFFE65100) : Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // Group Composition (Party Size, Elderly, Children)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Group Composition',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0D1B2A),
                  ),
                ),
                const SizedBox(height: 12),
                _buildCounterRow(
                  label: 'Total Party Size',
                  subLabel: 'Total number of pilgrims travelling',
                  count: _partySize,
                  min: 1,
                  onChanged: (val) {
                    setState(() {
                      _partySize = val;
                      if (_elderlyCount + _childrenCount > _partySize) {
                        _elderlyCount = _partySize;
                        _childrenCount = 0;
                      }
                    });
                  },
                ),
                const Divider(height: 20),
                _buildCounterRow(
                  label: 'Elderly / Seniors (60+)',
                  subLabel: 'Triggers step-free & low-crowd routing',
                  count: _elderlyCount,
                  min: 0,
                  accentColor: const Color(0xFFE65100),
                  onChanged: (val) => setState(() => _elderlyCount = val),
                ),
                const Divider(height: 20),
                _buildCounterRow(
                  label: 'Children (under 12)',
                  subLabel: 'Triggers safety corridor routing',
                  count: _childrenCount,
                  min: 0,
                  accentColor: const Color(0xFF0288D1),
                  onChanged: (val) => setState(() => _childrenCount = val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Vulnerable member rule highlight
          if (hasVulnerable)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFA5D6A7)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.verified_user, color: Color(0xFF2E7D32), size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Rule 1a Active: Automatic low-crowd ghat routing will protect vulnerable group members.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF1B5E20), fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 18),

          // Submit button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isPlanning ? null : () => _generatePlan(override: false),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE65100),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 1,
              ),
              child: _isPlanning
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        ),
                        SizedBox(width: 12),
                        Text('Analyzing telemetry...', style: TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.auto_awesome, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Generate Group-Aware Plan',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCounterRow({
    required String label,
    required String subLabel,
    required int count,
    required int min,
    Color? accentColor,
    required ValueChanged<int> onChanged,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subLabel,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.remove_circle_outline),
              color: count > min ? (accentColor ?? const Color(0xFF0D1B2A)) : Colors.grey.shade400,
              onPressed: count > min ? () => onChanged(count - 1) : null,
              iconSize: 24,
            ),
            Container(
              constraints: const BoxConstraints(minWidth: 26),
              alignment: Alignment.center,
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: accentColor ?? const Color(0xFF0D1B2A),
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              color: accentColor ?? const Color(0xFF0D1B2A),
              onPressed: () => onChanged(count + 1),
              iconSize: 24,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPlanningLoadingCard() {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Center(
        child: Column(
          children: [
            CircularProgressIndicator(strokeWidth: 3, color: Color(0xFFE65100)),
            SizedBox(height: 16),
            Text(
              'Running NTKMA Telemetry & Safety Optimization...',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            SizedBox(height: 4),
            Text(
              'Checking Ramkund crowd density, walking gradients & senior comfort',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // SECTION 3: PLAN RESULT & RULE 1A REASONING BANNER
  // -------------------------------------------------------------
  Widget _buildPlanResultCard() {
    final itin = _currentPlan!;
    final gp = itin.groupPlanning;
    final isSubstitution = gp != null && gp.hasVulnerableMembers && !gp.isOverride;
    final isOverrideActive = gp != null && gp.isOverride;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner for Rule 1a Reasoning
          if (isSubstitution)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'RULE 1A • GROUP SAFETY OPTIMIZED',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.shield, color: Color(0xFF16A34A), size: 18),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Recommended: Talkuteshwar Ghat over Ramkund',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF14532D),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    gp.reasoning.isNotEmpty
                        ? gp.reasoning
                        : 'Ramkund currently experiencing heavy congestion (45+ min queue, high density). Recommended Talkuteshwar Ghat — 12 min away, lower crowd, dedicated senior assistance, safe for families.',
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: Color(0xFF166534),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            )
          else if (isOverrideActive)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD97706),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'MANUAL OVERRIDE • HIGH CROWD ADVISORY',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 18),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Destination: Ramkund (Explicit Pilgrim Request)',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF78350F),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    gp.safetyNote.isNotEmpty
                        ? gp.safetyNote
                        : 'Ramkund crowd levels are currently high (45+ min queue). Nearest First Aid & Medical Post at Ramkund North Entrance is 40m away.',
                    style: const TextStyle(fontSize: 12.5, color: Color(0xFF92400E), height: 1.4),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),

          // Itinerary Summary Text
          Text(
            itin.summaryText,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),

          // Itinerary Stops List
          const Text(
            'Route Stretches & Colour-Coded Crowd Segments:',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 10),
          ...itin.stops.map((stop) => _buildStopRow(stop)),
          const SizedBox(height: 20),

          // THE TWO ACTION PATHS (STAGE 12 Requirement 4)
          // 1. "Start Journey" (Accepts recommendation -> switches to Live Map)
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _startJourney,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 2,
              ),
              icon: const Icon(Icons.navigation, size: 18),
              label: Text(
                isSubstitution ? 'Start Journey (Talkuteshwar)' : 'Start Journey',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // 2. "Plan for Ramkund instead" (Honors override with safety note)
          if (isSubstitution)
            SizedBox(
              width: double.infinity,
              height: 46,
              child: OutlinedButton.icon(
                onPressed: _isPlanning ? null : () => _generatePlan(override: true),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFC62828),
                  side: const BorderSide(color: Color(0xFFEF9A9A)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.swap_horiz, size: 18),
                label: const Text(
                  'Plan for Ramkund instead',
                  style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold),
                ),
              ),
            )
          else if (isOverrideActive)
            SizedBox(
              width: double.infinity,
              height: 46,
              child: OutlinedButton.icon(
                onPressed: _isPlanning ? null : () => _generatePlan(override: false),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF2E7D32),
                  side: const BorderSide(color: Color(0xFFA5D6A7)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.shield_outlined, size: 18),
                label: const Text(
                  'Switch to Talkuteshwar (Safer for family)',
                  style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStopRow(ItineraryStop stop) {
    final isWalk = stop.type == 'walk_segment';
    final isVisit = stop.type == 'visit';
    final crowd = stop.crowdColor?.toLowerCase() ?? 'green';

    Color crowdBadgeColor = const Color(0xFF2E7D32);
    if (crowd == 'red') {
      crowdBadgeColor = const Color(0xFFD32F2F);
    } else if (crowd == 'orange' || crowd == 'yellow') {
      crowdBadgeColor = const Color(0xFFF57C00);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: isWalk ? const Color(0xFFE2E8F0) : const Color(0xFFFFE0B2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isWalk
                  ? Icons.directions_walk
                  : (isVisit ? Icons.temple_hindu : Icons.local_parking),
              size: 16,
              color: isWalk ? const Color(0xFF475569) : const Color(0xFFE65100),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isWalk
                      ? '${stop.fromLoc ?? 'From'} → ${stop.toLoc ?? 'To'}'
                      : (stop.name ?? 'Destination'),
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (stop.note != null && stop.note!.isNotEmpty)
                  Text(
                    stop.note!,
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                  ),
              ],
            ),
          ),
          if (stop.crowdColor != null) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: crowdBadgeColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: crowdBadgeColor.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(color: crowdBadgeColor, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    crowd.toUpperCase(),
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      color: crowdBadgeColor,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
