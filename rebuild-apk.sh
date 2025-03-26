#!/bin/bash

# Script to rebuild the APK with the latest changes

echo "Rebuilding APK with latest changes..."

# Step 1: Prepare the www directory
echo "Step 1: Preparing www directory..."
bash ./prepare-www.sh

# Step 2: Copy the updated files to the www directory
echo "Step 2: Ensuring all files are up to date..."
cp -r assets/js/capacitor-core.js www/assets/js/
cp -r assets/js/capacitor-init.js www/assets/js/
cp -r assets/js/capacitor.js www/assets/js/
cp -r assets/js/auth.js www/assets/js/
cp -r assets/js/services/api-service.js www/assets/js/services/
cp -r assets/js/services/ticket-service.js www/assets/js/services/
cp menu-mobile.html www/
cp service-worker.js www/
=======

# Step 3: Update capacitor.config.json
echo "Step 3: Updating capacitor.config.json..."
cp capacitor.config.json www/

# Step 4: Sync the changes to the native projects
echo "Step 4: Syncing changes to native projects..."
npx cap sync

# Step 5: Build the APK
echo "Step 5: Building the APK..."
bash ./build-apk.sh

echo "Rebuild complete! The new APK is available at: mandani-bay-community-app-debug.apk"