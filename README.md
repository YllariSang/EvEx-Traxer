# EvExTraxer

EvExTraxer is a Flutter app for creating and editing event run sheets in a card-based workflow, then generating printable output that matches a PDF-style layout.

It is designed to support both desktop and mobile usage from one codebase, with deployment targets for Windows and Android.

## What This App Is

EvExTraxer is built for event operations teams that need to quickly record and format run-sheet data.

Core capabilities:
- PDF-like page composition with header and footer elements
- Editable event log cards
- Editable product cards
- Print preview
- Direct print or export to PDF
- Shared Flutter codebase for Windows executable and Android APK

## Setup

### 1) Prerequisites
Install Flutter and verify your environment:

```bash
flutter doctor
```

If you are targeting Android, install Android Studio and required SDK components.

### 2) Clone and open project
From your local project folder, run:

```bash
flutter pub get
```

If platform folders ever need regeneration, run:

```bash
flutter create .
```

### 3) Run the app
Windows:

```bash
flutter run -d windows
```

Android device or emulator:

```bash
flutter run -d android
```

### 4) Build distributables
Windows release:

```bash
flutter build windows
```

Android APK release:

```bash
flutter build apk --release
```

Output locations:
- Windows: `build/windows/x64/runner/Release/`
- Android APK: `build/app/outputs/flutter-apk/app-release.apk`

## Tech Stack

### Framework and language
- Flutter
- Dart (SDK constraint: `>=3.3.0 <4.0.0`)

### Core packages
- `printing` and `pdf` for document generation and printing workflows
- `file_picker` and `path_provider` for file import/export and storage paths
- `shared_preferences` for lightweight local persistence
- `desktop_drop` for desktop drag-and-drop support
- `intl` for formatting and localization helpers
- `archive` for archive/file packaging utilities

### Platforms
- Windows desktop
- Android

## Development Notes

- App assets are stored in `assets/images/`
- Use `flutter analyze` for static checks
- Use `flutter test` for test runs

## Packaging Notes

For Windows distribution, build with `flutter build windows` and package the full release directory.

For Android store distribution, configure signing and build an app bundle:

```bash
flutter build appbundle --release
```
