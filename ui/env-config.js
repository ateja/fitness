import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the environment variables from Azure Static Web Apps
const envVars = {
  REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  REACT_APP_GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY
};

// Create the env-config.js file
const envConfigFile = path.join(__dirname, 'public', 'env-config.js');
const envConfigContent = `window._env_ = ${JSON.stringify(envVars)};`;

fs.writeFileSync(envConfigFile, envConfigContent); 