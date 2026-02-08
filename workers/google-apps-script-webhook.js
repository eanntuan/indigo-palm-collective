// Google Apps Script Webhook for Newsletter Signups
// Deploy this in Google Apps Script and get the webhook URL

function doPost(e) {
  try {
    // Parse the incoming JSON
    const data = JSON.parse(e.postData.contents);
    const email = data.email;

    // Open the spreadsheet
    const sheetId = '1WQLrcUaEz5O_OBLzTXet5Qn0WAmhS99xlxu-VPkcImM';
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Newsletter');

    // Add the new row with timestamp, email, and status
    const timestamp = new Date().toISOString();
    sheet.appendRow([timestamp, email, 'Active']);

    // Return success
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email added to newsletter'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Instructions to deploy:
// 1. Go to https://script.google.com
// 2. Create a new project
// 3. Paste this code
// 4. Click Deploy > New deployment
// 5. Select type: Web app
// 6. Execute as: Me
// 7. Who has access: Anyone
// 8. Deploy and copy the webhook URL
// 9. Add the webhook URL to your Cloudflare Worker environment variables as SHEETS_WEBHOOK_URL
