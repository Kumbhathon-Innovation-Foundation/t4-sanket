import 'package:flutter/material.dart';

class SimulationToolbar extends StatelessWidget {
  final bool isPlaying;
  final double speedMultiplier;
  final double progressFraction; // 0.0 to 1.0
  final int currentStep;
  final int totalSteps;
  final VoidCallback onTogglePlay;
  final ValueChanged<double> onSpeedChanged;
  final VoidCallback onReset;
  final VoidCallback onClose;

  const SimulationToolbar({
    super.key,
    required this.isPlaying,
    required this.speedMultiplier,
    required this.progressFraction,
    required this.currentStep,
    required this.totalSteps,
    required this.onTogglePlay,
    required this.onSpeedChanged,
    required this.onReset,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1B263B), // Dark navy slate
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Colors.black38,
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              // Animated Live Pulse Dot & Label
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFE65100),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    const Text(
                      'SIMULATE',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),

              // Play / Pause Button
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                icon: Icon(
                  isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
                  color: Colors.white,
                  size: 32,
                ),
                onPressed: onTogglePlay,
              ),
              const SizedBox(width: 6),

              // Speed Selector Chips: 1x, 5x, 20x
              Container(
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.all(2),
                child: Row(
                  children: [1.0, 5.0, 20.0].map((s) {
                    final selected = (speedMultiplier - s).abs() < 0.1;
                    return InkWell(
                      onTap: () => onSpeedChanged(s),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: selected ? const Color(0xFFE65100) : Colors.transparent,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          '${s.toInt()}x',
                          style: TextStyle(
                            color: selected ? Colors.white : Colors.white70,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const Spacer(),

              // Reset Button
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                icon: const Icon(Icons.replay, color: Colors.white70, size: 20),
                tooltip: 'Reset to Start',
                onPressed: onReset,
              ),

              // Close / Hide
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                icon: const Icon(Icons.close, color: Colors.white54, size: 18),
                tooltip: 'Hide Simulation Controls',
                onPressed: onClose,
              ),
            ],
          ),

          const SizedBox(height: 6),

          // Mini Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progressFraction.clamp(0.0, 1.0),
              backgroundColor: Colors.white12,
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFE65100)),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}
