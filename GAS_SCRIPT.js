/**
 * Google Apps Script for Performance Dashboard Content Management
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the code in Code.gs with this script.
 * 4. Click "Deploy" > "New Deployment".
 * 5. Select "Web App".
 * 6. Set "Execute as" to "Me".
 * 7. Set "Who has access" to "Anyone".
 * 8. Copy the Web App URL and paste it into your .env.example (and AI Studio settings) as VITE_GAS_URL.
 */

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const content = {};
  
  // Skip header if you have one, or start from 0
  for (let i = 0; i < data.length; i++) {
    const id = data[i][0]; // Column A: section_id
    const val = data[i][1]; // Column B: content
    if (id) content[id] = val;
  }
  
  return ContentService.createTextOutput(JSON.stringify(content))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const payload = JSON.parse(e.postData.contents);
  
  // Handle both single update and array of updates
  const updates = Array.isArray(payload) ? payload : [payload];
  
  updates.forEach(update => {
    const sectionId = update.section_id;
    const content = update.content;
    
    if (!sectionId) return;
    
    const data = sheet.getDataRange().getValues();
    let foundIndex = -1;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] == sectionId) {
        foundIndex = i + 1; // 1-indexed for sheets
        break;
      }
    }
    
    if (foundIndex !== -1) {
      // Update existing row (Column B is index 2)
      sheet.getRange(foundIndex, 2).setValue(content);
    } else {
      // Append new row
      sheet.appendRow([sectionId, content]);
    }
  });

  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
