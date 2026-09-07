import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_strings.dart';
import '../constants/app_text_styles.dart';
import '../providers/route_provider.dart';
import '../widgets/voice_assistant_sheet.dart';

class SearchBarWidget extends StatefulWidget {
  final ValueChanged<String>? onSubmitted;
  const SearchBarWidget({super.key, this.onSubmitted});

  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  final TextEditingController _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleSearch(String query) {
    if (query.trim().isEmpty) return;
    if (widget.onSubmitted != null) {
      widget.onSubmitted!(query);
    } else {
      final routeProvider = Provider.of<RouteProvider>(context, listen: false);
      routeProvider.fetchItinerary(message: query);
      context.go('/route');
    }
  }

  void _openVoiceAssistant() {
    final routeProvider = Provider.of<RouteProvider>(context, listen: false);
    VoiceAssistantSheet.show(
      context,
      onPlanGenerated: (newItinerary, {bool autoStart = true}) {
        routeProvider.fetchItinerary(message: newItinerary.summaryText);
        context.go('/route');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(100),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: _controller,
        onSubmitted: _handleSearch,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: AppStrings.homeSearchHint.tr(),
          hintStyle: AppTextStyles.bodyLg.copyWith(
            color: AppColors.onSurfaceVariant.withValues(alpha: 0.6),
          ),
          prefixIcon: const Padding(
            padding: EdgeInsets.only(left: 16, right: 12),
            child: Icon(Icons.search, color: AppColors.onSurface, size: 28),
          ),
          suffixIcon: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButton(
              icon: const Icon(Icons.mic, color: AppColors.primary, size: 28),
              tooltip: 'Voice Search',
              onPressed: _openVoiceAssistant,
            ),
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }
}
