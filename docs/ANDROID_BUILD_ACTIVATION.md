# Nomad Android Build Activation Guide

## Purpose

This guide defines the steps required to make `android-nomad/` buildable as a development Android project.

This guide does **not** make Nomad production-ready. Real funds remain disabled until production blockers are resolved, tests pass, release signing is complete, and external audit is complete.

---

## Current Status

Nomad currently contains an Android-native scaffold under:

```txt
android-nomad/
```

The scaffold is intended for:

- development builds
- architecture validation
- UI wiring
- safety-flow testing
- future production implementation

It is not intended for real funds.

---

## Required Local Tools

Recommended baseline:

- Android Studio current stable release
- JDK 17 or newer
- Android SDK installed through Android Studio
- Android Gradle Plugin compatible with the selected Android Studio version
- Kotlin support enabled

---

## Expected Project Structure

The Android project should resolve around this structure:

```txt
android-nomad/
  settings.gradle
  build.gradle
  app/
    build.gradle
    src/main/
      AndroidManifest.xml
      java/protocols/voltaire/nomad/
```

Package identity:

```txt
protocols.voltaire.nomad
```

---

## Build Activation Checklist

- [ ] Confirm `android-nomad/settings.gradle`
- [ ] Confirm root `android-nomad/build.gradle`
- [ ] Confirm `android-nomad/app/build.gradle`
- [ ] Confirm Android namespace is `protocols.voltaire.nomad`
- [ ] Confirm `minSdk`, `targetSdk`, and `compileSdk`
- [ ] Confirm Kotlin plugin configuration
- [ ] Confirm app manifest exists
- [ ] Confirm `MainActivity` is registered
- [ ] Confirm debug build runs
- [ ] Confirm release build remains blocked for real funds

---

## Development Build Command

Once Gradle files are active, a developer should be able to run:

```bash
cd android-nomad
./gradlew assembleDebug
```

Or open `android-nomad/` directly in Android Studio and run the debug app.

---

## Release Safety Rule

A successful debug build does not mean Nomad is safe for production.

Release builds must remain blocked while any of the following are wired:

```txt
DevelopmentWalletEngine
InMemorySecureStorageGateway
DevelopmentNfcPaymentGateway
DevelopmentBlockpagesSafetyClient
BasicTravelPocketManager
```

---

## Next Steps After Build Activation

After the debug build works:

1. Add CI build validation
2. Add release safety checks
3. Add unit tests for Travel Pocket caps
4. Add unit tests for NFC request-only behavior
5. Add unit tests for owner confirmation enforcement
6. Start replacing development implementations with production implementations

---

## Final Rule

The build system must help developers move faster without weakening Nomad's safety model.
