# Form Data Extraction Tools

This directory contains tools for extracting and analyzing form data from the PMO API. These tools can help identify which forms contain a large amount of display text rather than actual input fields, which may be causing performance issues on mobile devices.

## Available Tools

### 1. Web-based Extractor

The web-based extractor provides a user-friendly interface for extracting and analyzing form data.

**File:** `form-data-extractor.html`

**Usage:**
1. Open the file in a web browser
2. Click the "Extract Form Data" button
3. Wait for the extraction to complete
4. Click the "Analyze Results" button to view the analysis

The web-based extractor provides a summary of the extracted data, including:
- Total number of categories, forms, and fields
- Categories with the most forms
- Forms with the most fields
- Forms with the most paragraphs (display text)

### 2. Command-line Extractor

The command-line extractor allows you to extract form data from the command line and save it to a JSON file.

**File:** `extract-form-data.js`

**Usage:**
```bash
# Make sure the script is executable
chmod +x extract-form-data.js

# Run the script
./extract-form-data.js [output-file]

# Example
./extract-form-data.js form-data.json
```

**Options:**
- `output-file`: The path to the output JSON file (default: `form-data.json`)

**Environment Variables:**
- `API_TOKEN`: The API token to use for authentication (optional)

### 3. JavaScript Library

The JavaScript library provides a reusable API for extracting form data programmatically.

**File:** `form-data-extractor.js`

**Usage:**
```javascript
// In a browser environment
FormDataExtractor.run()
  .then(data => {
    console.log('Extraction complete!', data);
  })
  .catch(error => {
    console.error('Error extracting form data:', error);
  });
```

## Output Location

The location of the output file depends on how you run the extraction tool:

1. **Web-based Extractor**: The file will be downloaded to your browser's default download location.

2. **Command-line Extractor**: By default, the file will be saved in the current working directory.
   - If you run the script from `/var/www/pmo-dev`, the file will be at `/var/www/pmo-dev/form-data.json`
   - You can specify a different location by providing a path argument:
     ```bash
     ./extract-form-data.js /path/to/form-data.json
     ```

## Sample Data

A sample data file (`form-data-sample.json`) is provided to show the expected structure of the output. This file contains example data for:

- A "Facilities" category with "Swimming Pool" and "Gym Equipment" forms
- A "Work Permit" category with a "General Work Permit" form

You can use this sample file to understand the data structure and test your analysis scripts without having to extract real data from the API.

## Output Format

The extracted data is saved in JSON format with the following structure:

```json
{
  "extractedAt": "2025-03-25T10:23:49.123Z",
  "categories": [
    {
      "id": 1,
      "name": "Category Name",
      "forms": [
        {
          "id": 1,
          "name": "Form Name",
          "fieldCount": 10,
          "fieldTypeCounts": {
            "text": 3,
            "paragraph": 2,
            "header": 1,
            "select": 2,
            "checkbox": 1,
            "radio": 1
          },
          "fields": [
            {
              "name": "field_name",
              "type": "text",
              "label": "Field Label",
              "required": true
            }
          ]
        }
      ]
    }
  ]
}
```

> **Note**: The sample data file (`form-data-sample.json`) provides a more comprehensive example of this structure.

## Analyzing the Data

When analyzing the extracted data, pay special attention to:

1. **Forms with many fields**: Forms with a large number of fields may cause performance issues on mobile devices.

2. **Forms with many paragraphs**: Forms with a large amount of display text (paragraphs) may cause rendering issues on mobile devices.

3. **Field type distribution**: Forms with a high ratio of display elements (paragraphs, headers) to input fields may be candidates for optimization.

## Optimizing Forms

Based on the analysis, you can optimize forms by:

1. **Splitting large forms**: Break large forms into smaller, more focused forms.

2. **Reducing display text**: Minimize the amount of explanatory text in forms.

3. **Using progressive disclosure**: Show only relevant fields based on previous selections.

4. **Implementing lazy loading**: Load form sections on demand rather than all at once.

5. **Optimizing images**: Ensure any images in forms are properly optimized for mobile devices.

## Troubleshooting

If you encounter issues with the extraction tools:

1. **Authentication errors**: Ensure you have a valid API token.

2. **Network errors**: Check your network connection and ensure the API is accessible.

3. **Memory errors**: If the extraction process runs out of memory, try extracting a subset of categories or forms.

4. **Parsing errors**: If the API returns malformed JSON, check the API response manually.

## Example Analysis

Here's an example of how to interpret the extracted data:

1. **Identify forms with many fields**:
   ```javascript
   const formsByFieldCount = allForms.sort((a, b) => b.fieldCount - a.fieldCount);
   console.log('Forms with most fields:', formsByFieldCount.slice(0, 5));
   ```

2. **Identify forms with many paragraphs**:
   ```javascript
   const formsByParagraphCount = allForms.sort((a, b) => {
     const aParagraphs = a.fieldTypeCounts?.paragraph || 0;
     const bParagraphs = b.fieldTypeCounts?.paragraph || 0;
     return bParagraphs - aParagraphs;
   });
   console.log('Forms with most paragraphs:', formsByParagraphCount.slice(0, 5));
   ```

3. **Calculate display text ratio**:
   ```javascript
   allForms.forEach(form => {
     const displayElements = (form.fieldTypeCounts?.paragraph || 0) + (form.fieldTypeCounts?.header || 0);
     const inputElements = form.fieldCount - displayElements;
     form.displayRatio = inputElements > 0 ? displayElements / inputElements : Infinity;
   });
   const formsByDisplayRatio = allForms.sort((a, b) => b.displayRatio - a.displayRatio);
   console.log('Forms with highest display ratio:', formsByDisplayRatio.slice(0, 5));