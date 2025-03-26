import Constants from "expo-constants";

// Access Spotify credentials from app.json extra
export const CLIENT_ID = Constants.expoConfig?.extra?.spotify?.clientId;
export const CLIENT_SECRET = Constants.expoConfig?.extra?.spotify?.clientSecret;
export const REDIRECT_URI = Constants.expoConfig?.extra?.spotify?.redirectUri;

// Scopes for Spotify API access
export const SPOTIFY_SCOPES = [
   "user-read-currently-playing",
   "user-read-recently-played",
   "user-read-playback-state",
   "user-top-read",
   "user-modify-playback-state",
   "streaming",
   "user-read-email",
   "user-read-private",
];
