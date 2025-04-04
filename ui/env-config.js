import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: Log all environment variables
console.log('All environment variables:', process.env);

// Check if required environment variables are set
const requiredVars = ['REACT_APP_GOOGLE_CLIENT_ID', 'REACT_APP_GOOGLE_API_KEY'];
console.log('Checking for required variables:', requiredVars);

const missingVars = requiredVars.filter(varName => {
  const exists = process.env[varName] !== undefined;
  console.log(`${varName}: ${exists ? 'Found' : 'Missing'}`);
  return !exists;
});

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Read the environment variables from Azure Static Web Apps
const envVars = {
  REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  REACT_APP_GOOGLE_API_KEY: (process.env.REACT_APP_GOOGLE_API_KEY || '').replace(/%$/, ''),
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'https://gitness-server-ckf7azhdedaffdfh.scm.westus-01.azurewebsites.net'
};

console.log('Environment variables to be written:', envVars);

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
console.log('Environment configuration file generated at:', envConfigFile);
console.log('File contents:', envConfigContent); 