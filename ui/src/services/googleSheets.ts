import { gapi } from 'gapi-script';

// Use window._env_ for production environment variables
const CLIENT_ID = process.env.NODE_ENV === 'production' 
  ? window._env_?.REACT_APP_GOOGLE_CLIENT_ID 
  : process.env.REACT_APP_GOOGLE_CLIENT_ID;

const API_KEY = process.env.NODE_ENV === 'production'
  ? window._env_?.REACT_APP_GOOGLE_API_KEY
  : process.env.REACT_APP_GOOGLE_API_KEY;

// Debug logging
console.log('Environment variables:', {
  CLIENT_ID,
  API_KEY,
  NODE_ENV: process.env.NODE_ENV,
  WINDOW_ENV: window._env_
});

const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly';

let gapiInitialized = false;

export const initGoogleSheets = async () => {
  try {
    console.log('Initializing Google Sheets API...');
    console.log('Client ID:', CLIENT_ID);
    console.log('API Key:', API_KEY);

    if (!CLIENT_ID || !API_KEY) {
      throw new Error('Missing Google API credentials. Please check your .env file.');
    }

    if (gapiInitialized) {
      console.log('Google API already initialized');
      return;
    }

    await new Promise((resolve, reject) => {
      gapi.load('client:auth2', {
        callback: async () => {
          try {
            await gapi.client.init({
              apiKey: API_KEY,
              clientId: CLIENT_ID,
              discoveryDocs: DISCOVERY_DOCS,
              scope: SCOPES
            });
            gapiInitialized = true;
            console.log('Google Sheets API initialized successfully');
            resolve(true);
          } catch (error) {
            console.error('Error initializing gapi client:', error);
            reject(error);
          }
        },
        onerror: (error: Error) => {
          console.error('Error loading gapi:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize Google Sheets API:', error);
    throw error;
  }
};

export const signIn = async () => {
  if (!gapiInitialized) {
    throw new Error('Google API not initialized');
  }
  try {
    await gapi.auth2.getAuthInstance().signIn();
    return true;
  } catch (error) {
    console.error('Error signing in:', error);
    return false;
  }
};

export const signOut = () => {
  if (!gapiInitialized) {
    throw new Error('Google API not initialized');
  }
  gapi.auth2.getAuthInstance().signOut();
};

export const isSignedIn = () => {
  if (!gapiInitialized) {
    return false;
  }
  return gapi.auth2.getAuthInstance().isSignedIn.get();
};

export const getSpreadsheetData = async (spreadsheetId: string, range: string) => {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.result.values;
  } catch (error) {
    console.error('Error fetching spreadsheet data:', error);
    throw error;
  }
};

export const updateSpreadsheetData = async (
  spreadsheetId: string,
  range: string,
  values: string[][]
) => {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values,
      },
    });
    return response.result;
  } catch (error) {
    console.error('Error updating spreadsheet data:', error);
    throw error;
  }
};

export interface TraineeFile {
  id: string;
  name: string;
}

interface DriveFile {
  id?: string;
  name?: string;
}

export const listTraineeFiles = async (): Promise<TraineeFile[]> => {
  if (!gapiInitialized) {
    throw new Error('Google API not initialized');
  }

  try {
    // First, find the "fitness tracking" folder
    const folderResponse = await gapi.client.drive.files.list({
      q: "name='fitness-tracker' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id)',
      spaces: 'drive'
    });

    const folder = folderResponse.result.files?.[0];
    if (!folder) {
      throw new Error('Fitness tracking folder not found');
    }

    // Then, list all spreadsheet files in that folder
    const filesResponse = await gapi.client.drive.files.list({
      q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    return filesResponse.result.files?.map((file: DriveFile) => ({
      id: file.id!,
      name: file.name!
    })) || [];
  } catch (error) {
    console.error('Error listing trainee files:', error);
    throw error;
  }
};

interface SheetProperties {
  title?: string;
}

interface Sheet {
  properties?: SheetProperties;
}

export const getSheetTabs = async (spreadsheetId: string): Promise<string[]> => {
  if (!gapiInitialized) {
    throw new Error('Google API not initialized');
  }

  try {
    const response = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title'
    });
    
    return response.result.sheets?.map((sheet: Sheet) => sheet.properties?.title || '') || [];
  } catch (error) {
    console.error('Error fetching sheet tabs:', error);
    throw error;
  }
};

export const getUniqueDates = async (spreadsheetId: string, sheetName: string): Promise<string[]> => {
  if (!gapiInitialized) {
    throw new Error('Google API not initialized');
  }

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A` // Column A
    });
    
    // Get unique dates, skipping the header row and empty cells
    const dates = response.result.values?.slice(1) // Skip header
      .map((row: string[]) => row[0]) // Get first column
      .filter((date: string) => date) // Remove empty cells
      .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index) || []; // Get unique values
    
    return dates;
  } catch (error) {
    console.error('Error fetching unique dates:', error);
    throw error;
  }
};

export interface Set {
  setNumber: number;
  reps: string;
  weight: string;
}

export interface WorkoutData {
  exercise: string;
  sets: Set[];
}

export const getWorkoutData = async (spreadsheetId: string, sheetName: string, date: string): Promise<WorkoutData[]> => {
  if (!gapiInitialized) {
    throw new Error('Google API not initialized');
  }

  try {
    console.log(`Fetching workout data for date: ${date}`);
    
    // Get all the data from the sheet
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:E`  // We only need the first 5 columns
    });

    const rows = response.result.values || [];
    console.log(`Found ${rows.length} rows in sheet`);
    
    // Skip header row and group exercises
    const exerciseMap = new Map<string, Set[]>();
    
    // Process each row (skipping header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 5) continue;  // Skip incomplete rows
      
      const [rowDate, exercise, setNum, reps, weight] = row;
      if (rowDate !== date) continue;  // Skip rows for other dates
      
      const set: Set = {
        setNumber: parseInt(setNum),
        reps: reps.toString(),
        weight: weight.toString()
      };
      
      if (!exerciseMap.has(exercise)) {
        exerciseMap.set(exercise, []);
      }
      exerciseMap.get(exercise)?.push(set);
    }
    
    // Convert map to array
    const workoutData: WorkoutData[] = [];
    for (const [exercise, sets] of Array.from(exerciseMap.entries())) {
      workoutData.push({
        exercise,
        sets: sets.sort((a: Set, b: Set) => a.setNumber - b.setNumber)
      });
    }
    
    return workoutData;
  } catch (error) {
    console.error('Error fetching workout data:', error);
    throw error;
  }
};

export const saveWorkoutData = async (
  spreadsheetId: string,
  sheetName: string,
  workoutData: WorkoutData[],
  _traineeName: string
): Promise<void> => {
  if (!gapiInitialized) {
    throw new Error('Google API not initialized');
  }

  try {
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // Prepare the data to be written
    const values: string[][] = [];
    
    // Add header row if sheet is empty
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:E`
    });
    
    if (!response.result.values || response.result.values.length === 0) {
      values.push(['Date', 'Exercise', 'Set', 'Reps', 'Weight']);
    }
    
    // Add workout data
    for (const workout of workoutData) {
      for (const set of workout.sets) {
        values.push([
          today,
          workout.exercise,
          set.setNumber.toString(),
          set.reps,
          set.weight
        ]);
      }
    }
    
    // Write the data
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:E`,
      valueInputOption: 'RAW',
      resource: {
        values
      }
    });
  } catch (error) {
    console.error('Error saving workout data:', error);
    throw error;
  }
}; 