import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class LocaleProvider extends ChangeNotifier {
  Locale? _currentLocale;

  Locale? get currentLocale => _currentLocale;

  void setLocale(BuildContext context, Locale locale) {
    if (_currentLocale != locale) {
      _currentLocale = locale;
      context.setLocale(locale);
      notifyListeners();
    }
  }
}
