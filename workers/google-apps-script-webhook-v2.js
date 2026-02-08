// Google Apps Script Webhook for Newsletter Signups v2
// Fixed response handling

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
    const response = {
      success: true,
      message: 'Email added to newsletter'
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error
    const response = {
      success: false,
      error: error.toString()
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function you can run manually
function testWebhook() {
  const testData = {
    postData: {
      contents: JSON.stringify({ email: 'test@example.com' })
    }
  };

  const result = doPost(testData);
  Logger.log(result.getContent());
}
