// services/authService.js
import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const baseURL = Constants.expoConfig?.extra?.baseURL || "http://localhost:8080";

const debugLog = (message, data = null) => {
   console.log(`[AUTH SERVICE] ${message}`, data ? data : "");
};

const storage = {
   setItem: async (key, value) => {
      try {
         if (Platform.OS === "web") {
            debugLog(`Storing ${key} in localStorage`);
            localStorage.setItem(key, value);
            return true;
         } else {
            debugLog(`Storing ${key} in SecureStore`);
            return await SecureStore.setItemAsync(key, value);
         }
      } catch (error) {
         debugLog(`Error storing ${key}:`, error);
         return false;
      }
   },

   getItem: async (key) => {
      try {
         if (Platform.OS === "web") {
            let value = localStorage.getItem(key);
            if (value === null) {
               value = sessionStorage.getItem(key);
               debugLog(`Retrieved ${key} from sessionStorage:`, !!value);
            } else {
               debugLog(`Retrieved ${key} from localStorage:`, !!value);
            }
            return value;
         } else {
            const value = await SecureStore.getItemAsync(key);
            debugLog(`Retrieved ${key} from SecureStore:`, !!value);
            return value;
         }
      } catch (error) {
         debugLog(`Error retrieving ${key}:`, error);
         return null;
      }
   },

   removeItem: async (key) => {
      try {
         if (Platform.OS === "web") {
            debugLog(`Removing ${key} from web storage`);
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
            return true;
         } else {
            debugLog(`Removing ${key} from SecureStore`);
            return await SecureStore.deleteItemAsync(key);
         }
      } catch (error) {
         debugLog(`Error removing ${key}:`, error);
         return false;
      }
   },
};

export const authService = {
   /**
    * Register a new user
    * @param {Object} userData - User registration data
    */
   async register(userData) {
      try {
         debugLog("Register called");
         const response = await axios.post(`${baseURL}/ranktify/user/register`, userData);
         debugLog("Register response:", response.data);

         if (response.data?.access_token) {
            await storage.setItem("jwt_token", response.data.access_token);

            if (response.data.refresh_token) {
               await storage.setItem("refresh_token", response.data.refresh_token);
            }

            const tokenParts = response.data.access_token.split(".");
            if (tokenParts.length === 3) {
               try {
                  const payload = JSON.parse(atob(tokenParts[1]));
                  await storage.setItem(
                     "user_info",
                     JSON.stringify({
                        userId: payload.user_id || payload.id || payload.sub,
                        email: payload.email,
                        username: payload.username || payload.name,
                     })
                  );
               } catch (error) {
                  debugLog("Error parsing token payload:", error);
               }
            }
         }

         return response.data;
      } catch (error) {
         debugLog("Registration error:", error);
         throw error;
      }
   },

   /**
    * Login a user
    * @param {Object} credentials - User login credentials
    */
   async login(credentials) {
      try {
         debugLog("Login called");
         const response = await axios.post(`${baseURL}/ranktify/user/login`, credentials);
         debugLog("Login response:", response.data);

         if (response.data?.access_token) {
            await storage.setItem("jwt_token", response.data.access_token);

            if (response.data.refresh_token) {
               await storage.setItem("refresh_token", response.data.refresh_token);
            }

            const tokenParts = response.data.access_token.split(".");
            if (tokenParts.length === 3) {
               try {
                  const payload = JSON.parse(atob(tokenParts[1]));
                  debugLog("Token payload:", payload);

                  await storage.setItem(
                     "user_info",
                     JSON.stringify({
                        userId: payload.user_id || payload.id || payload.sub,
                        email: payload.email,
                        username: payload.username || payload.name,
                     })
                  );
               } catch (error) {
                  debugLog("Error parsing token payload:", error);
               }
            }
         }

         return response.data;
      } catch (error) {
         debugLog("Login error:", error);
         throw error;
      }
   },

   /**
    * Explicitly refresh the auth token
    * @returns {Promise<boolean>} Whether refresh was successful
    */
   async refreshToken() {
      try {
         debugLog("Refresh token called");
         const refreshToken = await storage.getItem("refresh_token");
         debugLog("Refresh token found:", !!refreshToken);

         if (!refreshToken) {
            return false;
         }

         const response = await axios.post(`${baseURL}/ranktify/user/refresh`, {
            refresh_token: refreshToken,
         });

         debugLog("Refresh token response:", response.data);

         if (response.data?.access_token) {
            const newAccessToken = response.data.access_token;
            const newRefreshToken = response.data.refresh_token || refreshToken;

            debugLog("Storing refreshed tokens");

            await storage.setItem("jwt_token", newAccessToken);
            await storage.setItem("refresh_token", newRefreshToken);

            const tokenParts = newAccessToken.split(".");
            if (tokenParts.length === 3) {
               try {
                  const payload = JSON.parse(atob(tokenParts[1]));
                  await storage.setItem(
                     "user_info",
                     JSON.stringify({
                        userId: payload.user_id || payload.id || payload.sub,
                        email: payload.email,
                        username: payload.username || payload.name,
                     })
                  );
               } catch (error) {
                  debugLog("Error parsing token payload:", error);
               }
            }

            return true;
         }
         return false;
      } catch (error) {
         debugLog("Token refresh error:", error);
         await this.clearTokens();
         return false;
      }
   },

   /**
    * Clear all auth tokens and user info
    */
   async clearTokens() {
      debugLog("Clearing all tokens");
      await storage.removeItem("jwt_token");
      await storage.removeItem("refresh_token");
      await storage.removeItem("user_info");
   },

   /**
    * Logout the current user
    */
   async logout() {
      try {
         debugLog("Logout called");

         // Clear stored tokens and user info
         await this.clearTokens();

         // Redirect to login
         router.replace("/login");
      } catch (error) {
         debugLog("Logout error:", error);
         throw error;
      }
   },

   /**
    * Check if user is authenticated
    * @returns {Promise<boolean>} Authentication status
    */
   async isAuthenticated() {
      try {
         debugLog("isAuthenticated called");
         const token = await storage.getItem("jwt_token");
         debugLog("Token found:", !!token);

         if (!token) return false;

         // Verify token isn't expired
         const tokenParts = token.split(".");
         if (tokenParts.length === 3) {
            try {
               const payload = JSON.parse(atob(tokenParts[1]));
               const expiration = payload.exp * 1000;
               const isValid = expiration > Date.now();
               debugLog("Token valid:", isValid, "expires:", new Date(expiration).toISOString());
               return isValid;
            } catch (error) {
               debugLog("Error parsing token for validation:", error);
               return false;
            }
         }

         return false;
      } catch (error) {
         debugLog("Authentication check error:", error);
         return false;
      }
   },

   /**
    * Get stored user info
    * @returns {Promise<Object|null>} User info
    */
   async getUserInfo() {
      try {
         debugLog("getUserInfo called");
         const userInfo = await storage.getItem("user_info");
         debugLog("User info found:", !!userInfo);
         return userInfo ? JSON.parse(userInfo) : null;
      } catch (error) {
         debugLog("Get user info error:", error);
         return null;
      }
   },
};

export default authService;
