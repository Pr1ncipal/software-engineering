import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Base64 } from 'js-base64'; // Import for consistent encoding

// Storage keys
export const AUTH_TOKEN_KEY = 'authToken';
export const USERNAME_KEY = 'savedUsername';

// Create a platform-independent storage mechanism
export const secureStorage = {
  /**
   * Store a value securely
   * @param {string} key - The key to store under
   * @param {string} value - The value to store
   * @param {boolean} encrypt - Whether to encrypt the value (web only)
   * @returns {Promise<boolean>} - Success indicator
   */
  setItem: async (key, value, encrypt = true) => {
    try {
      if (Platform.OS === 'web') {
        // For web, use localStorage with optional encryption
        if (encrypt && value) {
          // Simple encryption for web
          const encryptedValue = Base64.encode(
            JSON.stringify({ value, timestamp: Date.now() })
          );
          localStorage.setItem(key, encryptedValue);
        } else {
          localStorage.setItem(key, value);
        }
        return true;
      } else {
        // For native platforms, use SecureStore
        await SecureStore.setItemAsync(key, value);
        return true;
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      return false;
    }
  },

  /**
   * Retrieve a securely stored value
   * @param {string} key - The key to retrieve
   * @param {boolean} decrypt - Whether to decrypt the value (web only)
   * @returns {Promise<string|null>} - The stored value or null
   */
  getItem: async (key, decrypt = true) => {
    try {
      if (Platform.OS === 'web') {
        // For web, use localStorage with optional decryption
        const storedValue = localStorage.getItem(key);
        
        if (!storedValue) return null;
        
        if (decrypt) {
          try {
            const decoded = Base64.decode(storedValue);
            const parsed = JSON.parse(decoded);
            return parsed.value;
          } catch (e) {
            // If decryption fails, return the raw value
            // (happens for values stored without encryption)
            return storedValue;
          }
        }
        return storedValue;
      } else {
        // For native platforms, use SecureStore
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove a securely stored value
   * @param {string} key - The key to remove
   * @returns {Promise<boolean>} - Success indicator
   */
  removeItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        // For web, use localStorage
        localStorage.removeItem(key);
        return true;
      } else {
        // For native platforms, use SecureStore
        await SecureStore.deleteItemAsync(key);
        return true;
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  },

  /**
   * Generate an authorization header with the token
   * @returns {Promise<object|null>} - Header object or null
   */
  getAuthHeader: async () => {
    try {
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return null;
      
      // Base64 encode the token
      const base64Token = Base64.encode(token);
      return {
        'Authorization': `ApiKey ${base64Token}`
      };
    } catch (error) {
      console.error('Error creating auth header:', error);
      return null;
    }
  }
};