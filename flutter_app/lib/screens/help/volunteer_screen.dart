import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_strings.dart';

class VolunteerScreen extends StatelessWidget {
  const VolunteerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text(AppStrings.helpVolunteer.tr()),
        backgroundColor: AppColors.surface,
      ),
      body: const Center(
        child: Text('Volunteer Desk Placeholder'),
      ),
    );
  }
}
