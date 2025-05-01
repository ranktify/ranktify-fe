const fs = require('fs');
const path = require('path');
const axios = require('axios');

const NGROK_API_URL = 'http://localhost:4040/api/tunnels';
const TARGET_PORT = 8080;
const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 1000; 

async function getNgrokHttpsTunnel(retries = MAX_RETRIES) {
    try {
        console.log(`Attempting to fetch ngrok tunnels (retries left: ${retries})...`);
        const tunnelsResponse = await axios.get(NGROK_API_URL, { timeout: RETRY_DELAY_MS });
        const tunnels = tunnelsResponse.data.tunnels;

        const httpsTunnel = tunnels.find(t =>
            t.proto === 'https' && t.config.addr.endsWith(`:${TARGET_PORT}`)
        );

        if (httpsTunnel) {
            console.log(`Found ngrok HTTPS tunnel: ${httpsTunnel.public_url}`);
            return httpsTunnel.public_url;
        } else {
            console.log(`No HTTPS tunnel found for port ${TARGET_PORT} yet.`);
        }
    } catch (error) {
         if (retries > 1) console.log('Ngrok API not ready or tunnel not found, retrying...');
         else console.log('Ngrok API not ready or tunnel not found.');
    }

    if (retries <= 1) {
        throw new Error(`Failed to get ngrok HTTPS tunnel for port ${TARGET_PORT} after ${MAX_RETRIES} attempts.`);
    }

    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    return getNgrokHttpsTunnel(retries - 1);
}


async function updateConfig() {
    try {
        const ngrokUrl = await getNgrokHttpsTunnel();

        const configPath = path.join(__dirname, '../app.json');
        const config = require(configPath);
        config.expo = config.expo || {};
        config.expo.extra = config.expo.extra || {};
        config.expo.extra.baseURL = ngrokUrl;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`Successfully updated baseURL in app.json to: ${ngrokUrl}`);
    } catch (error) {
        console.error('Config update failed:');
        console.error(error.message);
        process.exit(1);
    }
}

updateConfig();