import 'package:flutter/material.dart';
import '../models/itinerary_models.dart';
import '../services/api_service.dart';
import '../services/voice_service.dart';

class VoiceAssistantSheet extends StatefulWidget {
  final Function(Itinerary itinerary, {bool autoStart}) onPlanGenerated;

  const VoiceAssistantSheet({
    super.key,
    required this.onPlanGenerated,
  });

  static Future<void> show(
    BuildContext context, {
    required Function(Itinerary itinerary, {bool autoStart}) onPlanGenerated,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => VoiceAssistantSheet(onPlanGenerated: onPlanGenerated),
    );
  }

  @override
  State<VoiceAssistantSheet> createState() => _VoiceAssistantSheetState();
}

class _VoiceAssistantSheetState extends State<VoiceAssistantSheet>
    with SingleTickerProviderStateMixin {
  final VoiceService _voiceService = VoiceService();
  final ApiService _apiService = ApiService();

  late AnimationController _animController;
  late Animation<double> _pulseAnimation;

  String _transcript = '';
  bool _isListening = false;
  bool _isLoading = false;
  String _detectedLang = 'Auto';
  String? _statusText = 'Tap mic and speak in Hindi, Marathi, or English...';
  Itinerary? _generatedItinerary;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.25).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );

    _initVoice();
  }

  Future<void> _initVoice() async {
    final available = await _voiceService.init();
    if (!available && mounted) {
      setState(() {
        _statusText = 'Voice not supported on this platform. You can type below.';
      });
    } else {
      _startListening();
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    _voiceService.stopListening();
    super.dispose();
  }

  void _startListening() async {
    setState(() {
      _isListening = true;
      _statusText = 'Listening... Speak in Hindi, Marathi, or English';
    });

    await _voiceService.startListening(
      onResult: (text, isFinal) {
        if (!mounted) return;
        setState(() {
          _transcript = text;
          final locale = VoiceService.detectLocaleFromText(text);
          if (locale.startsWith('hi')) {
            _detectedLang = 'हिंदी';
          } else if (locale.startsWith('mr')) {
            _detectedLang = 'मराठी';
          } else {
            _detectedLang = 'English';
          }
        });

        if (isFinal && text.trim().isNotEmpty) {
          _submitQuery(text);
        }
      },
    );
  }

  Future<void> _submitQuery(String query) async {
    if (query.trim().isEmpty) return;
    await _voiceService.stopListening();

    setState(() {
      _isListening = false;
      _isLoading = true;
      _statusText = 'Planning sacred journey in $_detectedLang...';
    });

    try {
      final itinerary = await _apiService.createPlan(
        userId: 'pilgrim_${DateTime.now().millisecondsSinceEpoch}',
        message: query,
        mode: 'voice',
      );

      if (!mounted) return;

      // Speak response dynamically in the matching language
      await _voiceService.speak(
        itinerary.summaryText,
        languageCode: VoiceService.detectLocaleFromText(itinerary.summaryText),
      );

      if (mounted) {
        setState(() {
          _isLoading = false;
          _generatedItinerary = itinerary;
          _statusText = 'Itinerary Ready! Tap below to start your journey.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _statusText = 'Error generating route: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(color: Colors.black26, blurRadius: 20, spreadRadius: 4),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 18),

          // Title & Detected Language Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.mic, color: Color(0xFFE65100), size: 24),
                  SizedBox(width: 8),
                  Text(
                    'Kumbh Mitra Voice',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0D1B2A),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Text(
                  _detectedLang,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFE65100),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Pulsing Microphone Graphic
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _isListening ? _pulseAnimation.value : 1.0,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: _isLoading
                        ? Colors.grey.shade300
                        : const Color(0xFFE65100),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFE65100).withValues(alpha: 0.35),
                        blurRadius: 18,
                        spreadRadius: _isListening ? 6 : 2,
                      ),
                    ],
                  ),
                  child: Icon(
                    _isLoading ? Icons.hourglass_top : Icons.mic,
                    color: Colors.white,
                    size: 38,
                  ),
                ),
              );
            },
          ),

          const SizedBox(height: 20),

          // Status instruction
          Text(
            _statusText ?? '',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),

          const SizedBox(height: 16),

          // Live Transcript Display
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            constraints: const BoxConstraints(minHeight: 70),
            decoration: BoxDecoration(
              color: const Color(0xFFF8F9FA),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Text(
              _transcript.isNotEmpty
                  ? '"$_transcript"'
                  : 'Speak now (e.g. "रामकुंड पर स्नान करना है", "मला गाडी पार्क करायची आहे", "Take me to Ramkund")...',
              style: TextStyle(
                fontSize: 15,
                fontStyle: _transcript.isNotEmpty ? FontStyle.normal : FontStyle.italic,
                color: _transcript.isNotEmpty ? const Color(0xFF0D1B2A) : Colors.grey,
                height: 1.4,
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Generated Itinerary & "Start Journey" Card
          if (_generatedItinerary != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8E1),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.orange.shade200),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFFE65100),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.auto_awesome, color: Colors.white, size: 14),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'PLAN READY • ITINERARY CONFIRMED',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                          letterSpacing: 0.8,
                          color: Color(0xFFE65100),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _generatedItinerary!.summaryText,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF3E2723),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE65100),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 4,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () {
                  widget.onPlanGenerated(_generatedItinerary!, autoStart: true);
                  Navigator.of(context).pop();
                },
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.navigation, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Start Journey',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () {
                      _voiceService.stopListening();
                      Navigator.of(context).pop();
                    },
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE65100),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: _transcript.trim().isNotEmpty && !_isLoading
                        ? () => _submitQuery(_transcript)
                        : null,
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text(
                            'Submit Plan',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
