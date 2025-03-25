# Capacitor Native Conversion Guide

This guide provides step-by-step instructions for converting the PMO Native App to native Android and iOS applications using Capacitor.js.

## Prerequisites

Before you begin, ensure you have the following installed:

### For Both Platforms
- Node.js (v16 or later)
- npm (v8 or later)
- Git

### For Android Development
- Android Studio (latest version)
- Android SDK (API level 33 or higher)
- Java Development Kit (JDK) 11 or higher

### For iOS Development
- macOS (required for iOS development)
- Xcode (latest version)
- CocoaPods
- iOS 14 or higher

## Project Setup

The project has already been configured with Capacitor.js. The following files are key to the Capacitor setup:

- `capacitor.config.ts` - Configuration for Capacitor
- `package.json` - NPM dependencies and scripts
- `assets/js/capacitor-init.js` - Initialization script for Capacitor plugins

## Step 1: Install Dependencies

First, install all the required dependencies:

```bash
cd pmo_native-app
npm run install:plugins
```

This will install all the Capacitor plugins and sync the project.

## Step 2: Prepare for Android

To prepare the project for Android:

```bash
npm run prepare:android
```

This script will:
1. Build the web app
2. Copy app icons
3. Add the Android platform
4. Sync the project with Android

## Step 3: Prepare for iOS

To prepare the project for iOS (requires macOS):

```bash
npm run prepare:ios
```

This script will:
1. Build the web app
2. Copy app icons
3. Add the iOS platform
4. Sync the project with iOS

## Step 4: Customize Native Projects

### Android Customization

After adding the Android platform, you can customize the Android project:

1. Open the Android project in Android Studio:
   ```bash
   npm run open:android
   ```

2. Update the app's theme in `android/app/src/main/res/values/styles.xml`:
   ```xml
   <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
       <item name="colorPrimary">@color/colorPrimary</item>
       <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
       <item name="colorAccent">@color/colorAccent</item>
   </style>
   ```

3. Update colors in `android/app/src/main/res/values/colors.xml`:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <resources>
       <color name="colorPrimary">#7F126E</color>
       <color name="colorPrimaryDark">#5E0E52</color>
       <color name="colorAccent">#DA848C</color>
   </resources>
   ```

4. Configure Firebase for push notifications (optional):
   - Create a Firebase project
   - Add your Android app to Firebase
   - Download `google-services.json` and place it in `android/app/`
   - Add Firebase dependencies to `android/app/build.gradle`

### iOS Customization

After adding the iOS platform, you can customize the iOS project:

1. Open the iOS project in Xcode:
   ```bash
   npm run open:ios
   ```

2. Update the app's Info.plist:
   - Set the display name
   - Configure privacy descriptions for camera, location, etc.
   - Set up URL schemes if needed

3. Update the app's appearance:
   - Set the status bar style
   - Configure the app's theme colors

4. Configure Firebase for push notifications (optional):
   - Add your iOS app to Firebase
   - Download `GoogleService-Info.plist` and add it to your Xcode project
   - Add Firebase dependencies to your Podfile

## Step 5: Build and Run

### Build and Run on Android

```bash
npm run build:android
```

This will build the web app, sync with Android, and open Android Studio. From there, you can:
1. Select a device or emulator
2. Click the "Run" button to build and run the app

### Build and Run on iOS

```bash
npm run build:ios
```

This will build the web app, sync with iOS, and open Xcode. From there, you can:
1. Select a device or simulator
2. Click the "Run" button to build and run the app

## Step 6: Testing

### Testing on Android

1. Test on multiple device sizes (phone and tablet)
2. Test on different Android versions (API level 24+)
3. Test offline functionality
4. Test push notifications
5. Test deep linking

### Testing on iOS

1. Test on multiple device sizes (iPhone and iPad)
2. Test on different iOS versions (iOS 14+)
3. Test offline functionality
4. Test push notifications
5. Test deep linking

## Step 7: Debugging

### Debugging Android

1. Use Chrome DevTools for WebView debugging:
   - Open Chrome
   - Navigate to `chrome://inspect/#devices`
   - Find your app and click "inspect"

2. Use Android Studio's Logcat for native logs

### Debugging iOS

1. Use Safari Web Inspector for WebView debugging:
   - Enable Web Inspector in iOS Settings
   - Connect your device to your Mac
   - Open Safari Developer menu and select your device

2. Use Xcode's Console for native logs

## Step 8: Preparing for Production

### Android Production Build

1. Create a signing key:
   ```bash
   keytool -genkey -v -keystore pmo-app-key.keystore -alias pmo-app -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle`

3. Build a release APK or AAB:
   - In Android Studio, select Build > Generate Signed Bundle/APK

### iOS Production Build

1. Configure app signing in Xcode:
   - Set up an Apple Developer account
   - Create app identifiers and provisioning profiles

2. Archive the app for distribution:
   - In Xcode, select Product > Archive
   - Follow the distribution workflow

## Common Issues and Solutions

### Android Issues

1. **Gradle Sync Failed**
   - Update Gradle version in `android/gradle/wrapper/gradle-wrapper.properties`
   - Update Android Gradle Plugin in `android/build.gradle`

2. **WebView Not Loading**
   - Check network permissions in AndroidManifest.xml
   - Verify the server URL in capacitor.config.ts

### iOS Issues

1. **App Not Building**
   - Update CocoaPods: `sudo gem install cocoapods`
   - Reinstall pods: `cd ios/App && pod install`

2. **Push Notifications Not Working**
   - Verify push notification entitlements
   - Check provisioning profile capabilities

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Documentation](https://developer.android.com/docs)
- [iOS Developer Documentation](https://developer.apple.com/documentation/)

## Updating Capacitor

To update Capacitor and its plugins:

```bash
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/android@latest @capacitor/ios@latest
# Update other plugins as needed
npm run update:all
```

## Conclusion

Following this guide, you should be able to successfully convert the PMO Native App to native Android and iOS applications using Capacitor.js. The app will maintain its web-based functionality while gaining access to native device features through Capacitor plugins.