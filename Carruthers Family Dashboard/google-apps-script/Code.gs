/**
 * ===================================================================
 * Carruthers Family Dashboard - Google Apps Script Backend
 * ===================================================================
 * 
 * Instructions to deploy:
 * 1. Open your Google Sheet:
 *    https://docs.google.com/spreadsheets/d/18zTLMGamINNzKpLDZ8uLBKh9cnVI4n0H4zWfFHOWqVU/edit
 * 2. In the top menu, click Extensions > Apps Script.
 * 3. Replace any code in Code.gs with this entire file.
 * 4. Click the blue "Deploy" button at the top right > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set:
 *    - Description: "Family Dashboard Sync"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (allows the dashboard to sync without logging in)
 * 7. Click "Deploy", authorize permissions when prompted, and copy the Web App URL.
 *    (It looks like: https://script.google.com/macros/s/.../exec)
 * 8. Open the Carruthers Family Dashboard, click the Settings (gear) icon in the top right,
 *    paste the URL into "Google Apps Script Web App URL", and click "Save Settings".
 * ===================================================================
 */

const DRIVE_FOLDER_ID = '1f-T8J2NSoASwqeqrZXSY2ROAXJVIhtWy';
const MEALS_SHEET_NAME = 'MealPlan';
const GROCERIES_SHEET_NAME = 'Groceries';
const TODO_SHEET_ID = '1Q1fBDl4xjNHxFl4WVvP9oYj1yytrlkq1E1SUfsGzVkg';
const TODO_SHEET_NAME = 'Tasks';

/**
 * Handle HTTP GET Requests
 * Returns current meals, groceries, to-dos, and Google Drive photos as JSON.
 */
function doGet(e) {
  try {
    const data = {
      status: 'success',
      timestamp: new Date().toISOString(),
      meals: getMealsFromSheet(),
      groceries: getGroceriesFromSheet(),
      todos: getTodosFromSheet(),
      photos: getPhotosFromDrive(DRIVE_FOLDER_ID)
    };

    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HTTP POST Requests
 * Updates meals, groceries, and to-dos in the Google Sheets and returns updated state.
 */
function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : '{}';
    const payload = JSON.parse(rawData);

    if (payload.meals) {
      saveMealsToSheet(payload.meals);
    }

    if (payload.groceries) {
      saveGroceriesToSheet(payload.groceries);
    }

    if (payload.todos) {
      saveTodosToSheet(payload.todos);
    }

    const response = {
      status: 'success',
      message: 'Successfully synchronized with Google Sheets',
      timestamp: new Date().toISOString(),
      meals: getMealsFromSheet(),
      groceries: getGroceriesFromSheet(),
      todos: getTodosFromSheet(),
      photos: getPhotosFromDrive(DRIVE_FOLDER_ID)
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Read Meals from Google Sheet
 */
function getMealsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MEALS_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(MEALS_SHEET_NAME);
    sheet.appendRow(['Day', 'Meal Name', 'Recipe Link', 'Notes']);
    const defaultMeals = [
      ['monday', '', '', ''],
      ['tuesday', '', '', ''],
      ['wednesday', '', '', ''],
      ['thursday', '', '', ''],
      ['friday', '', '', ''],
      ['saturday', '', '', ''],
      ['sunday', '', '', '']
    ];
    defaultMeals.forEach(row => sheet.appendRow(row));
  }

  const values = sheet.getDataRange().getValues();
  const meals = {};

  for (let i = 1; i < values.length; i++) {
    const day = (values[i][0] || '').toString().toLowerCase().trim();
    if (day) {
      meals[day] = {
        meal: values[i][1] || '',
        link: values[i][2] || '',
        notes: values[i][3] || ''
      };
    }
  }

  return meals;
}

/**
 * Save Meals to Google Sheet
 */
function saveMealsToSheet(meals) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MEALS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MEALS_SHEET_NAME);
  }

  sheet.clearContents();
  sheet.appendRow(['Day', 'Meal Name', 'Recipe Link', 'Notes']);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  days.forEach(day => {
    const item = meals[day] || { meal: '', link: '', notes: '' };
    sheet.appendRow([day, item.meal || '', item.link || '', item.notes || '']);
  });
}

/**
 * Read Groceries from Google Sheet
 */
function getGroceriesFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(GROCERIES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(GROCERIES_SHEET_NAME);
    sheet.appendRow(['ID', 'Item Text', 'Category', 'Completed', 'Created Time']);
    return [];
  }

  const values = sheet.getDataRange().getValues();
  const groceries = [];

  for (let i = 1; i < values.length; i++) {
    if (values[i][1]) {
      groceries.push({
        id: values[i][0] || ('g-' + i),
        text: values[i][1],
        category: values[i][2] || 'Pantry',
        completed: values[i][3] === true || values[i][3] === 'TRUE',
        createdAt: values[i][4] || Date.now()
      });
    }
  }

  return groceries;
}

/**
 * Save Groceries to Google Sheet
 */
function saveGroceriesToSheet(groceries) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(GROCERIES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(GROCERIES_SHEET_NAME);
  }

  sheet.clearContents();
  sheet.appendRow(['ID', 'Item Text', 'Category', 'Completed', 'Created Time']);

  groceries.forEach(item => {
    sheet.appendRow([
      item.id,
      item.text,
      item.category || 'Pantry',
      item.completed ? true : false,
      item.createdAt || Date.now()
    ]);
  });
}

/**
 * List Photos from Google Drive Folder
 */
function getPhotosFromDrive(folderId) {
  const photos = [];
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();

    while (files.hasNext()) {
      const file = files.next();
      const mime = file.getMimeType();
      if (mime.indexOf('image/') === 0) {
        // Direct thumbnail or viewable image link
        const id = file.getId();
        photos.push({
          url: 'https://lh3.googleusercontent.com/d/' + id,
          caption: file.getName().replace(/\.[^/.]+$/, ""),
          date: Utilities.formatDate(file.getDateCreated(), "America/Winnipeg", "MMMM yyyy")
        });
      }
    }
  } catch (e) {
    Logger.log("Drive read note: " + e.toString());
  }

  return photos;
}

/**
 * Helper to open the To-Do Google Spreadsheet
 */
function getTodoSpreadsheet() {
  try {
    if (TODO_SHEET_ID && TODO_SHEET_ID.trim().length > 0) {
      return SpreadsheetApp.openById(TODO_SHEET_ID.trim());
    }
  } catch (e) {
    Logger.log("Could not open TODO_SHEET_ID, falling back to active spreadsheet: " + e.toString());
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Read To-Do items from Google Sheet
 */
function getTodosFromSheet() {
  try {
    const ss = getTodoSpreadsheet();
    let sheet = ss.getSheetByName(TODO_SHEET_NAME);
    if (!sheet) {
      const sheets = ss.getSheets();
      if (sheets.length > 0 && sheets[0].getName() !== MEALS_SHEET_NAME && sheets[0].getName() !== GROCERIES_SHEET_NAME) {
        sheet = sheets[0];
      } else {
        sheet = ss.insertSheet(TODO_SHEET_NAME);
        sheet.appendRow(['ID', 'Task', 'Category', 'Completed', 'Created Time']);
        return [];
      }
    }

    const values = sheet.getDataRange().getValues();
    const todos = [];

    for (let i = 1; i < values.length; i++) {
      if (values[i][1]) {
        todos.push({
          id: values[i][0] || ('t-' + i),
          text: values[i][1],
          category: values[i][2] || 'General',
          completed: values[i][3] === true || values[i][3] === 'TRUE',
          createdAt: values[i][4] || Date.now()
        });
      }
    }

    return todos;
  } catch (e) {
    Logger.log("getTodosFromSheet error: " + e.toString());
    return [];
  }
}

/**
 * Save To-Do items to Google Sheet
 */
function saveTodosToSheet(todos) {
  try {
    const ss = getTodoSpreadsheet();
    let sheet = ss.getSheetByName(TODO_SHEET_NAME);
    if (!sheet) {
      const sheets = ss.getSheets();
      if (sheets.length > 0 && sheets[0].getName() !== MEALS_SHEET_NAME && sheets[0].getName() !== GROCERIES_SHEET_NAME) {
        sheet = sheets[0];
      } else {
        sheet = ss.insertSheet(TODO_SHEET_NAME);
      }
    }

    sheet.clearContents();
    sheet.appendRow(['ID', 'Task', 'Category', 'Completed', 'Created Time']);

    todos.forEach(item => {
      sheet.appendRow([
        item.id,
        item.text,
        item.category || 'General',
        item.completed ? true : false,
        item.createdAt || Date.now()
      ]);
    });
  } catch (e) {
    Logger.log("saveTodosToSheet error: " + e.toString());
  }
}
