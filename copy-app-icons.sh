#!/bin/bash

# Script to copy app icons to the appropriate locations for Capacitor

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create directories if they don't exist
mkdir -p "$SCRIPT_DIR/ios/App/App/Assets.xcassets/AppIcon.appiconset"
mkdir -p "$SCRIPT_DIR/android/app/src/main/res/mipmap-hdpi"
mkdir -p "$SCRIPT_DIR/android/app/src/main/res/mipmap-mdpi"
mkdir -p "$SCRIPT_DIR/android/app/src/main/res/mipmap-xhdpi"
mkdir -p "$SCRIPT_DIR/android/app/src/main/res/mipmap-xxhdpi"
mkdir -p "$SCRIPT_DIR/android/app/src/main/res/mipmap-xxxhdpi"

# Copy iOS icons
echo "Copying iOS icons..."
if [ -d "$SCRIPT_DIR/AppIcons/Assets.xcassets/AppIcon.appiconset" ]; then
  cp -r "$SCRIPT_DIR/AppIcons/Assets.xcassets/AppIcon.appiconset/"* "$SCRIPT_DIR/ios/App/App/Assets.xcassets/AppIcon.appiconset/"
else
  echo "iOS icon directory not found, skipping..."
fi

# Copy Android icons
echo "Copying Android icons..."
# Copy standard icons
if [ -f "$SCRIPT_DIR/AppIcons/android/mipmap-hdpi/ic_launcher.png" ]; then
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-hdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-hdpi/"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-mdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-mdpi/"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-xhdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-xhdpi/"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-xxhdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-xxhdpi/"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-xxxhdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-xxxhdpi/"

  # Copy the same icons as foreground icons (for adaptive icons)
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-hdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-mdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-xhdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-xxhdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-xxxhdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png"

  # Copy the same icons as round icons
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-hdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-mdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-xhdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-xxhdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png"
  cp "$SCRIPT_DIR/AppIcons/android/mipmap-xxxhdpi/ic_launcher.png" "$SCRIPT_DIR/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png"
  
  echo "Android icons copied successfully!"
else
  echo "Android icon files not found, skipping..."
fi

echo "App icons process completed!"