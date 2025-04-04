const fs = require('fs');
const path = require('path');

// Read the environment variables from Azure Static Web Apps
const envVars = {
  REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  REACT_APP_GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY
};

// Create the env-config.js file
const envConfigFile = path.join(__dirname, 'public', 'env-config.js');
const envConfigContent = `window._env_ = ${JSON.stringify(envVars)};`;

fs.writeFileSync(envConfigFile, envConfigContent); 