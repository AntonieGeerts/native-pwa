#!/bin/bash

# Script to build an APK file and copy it to the root directory

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# First, copy the app icons
echo "Copying app icons..."
bash "$SCRIPT_DIR/copy-app-icons.sh"

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
  
  # Copy the APK to the root directory with a new name
  echo "Copying APK to root directory..."
  cp app/build/outputs/apk/debug/app-debug.apk "$SCRIPT_DIR/mandani-bay-community-app-debug.apk"
  
  # Check if the copy was successful
  if [ $? -eq 0 ]; then
    echo "APK copied to root directory: mandani-bay-community-app-debug.apk"
    echo "You can download this file to test the app."
  else
    echo "Failed to copy APK to root directory."
  fi
else
  echo "Failed to build APK."
fi

# Return to the original directory
cd - > /dev/null