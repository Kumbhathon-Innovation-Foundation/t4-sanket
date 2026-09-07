import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

class LocationProvider extends ChangeNotifier {
  LatLng? _currentLocation;
  bool _isLoading = false;
  String? _error;

  LatLng? get currentLocation => _currentLocation;
  bool get isLoading => _isLoading;
  String? get error => _error;

  LocationProvider() {
    _initLocation();
  }

  Future<void> _initLocation() async {
    _isLoading = true;
    notifyListeners();

    // Mock initial location to Nashik (Godavari River near Ramkund)
    await Future.delayed(const Duration(seconds: 1));
    _currentLocation = const LatLng(19.9975, 73.7898);
    
    _isLoading = false;
    notifyListeners();
  }

  void updateLocation(LatLng newLocation) {
    _currentLocation = newLocation;
    notifyListeners();
  }
}
