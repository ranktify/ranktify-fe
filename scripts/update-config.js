const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function updateConfig() {
    try {
        // Get ngrok tunnels
        const tunnelsResponse = await axios.get('http://localhost:4040/api/tunnels');
        const tunnels = tunnelsResponse.data.tunnels;
        
        // Find HTTPS tunnel for port 8080
        const httpsTunnel = tunnels.find(t => 
            t.proto === 'https' && t.config.addr.endsWith(':8080')
        );
        
        if (!httpsTunnel) {
            throw new Error('No HTTPS tunnel found for port 8080');
        }
        
        const ngrokUrl = httpsTunnel.public_url;
        console.log(`Found ngrok URL: ${ngrokUrl}`);
        
        // Update app.json
        const configPath = path.join(__dirname, '../app.json');
        const config = require(configPath);
        
        config.expo = config.expo || {};
        config.expo.extra = config.expo.extra || {};
        config.expo.extra.baseURL = ngrokUrl;
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`Successfully updated baseURL to: ${ngrokUrl}`);
        process.exit(0);
    } catch (error) {
        console.error('Config update failed:');
        console.error(error.message);
        process.exit(1);
    }
}

updateConfig();