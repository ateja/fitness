import { gapi } from 'gapi-script';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
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
  values: any[][]
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
      
      // Only process rows matching our date
      if (rowDate === date) {
        console.log(`Processing row for ${exercise}: Set ${setNum}, ${reps} reps @ ${weight}`);
        
        if (!exerciseMap.has(exercise)) {
          exerciseMap.set(exercise, []);
        }
        
        exerciseMap.get(exercise)!.push({
          setNumber: Number(setNum),
          reps: reps.toString(),
          weight: weight.toString()
        });
      }
    }
    
    // Convert map to array format
    const workoutData: WorkoutData[] = Array.from(exerciseMap.entries()).map(([exercise, sets]) => ({
      exercise,
      sets: sets.sort((a, b) => a.setNumber - b.setNumber)  // Sort sets by number
    }));

    console.log('Final workout data:', workoutData);
    return workoutData;
  } catch (error) {
    console.error('Error fetching workout data:', error);
    throw error;
  }
}; 