#!/bin/bash

# Script to copy app icons to the appropriate locations for Capacitor

# Create directories if they don't exist
mkdir -p ios/App/App/Assets.xcassets/AppIcon.appiconset
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

# Copy iOS icons
echo "Copying iOS icons..."
cp -r AppIcons/Assets.xcassets/AppIcon.appiconset/* ios/App/App/Assets.xcassets/AppIcon.appiconset/

# Copy Android icons
echo "Copying Android icons..."
cp AppIcons/android/mipmap-hdpi/ic_launcher.png android/app/src/main/res/mipmap-hdpi/
cp AppIcons/android/mipmap-mdpi/ic_launcher.png android/app/src/main/res/mipmap-mdpi/
cp AppIcons/android/mipmap-xhdpi/ic_launcher.png android/app/src/main/res/mipmap-xhdpi/
cp AppIcons/android/mipmap-xxhdpi/ic_launcher.png android/app/src/main/res/mipmap-xxhdpi/
cp AppIcons/android/mipmap-xxxhdpi/ic_launcher.png android/app/src/main/res/mipmap-xxxhdpi/

echo "App icons copied successfully!"