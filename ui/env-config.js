import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the environment variables from Azure Static Web Apps
const envVars = {
  REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  // Remove any trailing % from the API key
  REACT_APP_GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY?.replace(/%$/, '')
};

// Create the env-config.js file
const envConfigFile = path.join(__dirname, 'public', 'env-config.js');
const envConfigContent = `// This file is auto-generated during build
window._env_ = ${JSON.stringify(envVars, null, 2)};
`;

// Ensure the public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the file
fs.writeFileSync(envConfigFile, envConfigContent);

// Log for debugging
console.log('Environment variables written to:', envConfigFile);
console.log('Environment variables:', envVars); 