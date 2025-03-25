#!/bin/bash

# Script to prepare the www directory for Capacitor

# Create www directory if it doesn't exist
mkdir -p www

# Copy all HTML files
echo "Copying HTML files..."
cp *.html www/

# Copy assets directory
echo "Copying assets directory..."
cp -r assets www/

# Copy Puppertino directory
echo "Copying Puppertino directory..."
cp -r Puppertino www/

# Copy manifest.json
echo "Copying manifest.json..."
cp manifest.json www/

# Copy service-worker.js
echo "Copying service-worker.js..."
cp service-worker.js www/

# Copy any other necessary files
echo "Copying other necessary files..."
cp *.js www/ 2>/dev/null || true

echo "www directory prepared successfully!"