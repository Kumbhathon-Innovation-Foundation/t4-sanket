import 'package:flutter_test/flutter_test.dart';
import 'package:anubhav_app/app.dart';

void main() {
  testWidgets('ANUBHAV App smoke test', (WidgetTester tester) async {
    expect(const AnubhavApp(), isNotNull);
  });
}
