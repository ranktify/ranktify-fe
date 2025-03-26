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

To configure the app for local development, add the following to your `app.json` file:

```json
"extra": {
      "baseURL": "http://localhost:8080",
      "spotify": {
        "clientId": "INSERT_CLIENT_ID", //replace with clientID
        "clientSecret": "INSERT_CLIENT_SECRET", //replace with ClientSecret
        "redirectUri": "exp://127.0.0.1:19000/" // Add this redirectUri to your Spotify Developer Dashboard Application
      }
    }
```

To configure the app to communicate with deployed backend environment, add the following to your `app.json` file:

```json
"extra": {
    "baseURL": "*insert deployed environment link here*",
    "spotify": {
        "clientId": "INSERT_CLIENT_ID", //replace with clientID
        "clientSecret": "INSERT_CLIENT_SECRET", //replace with ClientSecret
        "redirectUri": "exp://127.0.0.1:19000/" // Add this redirectUri to your Spotify Developer Dashboard Application
      }
    }
```
