class User {
  final String id;
  final String name;
  final String phoneNumber;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String fcmToken;
  
  const User({
    required this.id,
    required this.name,
    required this.phoneNumber,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    required this.fcmToken,
  });
}
