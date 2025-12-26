const https = require('https');
const axios = require('axios');

const agent = new https.Agent({  
  rejectUnauthorized: false
});

async function testConnection() {
  try {
    console.log("Attempting connection with rejectUnauthorized: false...");
    const response = await axios.get('https://api.endlessmedical.com/v1/dx/InitSession', {
      httpsAgent: agent
    });
    console.log("Success! Status:", response.data);
  } catch (error) {
    console.error("Failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

testConnection();
