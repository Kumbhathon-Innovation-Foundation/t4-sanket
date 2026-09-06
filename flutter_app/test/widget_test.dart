import 'package:flutter_test/flutter_test.dart';
import 'package:anubhav_app/main.dart';

void main() {
  testWidgets('ANUBHAV App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const AnubhavApp());
    expect(find.text('ANUBHAV अनुभव'), findsOneWidget);
  });
}
