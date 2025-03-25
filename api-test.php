<?php
/**
 * API Test Script
 * This script tests the API endpoints directly from the server side
 */

// Set headers
header('Content-Type: application/json');

// Function to make API request
function makeApiRequest($endpoint, $method = 'GET', $data = null) {
    // Get token from query parameter or use a default test token
    $token = $_GET['token'] ?? '';
    
    // API URL
    $url = "http://localhost/app/api{$endpoint}";
    
    // Initialize cURL
    $ch = curl_init();
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // Set headers
    $headers = [
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ];
    
    if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            $headers[] = 'Content-Type: application/json';
        }
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    // Execute cURL request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    // Close cURL
    curl_close($ch);
    
    // Return response
    return [
        'status' => $httpCode,
        'response' => $response ? json_decode($response, true) : null,
        'error' => $error
    ];
}

// Get endpoint from query parameter
$endpoint = $_GET['endpoint'] ?? '';

// Check if endpoint is provided
if (empty($endpoint)) {
    echo json_encode([
        'error' => 'No endpoint provided',
        'usage' => 'api-test.php?endpoint=/ticket/ticket-category&token=your_token'
    ]);
    exit;
}

// Make API request
$result = makeApiRequest($endpoint);

// Output result
echo json_encode($result, JSON_PRETTY_PRINT);