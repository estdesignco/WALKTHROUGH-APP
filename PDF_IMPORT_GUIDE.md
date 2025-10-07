# PDF Import from Canva - User Guide

## Overview
The PDF import feature allows you to extract product links from Canva-exported PDFs and automatically import them into your project checklists. This streamlines the process of adding multiple products from design boards.

## How It Works

### 1. PDF Link Extraction
- Extracts clickable links from PDF annotations
- Scans PDF text content for URLs
- Filters links to include only trade vendor sites
- Excludes retail sites (Wayfair, Amazon, etc.) and Canva links

### 2. Supported Vendors
The system recognizes these trade vendor domains:
- lounards.com
- bernhardt.com  
- gabby.com
- visualcomfort.com
- lolahug.com
- hvlgroup.com
- globeviews.com
- safavieh.com
- surya.com
- eichholtz.com
- havefurniture.com

### 3. Product Import Process
- Scrapes product information from each valid link
- Extracts name, price, images, SKU, etc.
- Adds products to the first available subcategory in the selected room
- Tracks import progress and errors

## API Endpoints

### Start PDF Import
```
POST /api/import/pdf-links
```

**Parameters:**
- `file`: PDF file (multipart/form-data)
- `project_id`: Target project ID (query parameter)
- `room_id`: Target room ID (query parameter)

**Response:**
```json
{
  "success": true,
  "job_id": "uuid-string",
  "message": "PDF import started for Room Name"
}
```

### Check Import Status
```
GET /api/import/pdf-job/{job_id}
```

**Response:**
```json
{
  "id": "job-id",
  "type": "pdf_import",
  "project_id": "project-id",
  "project_name": "Project Name",
  "room_id": "room-id", 
  "room_name": "Room Name",
  "filename": "canva-export.pdf",
  "status": "completed",
  "total_links": 15,
  "imported_items": 12,
  "failed_items": 3,
  "created_at": "2025-01-07T22:45:21.747640",
  "updated_at": "2025-01-07T22:46:15.123456",
  "errors": ["link1: Scrape failed", "link2: Product not found"]
}
```

## Status Values
- `pending`: Job created, waiting to start
- `processing`: Extracting links and importing products
- `completed`: Import finished successfully
- `failed`: Import failed due to error

## Usage Example

### Using cURL
```bash
# Start import
curl -X POST "http://localhost:8001/api/import/pdf-links?project_id=PROJECT_ID&room_id=ROOM_ID" \
  -F "file=@canva-export.pdf"

# Check status
curl "http://localhost:8001/api/import/pdf-job/JOB_ID"
```

### Using JavaScript/Frontend
```javascript
// Start import
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch(`/api/import/pdf-links?project_id=${projectId}&room_id=${roomId}`, {
  method: 'POST',
  body: formData
});

const result = await response.json();
const jobId = result.job_id;

// Poll for status
const checkStatus = async () => {
  const statusResponse = await fetch(`/api/import/pdf-job/${jobId}`);
  const status = await statusResponse.json();
  
  if (status.status === 'completed') {
    console.log(`Import complete: ${status.imported_items}/${status.total_links} items imported`);
  } else if (status.status === 'failed') {
    console.error('Import failed:', status.errors);
  } else {
    // Still processing, check again in a few seconds
    setTimeout(checkStatus, 3000);
  }
};

checkStatus();
```

## Best Practices

### PDF Preparation
1. **Use Clickable Links**: Ensure your Canva design has clickable links, not just text URLs
2. **Trade Vendor Links**: Use direct product links from supported trade vendor sites
3. **Avoid Retail Links**: The system will filter out retail sites like Wayfair, Amazon, etc.

### Import Process
1. **Select Correct Room**: Choose the room where products should be added
2. **Monitor Progress**: Use the job status endpoint to track import progress
3. **Review Results**: Check imported items and handle any failed imports manually

### Error Handling
- **No Links Found**: PDF may not contain clickable links or supported vendor URLs
- **Scraping Failures**: Some product pages may be inaccessible or have changed structure
- **No Subcategory**: Target room must have at least one category with subcategories

## Troubleshooting

### Common Issues

**"No product links found in PDF"**
- PDF doesn't contain clickable links
- Links are to unsupported vendors
- Links are retail sites (filtered out)

**"No subcategory found in room"**
- Target room has no categories
- Categories exist but have no subcategories
- Create room structure first

**"Scrape failed" errors**
- Product page is inaccessible
- Vendor site structure changed
- Network connectivity issues

### Support
For technical issues or to add support for new vendor sites, contact the development team with:
- PDF file (if possible)
- Project and room IDs
- Error messages from job status
- Vendor sites that should be supported