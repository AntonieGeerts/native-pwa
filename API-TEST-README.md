# API Testing Tools

This directory contains several tools to help troubleshoot API calls to the server. These tools can be used to test the API endpoints and diagnose issues with the API calls.

## Available Tools

1. **api-test.html** - A web-based tool for testing API endpoints
2. **api-test.php** - A PHP script for testing API endpoints from the server side
3. **api-test.sh** - A shell script for testing API endpoints from the command line
4. **api-test.js** - A Node.js script for testing API endpoints

## Web-based Tool (api-test.html)

This is a simple HTML page that allows you to test API endpoints through a web interface.

### Usage

1. Open the file in a web browser: `http://localhost/api-test.html`
2. Enter your authentication token or use the existing token from localStorage
3. Click on the buttons to test different API endpoints
4. View the results in the pre-formatted text areas

## PHP Script (api-test.php)

This script tests the API endpoints directly from the server side using cURL.

### Usage

```
http://localhost/api-test.php?endpoint=/ticket/ticket-category&token=your_token
```

### Parameters

- `endpoint` - The API endpoint to test (required)
- `token` - Your authentication token (optional)

## Shell Script (api-test.sh)

This script tests the API endpoints from the command line using curl.

### Usage

```bash
./api-test.sh -t your_token /ticket/ticket-category
```

### Options

- `-t, --token TOKEN` - Your authentication token
- `-h, --help` - Show help message

### Examples

```bash
./api-test.sh -t your_token /ticket/ticket-category
./api-test.sh -t your_token /ticket/ticket-form
./api-test.sh -t your_token /ticket/ticket-forms-with-categories
./api-test.sh -t your_token /ticket/ticket-status
```

## Node.js Script (api-test.js)

This script tests the API endpoints using Node.js.

### Usage

```bash
node api-test.js --token=your_token --endpoint=/ticket/ticket-category
```

### Options

- `--token=TOKEN` - Your authentication token
- `--endpoint=ENDPOINT` - The API endpoint to test
- `--url=URL` - The base URL of the API (default: http://localhost/app/api)

## Troubleshooting API Issues

1. **Authentication Issues**
   - Check if your token is valid
   - Check if your token has expired
   - Check if your token has the necessary permissions

2. **Endpoint Issues**
   - Check if the endpoint exists
   - Check if the endpoint is spelled correctly
   - Check if the endpoint requires additional parameters

3. **Response Issues**
   - Check the HTTP status code
   - Check the response body for error messages
   - Check the server logs for additional information

## Common API Endpoints

- `/ticket/ticket-category` - Get all ticket categories
- `/ticket/ticket-form` - Get all ticket forms
- `/ticket/ticket-forms-with-categories` - Get all ticket forms with categories
- `/ticket/ticket-status` - Get all ticket statuses
- `/ticket/ticket-form/{id}` - Get a specific ticket form
- `/ticket/ticket-entry` - Get all ticket entries