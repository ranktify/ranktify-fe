import { ResponseType, useAuthRequest } from "expo-auth-session";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
   CLIENT_ID,
   CLIENT_SECRET,
   REDIRECT_URI,
   SPOTIFY_SCOPES,
} from "../config/spotifyCredentials";

// Spotify API endpoints
const discovery = {
   authorizationEndpoint: "https://accounts.spotify.com/authorize",
   tokenEndpoint: "https://accounts.spotify.com/api/token",
};

export const useSpotifyAuth = (onAuthSuccess) => {
   const [isAuthenticating, setIsAuthenticating] = useState(false);
   const [hasSpotifyToken, setHasSpotifyToken] = useState(false);

   useEffect(() => {
      const checkToken = async () => {
         const token = await AsyncStorage.getItem("@spotify_token");
         setHasSpotifyToken(!!token);
      };

      checkToken();
   }, []);

   const [request, response, promptAsync] = useAuthRequest(
      {
         responseType: ResponseType.Token,
         clientId: CLIENT_ID,
         clientSecret: CLIENT_SECRET,
         scopes: SPOTIFY_SCOPES,
         usePKCE: false,
         redirectUri: REDIRECT_URI,
      },
      discovery
   );

   useEffect(() => {
      if (response?.type === "success") {
         const { access_token, expires_in } = response.params;

         const saveToken = async () => {
            try {
               await AsyncStorage.setItem("@spotify_token", access_token);
               await AsyncStorage.setItem(
                  "@spotify_token_expiry",
                  JSON.stringify(Date.now() + expires_in * 1000)
               );

               setHasSpotifyToken(true);
               setIsAuthenticating(false);

               if (onAuthSuccess) {
                  onAuthSuccess(access_token);
               }
            } catch (error) {
               console.error("Error saving Spotify token:", error);
            }
         };

         saveToken();
      } else if (response) {
         console.log("Authentication failed or was cancelled");
         setIsAuthenticating(false);
      }
   }, [response, onAuthSuccess]);

   const login = async () => {
      setIsAuthenticating(true);
      await promptAsync();
   };

   const logout = async () => {
      try {
         await AsyncStorage.removeItem("@spotify_token");
         await AsyncStorage.removeItem("@spotify_token_expiry");
         setHasSpotifyToken(false);
      } catch (error) {
         console.error("Error logging out from Spotify:", error);
      }
   };

   return {
      login,
      logout,
      isAuthenticating,
      hasSpotifyToken,
   };
};

export const getSpotifyToken = async () => {
   try {
      const token = await AsyncStorage.getItem("@spotify_token");
      const expiryString = await AsyncStorage.getItem("@spotify_token_expiry");

      if (token && expiryString) {
         const expiry = parseInt(expiryString, 10);

         if (Date.now() < expiry) {
            return token;
         }
      }

      return null;
   } catch (error) {
      console.error("Error getting Spotify token:", error);
      return null;
   }
};
