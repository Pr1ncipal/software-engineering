import { secureStorage, AUTH_TOKEN_KEY } from './secureStorage';

/**
 * Check if the device is connected to the internet
 * @returns {Promise<boolean>}
 */
export const isNetworkAvailable = async () => {
  // Since we're in a web environment, we can check navigator.onLine
  // For better reliability in a real app, you might want to do an actual ping
  return navigator.onLine;
};

/**
 * Encode a string to base64
 * @param {string} str - The string to encode
 * @returns {string} - Base64 encoded string
 */
export const encodeToBase64 = (str) => {
  try {
    // Use the browser's built-in btoa function for base64 encoding
    return btoa(str);
  } catch (error) {
    console.error('Base64 encoding error:', error);
    // Fallback to a more compatible method if needed
    return Buffer.from(str).toString('base64');
  }
};

/**
 * Get authentication headers with properly encoded token
 * @param {string} token - The auth token
 * @returns {object} - Headers object
 */
export const getAuthHeaders = (token) => {
  if (!token) return { 'Content-Type': 'application/json' };
  
  // Encode the token in base64
  const base64Token = encodeToBase64(token);
  
  return {
    'Authorization': `ApiKey ${base64Token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Validate if a token is still valid with the server
 * @param {string} token - The auth token to validate
 * @returns {Promise<boolean>}
 */
export const validateToken = async (token) => {
  try {
    if (!token) return false;
    
    // Get auth headers with base64 encoded token
    const headers = getAuthHeaders(token);
    
    const response = await fetchWithTimeout(
      'http://localhost:8080/api/user/validate_token', 
      {
        method: 'GET',
        headers
      },
      5000 // 5 second timeout
    );
    
    return response.ok;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};

/**
 * Fetch with a timeout to prevent hanging requests
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
export const fetchWithTimeout = (url, options, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeout);
    
    fetch(url, options)
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

/**
 * Fetch with automatic retry for failed requests
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} retries - Number of retry attempts
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
export const fetchWithRetry = async (url, options, retries = 2, timeout = 10000) => {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`Attempt ${i + 1} for ${url}`);
      const response = await fetchWithTimeout(url, options, timeout);
      
      // Check if the response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      // Try to parse the response as JSON
      try {
        const data = await response.json();
        return data;
      } catch (e) {
        // If it's not JSON, return the raw response
        return response;
      }
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed. ${retries - i} retries left.`, error);
      lastError = error;
      
      // Don't retry for certain error types
      if (
        error.message.includes('401') || 
        error.message.includes('403') || 
        error.name === 'AbortError'
      ) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < retries) {
        const delay = 1000 * Math.pow(2, i);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Check if the response status indicates an authentication error
 * @param {Response} response - The fetch response
 * @returns {boolean}
 */
export const isAuthError = (response) => {
  return response.status === 401 || response.status === 403;
};

/**
 * Handle authentication errors by clearing token and redirecting
 */
export const handleAuthError = async () => {
  await secureStorage.removeItem(AUTH_TOKEN_KEY);
  // In a real app, you might want to redirect to login
  // For example: window.location.href = '/login';
};

/**
 * Get the auth token and prepare headers for a request
 * @returns {Promise<object>} - The headers object with encoded token
 */
export const prepareAuthHeaders = async () => {
  const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
  return getAuthHeaders(token);
};