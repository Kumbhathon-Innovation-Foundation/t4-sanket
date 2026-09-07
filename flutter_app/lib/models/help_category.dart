import 'package:flutter/material.dart';

class HelpCategory {
  final String id;
  final String title;
  final String description;
  final IconData icon;
  final String routeName;

  const HelpCategory({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.routeName,
  });
}
