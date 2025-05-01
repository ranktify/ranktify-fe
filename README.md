# Ranktify Frontend

## Requirements

Before running the app, ensure you have the following installed:

-  [Node.js](https://nodejs.org/) (Recommended: Latest LTS version)
-  A mobile device or emulator (Expo Go app recommended for testing on mobile)

## Get Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd ranktify-fe
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

## Setup

### Local Development

To configure the app for local development, you need to set the `baseURL` for the API calls and configure Spotify credentials in your `app.json` file.

**Manual Configuration:**

Add or modify the `extra` section in your `app.json`:

```json
"extra": {
      "baseURL": "http://localhost:8080",
      "spotify": {
        "clientId": "INSERT_CLIENT_ID",
        "redirectUri": "exp://127.0.0.1:19000/"
      }
    }
```

**Automatic `baseURL` Update using Ngrok:**

If your backend is running locally on port 8080 and you are using ngrok to expose it, you can automatically update the `baseURL` in `app.json`.

1.  Ensure ngrok is running and forwarding port 8080:
    ```bash
    ngrok http 8080
    ```
2.  Run the update script:
    ```bash
    node scripts/update-config.js
    ```

With this command you can start ngrok, autoupdate the baseURL and run the application simultaneously. 
```bash
npm run start:ngrok
```

**Deployed Backend Configuration:**

To configure the app to communicate with a deployed backend environment, update the `baseURL` accordingly:

```json
"extra": {
    "baseURL": "*insert deployed environment link here*",
    "spotify": {
        "clientId": "INSERT_CLIENT_ID",
        "redirectUri": "exp://127.0.0.1:19000/"
      }
    }
```
