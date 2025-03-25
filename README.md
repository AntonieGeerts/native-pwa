# PMO Native App

A Progressive Web App (PWA) with native capabilities using CapacitorJS for Property Management Office.

## Features

- User authentication with Laravel backend
- QR code generation for access
- Rewards points tracking
- Notifications system
- Dark mode support
- Offline capabilities
- Apple-like design using Puppertino framework

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

## Building for Native Platforms

### Android

```bash
# Add Android platform
npm run add:android

# Build with icons
npm run build:with-icons

# Open in Android Studio
npm run open:android
```

### iOS

```bash
# Add iOS platform
npm run add:ios

# Build with icons
npm run build:with-icons

# Open in Xcode
npm run open:ios
```

## App Icons

The app uses icons from the `AppIcons` folder, which contains all necessary sizes for both iOS and Android platforms:

- iOS: `AppIcons/Assets.xcassets/AppIcon.appiconset`
- Android: `AppIcons/android/mipmap-*`

When building for native platforms, the icons are automatically copied to the appropriate locations using the `copy-app-icons.sh` script.

## Project Structure

- `src/`: Source files for the web app
- `assets/`: Static assets (CSS, JS, images)
- `AppIcons/`: App icons for iOS and Android
- `android/`: Android platform files (generated)
- `ios/`: iOS platform files (generated)

## Technologies Used

- HTML5, CSS3, JavaScript
- CapacitorJS for native capabilities
- Puppertino CSS framework for Apple-like design
- Laravel backend for API

## License

This project is licensed under the ISC License.# native-pmo-app
# native-pwa
