// Minimal Express server to generate ACS user access tokens
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { CommunicationIdentityClient } = require('@azure/communication-identity');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

// Print the endpoint for debug
console.log('process.env.ACS_ENDPOINT_URL:', process.env.ACS_ENDPOINT_URL);
console.log('process.env.ACS_CONNECTION_STRING:', process.env.ACS_CONNECTION_STRING);

const connectionString = process.env.ACS_CONNECTION_STRING;
const endpointUrl = process.env.ACS_ENDPOINT_URL;

if (!connectionString) {
  console.error('Missing ACS_CONNECTION_STRING in .env');
  process.exit(1);
}
if (!endpointUrl) {
  console.error('Missing ACS_ENDPOINT_URL in .env');
  process.exit(1);
}

const identityClient = new CommunicationIdentityClient(connectionString);

app.get('/api/token', async (req, res) => {
  try {
    // Create a new user (matches doc)
    const user = await identityClient.createUser();
    // Issue an access token (matches doc)
    const tokenResponse = await identityClient.getToken(user, ["chat"]);
    res.json({
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
      userId: user.communicationUserId,
      endpointUrl: endpointUrl
    });
  } catch (err) {
    console.error('Failed to generate ACS token:', err);
    res.status(500).json({ error: 'Failed to generate ACS token' });
  }
});

app.listen(port, () => {
  console.log(`ACS token server listening on port ${port}`);
}); 