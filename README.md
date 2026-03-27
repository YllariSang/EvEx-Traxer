# EvExTraxer

Card-based run sheet editor that recreates your PDF layout with:
- PDF-like header/footer (logos + department block + signatures)
- Editable event log cards
- Editable product cards
- Print preview and direct print/export to PDF
- Single codebase intended for Windows `.exe` and Android `.apk`

## 1) Install Flutter
1. Download Flutter SDK: https://docs.flutter.dev/get-started/install
2. Add Flutter to PATH.
3. Run:
   ```bash
   flutter doctor
   ```

## 2) Initialize platform folders (first time only)
From this project folder:
```bash
flutter create .
```

## 3) Get packages
```bash
flutter pub get
```

## 4) Run app
```bash
flutter run -d windows
```
Or for Android device/emulator:
```bash
flutter run -d android
```

## 5) Build distributables
Build Windows executable:
```bash
flutter build windows
```
Output:
- `build/windows/x64/runner/Release/` (contains the EXE)

Build Android APK:
```bash
flutter build apk --release
```
Output:
- `build/app/outputs/flutter-apk/app-release.apk`

## Notes
- Source template PDF used: `run_sheet.pdf`
- Header logos extracted into `assets/images/`
- Edit data in Event/Product tabs, then print from Print Preview tab.

## Release Checklist
- [ ] Run static analysis: `flutter analyze`
- [ ] Run smoke tests: `flutter test`
- [ ] Build Windows release: `flutter build windows`
- [ ] Verify app launch from `build/windows/x64/runner/Release/`
- [ ] Confirm export/import works with sample photos
- [ ] Confirm print output matches run sheet layout

## Windows Packaging
1. Build release: `flutter build windows`
2. Zip the full `build/windows/x64/runner/Release/` folder
3. Share the zip to users and run `evextraxer.exe` after extraction

For installer-based distribution, create MSIX or Inno Setup package from the Release output.

## Android Signing Notes
1. Install Android Studio + SDK and accept licenses:
   - `flutter doctor --android-licenses`
2. Create a signing keystore:
   - `keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
3. Configure `android/key.properties` and Gradle signing config
4. Build signed app:
   - APK: `flutter build apk --release`
   - AAB: `flutter build appbundle --release`
