#!/bin/bash

# Script to update all HTML files to include Capacitor initialization scripts

# Find all HTML files in the current directory
HTML_FILES=$(find . -maxdepth 1 -name "*.html")

# Loop through each HTML file
for file in $HTML_FILES; do
  echo "Processing $file..."
  
  # Check if the file already has the Capacitor scripts
  if grep -q "capacitor-core.js" "$file"; then
    echo "  Capacitor scripts already included in $file, skipping..."
    continue
  fi
  
  # Find the line with the first script tag
  FIRST_SCRIPT_LINE=$(grep -n "<script" "$file" | head -n 1 | cut -d: -f1)
  
  if [ -z "$FIRST_SCRIPT_LINE" ]; then
    echo "  No script tags found in $file, skipping..."
    continue
  fi
  
  # Create a temporary file
  TMP_FILE=$(mktemp)
  
  # Copy the content up to the first script line
  head -n $FIRST_SCRIPT_LINE "$file" > "$TMP_FILE"
  
  # Add the Capacitor scripts
  echo "  <!-- Capacitor Core and Initialization -->" >> "$TMP_FILE"
  echo "  <script src=\"assets/js/capacitor-core.js?v=20250325\"></script>" >> "$TMP_FILE"
  echo "  <script src=\"assets/js/capacitor-init.js?v=20250325\"></script>" >> "$TMP_FILE"
  echo "" >> "$TMP_FILE"
  
  # Copy the rest of the file
  tail -n +$((FIRST_SCRIPT_LINE + 1)) "$file" >> "$TMP_FILE"
  
  # Replace the original file
  mv "$TMP_FILE" "$file"
  
  echo "  Updated $file with Capacitor scripts"
done

echo "All HTML files have been updated!"