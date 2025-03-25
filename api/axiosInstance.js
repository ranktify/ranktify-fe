import axios from "axios";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const baseURL = Constants.expoConfig?.extra?.baseURL || "http://localhost:8080";

const debugLog = (message, data = null) => {
   console.log(`[AXIOS] ${message}`, data ? data : "");
};

const storage = {
   setItem: async (key, value) => {
      try {
         if (Platform.OS === "web") {
            localStorage.setItem(key, value);
            return true;
         } else {
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
            }
            return value;
         } else {
            return await SecureStore.getItemAsync(key);
         }
      } catch (error) {
         debugLog(`Error retrieving ${key}:`, error);
         return null;
      }
   },

   removeItem: async (key) => {
      try {
         if (Platform.OS === "web") {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
            return true;
         } else {
            return await SecureStore.deleteItemAsync(key);
         }
      } catch (error) {
         debugLog(`Error removing ${key}:`, error);
         return false;
      }
   },
};

// Create axios instance with base URL
const axiosInstance = axios.create({
   baseURL: `${baseURL}/ranktify`,
   timeout: 10000,
   headers: {
      "Content-Type": "application/json",
   },
});

// Request interceptor for adding authorization token to requests
axiosInstance.interceptors.request.use(
   async (config) => {
      if (
         config.url === "/user/login" ||
         config.url === "/user/register" ||
         config.url === "/api/refresh"
      ) {
         return config;
      }

      try {
         // Get access token from storage
         const token = await storage.getItem("jwt_token");
         debugLog(`Adding token to request: ${config.url}`, !!token);

         if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
         }
      } catch (error) {
         debugLog("Error getting token for request:", error);
      }

      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Response interceptor for handling token expiration
axiosInstance.interceptors.response.use(
   (response) => {
      return response;
   },
   async (error) => {
      debugLog("Response error:", error.response?.status);

      const originalRequest = error.config;

      // If the error is 401 Unauthorized and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
         debugLog("401 error, attempting token refresh");
         originalRequest._retry = true;

         try {
            const refreshToken = await storage.getItem("refresh_token");
            debugLog("Refresh token found:", !!refreshToken);

            if (!refreshToken) {
               throw new Error("No refresh token found");
            }
            const response = await axios.post(`${baseURL}/ranktify/api/refresh`, {
               refresh_token: refreshToken,
            });

            debugLog("Refresh response:", !!response.data?.access_token);

            if (response.data?.access_token) {
               const newAccessToken = response.data.access_token;
               const newRefreshToken = response.data.refresh_token || refreshToken;

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

               axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
               originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

               debugLog("Retrying original request");
               return axiosInstance(originalRequest);
            } else {
               throw new Error("Failed to refresh token");
            }
         } catch (refreshError) {
            debugLog("Token refresh failed:", refreshError);

            await storage.removeItem("jwt_token");
            await storage.removeItem("refresh_token");
            await storage.removeItem("user_info");

            const currentPath = router.canGoBack() ? router.pathname : "";
            debugLog("Current path:", currentPath);

            if (currentPath !== "/login" && currentPath !== "/signup") {
               debugLog("Redirecting to login");
               router.replace("/login");
            }

            return Promise.reject(refreshError);
         }
      }

      return Promise.reject(error);
   }
);

export default axiosInstance;
