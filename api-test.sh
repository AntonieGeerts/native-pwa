#!/bin/bash
# API Test Script
# This script tests the API endpoints from the command line

# Default values
TOKEN=""
BASE_URL="http://localhost/app/api"

# Function to display usage
function show_usage {
  echo "Usage: $0 [options] <endpoint>"
  echo "Options:"
  echo "  -t, --token TOKEN    Authentication token"
  echo "  -h, --help           Show this help message"
  echo "Examples:"
  echo "  $0 -t your_token /ticket/ticket-category"
  echo "  $0 -t your_token /ticket/ticket-form"
  echo "  $0 -t your_token /ticket/ticket-forms-with-categories"
  echo "  $0 -t your_token /ticket/ticket-status"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--token)
      TOKEN="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
    *)
      ENDPOINT="$1"
      shift
      ;;
  esac
done

# Check if endpoint is provided
if [ -z "$ENDPOINT" ]; then
  echo "Error: No endpoint provided"
  show_usage
  exit 1
fi

# Make API request
echo "Making API request to: $BASE_URL$ENDPOINT"
echo "Using token: ${TOKEN:0:10}..."

# Use curl to make the request
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  "$BASE_URL$ENDPOINT")

# Extract HTTP status code and response body
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

# Print results
echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"