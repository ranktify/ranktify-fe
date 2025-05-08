import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Helper function for debugging
const debugLog = (message, data = null) => {
   console.log(`[STORAGE] ${message}`, data ? data : "");
};

export const storage = {
   /**
    * Save an item to storage.
    * Uses SecureStore on native and localStorage on web.
    * @param {string} key - The key to save the item under.
    * @param {string} value - The value to save.
    * @returns {Promise<void>}
    */
   async setItem(key, value) {
      try {
         if (Platform.OS === "web") {
            localStorage.setItem(key, value);
            debugLog(`Set item in localStorage: ${key}`);
         } else {
            await SecureStore.setItemAsync(key, value);
            debugLog(`Set item in SecureStore: ${key}`);
         }
      } catch (error) {
         debugLog(`Error setting item ${key}:`, error);
         throw error; // Re-throw error for higher-level handling
      }
   },

   /**
    * Get an item from storage.
    * Uses SecureStore on native and localStorage on web.
    * @param {string} key - The key of the item to retrieve.
    * @returns {Promise<string|null>} The retrieved value or null if not found.
    */
   async getItem(key) {
      try {
         let value;
         if (Platform.OS === "web") {
            value = localStorage.getItem(key);
            debugLog(`Got item from localStorage: ${key}`, !!value);
         } else {
            value = await SecureStore.getItemAsync(key);
            debugLog(`Got item from SecureStore: ${key}`, !!value);
         }
         return value;
      } catch (error) {
         debugLog(`Error getting item ${key}:`, error);
         return null; // Return null on error to prevent crashes
      }
   },

   /**
    * Remove an item from storage.
    * Uses SecureStore on native and localStorage on web.
    * @param {string} key - The key of the item to remove.
    * @returns {Promise<void>}
    */
   async removeItem(key) {
      try {
         if (Platform.OS === "web") {
            localStorage.removeItem(key);
            debugLog(`Removed item from localStorage: ${key}`);
         } else {
            await SecureStore.deleteItemAsync(key);
            debugLog(`Removed item from SecureStore: ${key}`);
         }
      } catch (error) {
         debugLog(`Error removing item ${key}:`, error);
         throw error; // Re-throw error for higher-level handling
      }
   },
};

export default storage;
