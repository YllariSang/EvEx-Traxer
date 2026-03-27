import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:evextraxer/main.dart';

void main() {
  testWidgets('App boots to dashboard', (tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const RunSheetApp());
    await tester.pump(const Duration(milliseconds: 600));

    expect(find.text('EvExTraxer Dashboard'), findsOneWidget);
  });

  test('Merge import mode appends works', () {
    final existing = [
      WorkSheet(
        id: 'a',
        name: 'Existing',
        data: RunSheetData.seed(),
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      ),
    ];

    final incoming = [
      WorkSheet(
        id: 'b',
        name: 'Imported',
        data: RunSheetData.seed(),
        createdAt: DateTime(2026, 1, 2),
        updatedAt: DateTime(2026, 1, 2),
      ),
    ];

    final merged = WorkStorage.mergeWorks(
      existingWorks: existing,
      importedWorks: incoming,
      mode: ImportMode.merge,
    );

    expect(merged.length, 2);
    expect(merged.first.name, 'Existing');
    expect(merged.last.name, 'Imported');
  });

  test('Replace import mode replaces works', () {
    final existing = [
      WorkSheet(
        id: 'a',
        name: 'Existing',
        data: RunSheetData.seed(),
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      ),
    ];

    final incoming = [
      WorkSheet(
        id: 'b',
        name: 'Imported',
        data: RunSheetData.seed(),
        createdAt: DateTime(2026, 1, 2),
        updatedAt: DateTime(2026, 1, 2),
      ),
    ];

    final replaced = WorkStorage.mergeWorks(
      existingWorks: existing,
      importedWorks: incoming,
      mode: ImportMode.replace,
    );

    expect(replaced.length, 1);
    expect(replaced.first.name, 'Imported');
  });

  test('RunSheetData serialization roundtrip keeps product fit', () {
    final data = RunSheetData.seed();
    data.products.first.photoFit = PhotoFit.cover;
    final roundtrip = RunSheetData.fromJson(data.toJson());

    expect(roundtrip.products.first.photoFit, PhotoFit.cover);
  });
}
