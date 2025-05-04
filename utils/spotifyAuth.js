import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResponseType, useAuthRequest } from "expo-auth-session";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { CLIENT_ID, REDIRECT_URI, SPOTIFY_SCOPES } from "../config/spotifyCredentials";
import authService from "../services/authService";
const BASE_URL = Constants.expoConfig?.extra?.baseURL;

// Spotify API auth endpoint
const discovery = {
   authorizationEndpoint: "https://accounts.spotify.com/authorize",
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
         responseType: ResponseType.Code,
         clientId: CLIENT_ID,
         scopes: SPOTIFY_SCOPES,
         usePKCE: false,
         redirectUri: REDIRECT_URI,
      },
      discovery
   );

   useEffect(() => {
      if (response?.type === "success" && response.params.code) {
         const { code } = response.params;

         const hasExchangedCode = async () => {
            const exchangedFlag = await AsyncStorage.getItem(`@code_exchanged_${code}`);
            return !!exchangedFlag;
         };

         const exchangeCodeForToken = async () => {
            if (await hasExchangedCode()) {
               return;
            }

            try {
               const userInfo = await authService.getUserInfo();
               const userId = userInfo?.userId;

               if (!userId) {
                  throw new Error("User ID is missing from stored user info");
               }

               const backendUrl = `/api/callback`;
               const res = await axiosInstance.post(backendUrl, {
                  code,
                  user_id: userId,
               });

               if (!res.data?.access_token) {
                  throw new Error("Failed to exchange code for token");
               }

               const access_token = res.data.access_token;
               const ExpiresIn = 3600;
               const expiryTimestamp = Date.now() + (ExpiresIn * 1000);

               await Promise.all([
                  AsyncStorage.setItem("@spotify_token", access_token),
                  AsyncStorage.setItem("@spotify_token_expiry", expiryTimestamp.toString()),
                  AsyncStorage.setItem(`@code_exchanged_${code}`, "true")
               ]);

               setHasSpotifyToken(true);
               setIsAuthenticating(false);

               if (onAuthSuccess) {
                  onAuthSuccess(access_token);
               }
            } catch (error) {
               console.error("Error exchanging code for token:", error);
               setIsAuthenticating(false);
            }
         };

         const checkExistingToken = async () => {
            const existingToken = await AsyncStorage.getItem("@spotify_token");
            const expiryString = await AsyncStorage.getItem("@spotify_token_expiry");

            if (existingToken && expiryString) {
               const expiry = parseInt(expiryString, 10);
               if (Date.now() < expiry) {
                  setHasSpotifyToken(true);
                  setIsAuthenticating(false);
                  return;
               }
            }

            await exchangeCodeForToken();
         };

         checkExistingToken();
      } else if (response) {
         setIsAuthenticating(false);
      }
   }, [response]);

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

      if (!token || !expiryString) {
         return null;
      }

      const expiry = parseInt(expiryString, 10);
      const now = Date.now();

      if (now < expiry) {
         return token;
      }

      await AsyncStorage.removeItem("@spotify_token");
      await AsyncStorage.removeItem("@spotify_token_expiry");
      return null;
   } catch (error) {
      console.error("Error getting Spotify token:", error);
      return null;
   }
};

export async function refreshSpotifyToken() {
   try {
      const userInfo = await authService.getUserInfo();
      const userId = userInfo?.userId;
      if (!userId) {
         console.error("No user ID available for Spotify refresh");
         return null;
      }

      const res = await axiosInstance.post(`/api/spotify-refresh`, {
         user_id: userId,
      });

      const { access_token, expires_in } = res.data;
      if (!access_token) {
         console.error("No access token returned from refresh");
         return null;
      }

      await AsyncStorage.setItem("@spotify_token", access_token);
      await AsyncStorage.setItem(
         "@spotify_token_expiry",
         JSON.stringify(Date.now() + expires_in * 1000)
      );

      return access_token;
   } catch (error) {
      console.error("Error refreshing Spotify token:", error);
      return null;
   }
};
