// Remove gapi import as we're not using it anymore
// import { gapi } from 'gapi-script';

// Get environment variables with fallbacks
const getEnvVar = (key: string): string | undefined => {
  // Debug logging
  console.log('Checking environment variable:', key);
  console.log('window._env_:', window._env_);
  console.log('process.env:', process.env);
  
  // Try window._env_ first (production)
  if (window._env_ && window._env_[key]) {
    console.log(`Found ${key} in window._env_:`, window._env_[key]);
    return window._env_[key];
  }
  
  // Fall back to process.env (development)
  if (process.env[key]) {
    console.log(`Found ${key} in process.env:`, process.env[key]);
    return process.env[key];
  }
  
  console.warn(`Environment variable ${key} not found in either location`);
  return undefined;
};

const CLIENT_ID = getEnvVar('REACT_APP_GOOGLE_CLIENT_ID');
const API_KEY = getEnvVar('REACT_APP_GOOGLE_API_KEY');

// Debug logging
console.log('Final environment variables:', {
  CLIENT_ID,
  API_KEY,
  NODE_ENV: process.env.NODE_ENV,
  WINDOW_ENV: window._env_,
  PROCESS_ENV: {
    REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    REACT_APP_GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY
  }
});

const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Add these constants at the top with other constants
const TOKEN_STORAGE_KEY = 'google_auth_token';

// Add these helper functions after the constants
const storeToken = (token: { access_token: string } | null) => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

const getStoredToken = (): { access_token: string } | null => {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Initialize Google Identity Services
export const initGoogleSheets = async () => {
  try {
    console.log('Initializing Google Sheets API...');
    console.log('Client ID:', CLIENT_ID);
    console.log('API Key:', API_KEY);

    if (!CLIENT_ID || !API_KEY) {
      throw new Error('Missing Google API credentials. Please check your .env file.');
    }

    // Load the Google API client library
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: DISCOVERY_DOCS,
            });
            gapiInited = true;
            resolve();
          } catch (error) {
            console.error('Error initializing gapi client:', error);
            reject(error);
          }
        });
      };
      script.onerror = (error) => {
        console.error('Error loading gapi script:', error);
        reject(error);
      };
      document.head.appendChild(script);
    });

    // Initialize Google Identity Services
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: { error?: string }) => {
        // This will be overridden in the signIn function
        console.log('Token client callback:', response);
      }
    });
    gisInited = true;

    console.log('Google Sheets API initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Sheets API:', error);
    throw error;
  }
};

export const signIn = async () => {
  if (!gisInited) {
    throw new Error('Google Identity Services not initialized');
  }

  return new Promise<boolean>((resolve) => {
    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        throw new Error(resp.error);
      }
      const token = gapi.client.getToken();
      if (token) {
        storeToken(token);
      }
      resolve(true);
    };

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

export const signOut = () => {
  if (!gapiInited) {
    console.warn('Google API not initialized during sign out');
    return;
  }
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken(null);
    storeToken(null);
  }
};

export const isSignedIn = () => {
  if (!gapiInited) {
    console.warn('Google API not initialized during auth check');
    return false;
  }
  
  // First check in-memory token
  const inMemoryToken = gapi.client.getToken();
  if (inMemoryToken) {
    return true;
  }
  
  // If no in-memory token, check localStorage
  const storedToken = getStoredToken();
  if (storedToken) {
    // Restore the token to gapi client
    gapi.client.setToken(storedToken);
    return true;
  }
  
  return false;
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
  if (!gapiInited) {
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
  if (!gapiInited) {
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
  if (!gapiInited) {
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
  if (!gapiInited) {
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
  _traineeName: string,
  date: string
): Promise<void> => {
  if (!gapiInited) {
    throw new Error('Google API not initialized');
  }

  try {
    // Check if sheet exists and create it if it doesn't
    try {
      await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:E`
      });
    } catch (error) {
      // If sheet doesn't exist, create it
      await (gapi.client.sheets.spreadsheets as any).batchUpdate({
        spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
    }
    
    // Get all existing rows
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:E`
    });
    
    const existingRows = response.result.values || [];
    
    // Prepare arrays for new and updated rows
    const updatedRows: string[][] = [];
    const newRows: string[][] = [];
    
    // Process each workout
    for (const workout of workoutData) {
      // Find existing rows for this exercise on this date
      const existingExerciseRows = existingRows.filter((row: string[]) => 
        row[0] === date && row[1] === workout.exercise
      );
      
      if (existingExerciseRows.length > 0) {
        // Update existing rows
        for (const set of workout.sets) {
          const existingSetRow = existingExerciseRows.find((row: string[]) => 
            parseInt(row[2]) === set.setNumber
          );
          
          if (existingSetRow) {
            // Update existing set
            existingSetRow[3] = set.reps;
            existingSetRow[4] = set.weight;
            updatedRows.push(existingSetRow);
          } else {
            // Add new set for existing exercise
            newRows.push([
              date,
              workout.exercise,
              set.setNumber.toString(),
              set.reps,
              set.weight
            ]);
          }
        }
      } else {
        // Add all sets as new rows
        for (const set of workout.sets) {
          newRows.push([
            date,
            workout.exercise,
            set.setNumber.toString(),
            set.reps,
            set.weight
          ]);
        }
      }
    }
    
    // Update existing rows
    if (updatedRows.length > 0) {
      // Find the row numbers for the rows to update
      const rowNumbers = updatedRows.map(row => 
        existingRows.findIndex((r: string[]) => 
          r[0] === row[0] && r[1] === row[1] && r[2] === row[2]
        ) + 1
      );
      
      // Update each row
      for (let i = 0; i < updatedRows.length; i++) {
        const range = `${sheetName}!A${rowNumbers[i]}:E${rowNumbers[i]}`;
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          resource: {
            values: [updatedRows[i]]
          }
        });
      }
    }
    
    // Append new rows
    if (newRows.length > 0) {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:E`,
        valueInputOption: 'RAW',
        resource: {
          values: newRows
        }
      });
    }
  } catch (error) {
    console.error('Error saving workout data:', error);
    throw error;
  }
};

export const getToken = async () => {
  if (!gapiInited) {
    console.warn('Google API not initialized during token request');
    return null;
  }
  
  const token = gapi.client.getToken();
  if (!token) {
    // If no token exists, try to get a new one
    try {
      await signIn();
      const newToken = gapi.client.getToken();
      if (!newToken) {
        throw new Error('Failed to get access token');
      }
      return newToken.access_token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
  
  // Verify the token has the required scopes
  const tokenInfo = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token.access_token}`)
    .then(res => res.json())
    .catch(() => null);
  
  if (!tokenInfo || tokenInfo.error) {
    // Token is invalid or expired, try to get a new one
    try {
      await signIn();
      const newToken = gapi.client.getToken();
      if (!newToken) {
        throw new Error('Failed to get access token');
      }
      return newToken.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
  
  return token.access_token;
}; 