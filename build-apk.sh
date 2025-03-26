#!/bin/bash

# Script to build an APK file and copy it to the root directory

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VERSION_FILE="$SCRIPT_DIR/version.txt"

# --- Version Handling ---
# Ensure version file exists, initialize if not
if [ ! -f "$VERSION_FILE" ]; then
  echo "Version file not found, initializing to 0.00"
  echo "0.00" > "$VERSION_FILE"
fi

# Read current version
CURRENT_VERSION=$(cat "$VERSION_FILE")

# Increment version (using awk for floating point, handle potential empty input)
NEW_VERSION=$(awk -v ver="$CURRENT_VERSION" 'BEGIN { if (ver == "") ver = "0.00"; printf "%.2f", ver + 0.01 }')

# Save new version
echo "$NEW_VERSION" > "$VERSION_FILE"
echo "Updated version to $NEW_VERSION"

# Copy version file to www directory for the app to read
cp "$VERSION_FILE" "$SCRIPT_DIR/www/version.txt"
echo "Copied version.txt to www/"
# --- End Version Handling ---

# First, copy the app icons
echo "Copying app icons..."
bash "$SCRIPT_DIR/copy-app-icons.sh"

# Clear npm cache before syncing
echo "Clearing npm cache..."
(cd "$SCRIPT_DIR" && npm cache clean --force)

echo "Syncing web assets to Android project..."
# Use npm run script which might handle paths better
# Need to run it from the correct directory ($SCRIPT_DIR is pmo_native-app)
(cd "$SCRIPT_DIR" && npm run sync -- android)

# Check if sync was successful
if [ $? -ne 0 ]; then
  echo "Capacitor sync failed. Aborting build."
  exit 1
fi

echo "Building APK file..."

# Navigate to the Android project directory
cd "$SCRIPT_DIR/android"

# Clean the project
echo "Cleaning the project..."
./gradlew clean

# Build the debug APK
echo "Building debug APK..."
./gradlew assembleDebug

# Check if the build was successful
if [ $? -eq 0 ]; then
  echo "APK built successfully!"
  
  # Define the new APK filename with version
  APK_FILENAME="mandani-bay-community-app-debug-v${NEW_VERSION}.apk"
  
  # Copy the APK to the root directory with the new versioned name
  echo "Copying APK to root directory as $APK_FILENAME..."
  cp app/build/outputs/apk/debug/app-debug.apk "$SCRIPT_DIR/$APK_FILENAME"
  
  # Check if the copy was successful
  if [ $? -eq 0 ]; then
    echo "APK copied to root directory: $APK_FILENAME"
    echo "You can download this file to test the app."
  else
    echo "Failed to copy APK to root directory."
  fi
else
  echo "Failed to build APK."
fi

# Return to the original directory
cd - > /dev/null