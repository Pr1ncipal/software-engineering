import { fetchWithRetry, encodeToBase64 } from '../utils/networkUtils';
import { AUTH_TOKEN_KEY, USERNAME_KEY, secureStorage } from '../utils/secureStorage';

// Base API URL - should be configured based on environment
const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Create a signature using the secret key and proper HS256 algorithm
 * @param {string} contentToSign - The content to sign
 * @param {string} secretKey - The secret key to use for signing
 * @returns {Promise<string>} - The generated signature
 */
const createSignature = async (contentToSign, secretKey) => {
  // Convert content and key to binary format
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const data = encoder.encode(contentToSign);
  
  // Import the key for cryptographic operations
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw', 
    keyData, 
    { name: 'HMAC', hash: 'SHA-256' },
    false, 
    ['sign']
  );
  
  // Sign using HMAC-SHA256
  const signature = await window.crypto.subtle.sign(
    'HMAC', 
    cryptoKey, 
    data
  );
  
  // Convert signature to base64 and clean for URL safety
  const signatureArray = new Uint8Array(signature);
  let signatureStr = '';
  for (let i = 0; i < signatureArray.length; i++) {
    signatureStr += String.fromCharCode(signatureArray[i]);
  }
  
  // Use correct base64 URL encoding (RFC 4648)
  return btoa(signatureStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Create a JWT-like token for browser compatibility
 * This is a simplified version that creates a structure similar to JWT
 * @param {object} payload - The payload to encode in the token
 * @returns {Promise<string>} - Token string
 */
const createJwtToken = async (payload) => {
  try {
    // Use secureStorage instead of localStorage
    const apiKey = await secureStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!apiKey) {
      throw new Error('No authentication token found');
    }
    
    // Remove any "ApiKey " prefix if present
    const secretKey = apiKey.replace(/^ApiKey\s+/, '');
    
    // Create standard JWT header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    // Create payload with timestamp
    const jwtPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      // We're not adding an expiration as per requirements
    };
    
    // Encode the header and payload for base64url format (RFC 4648)
    const headerString = JSON.stringify(header);
    const payloadString = JSON.stringify(jwtPayload);
    
    const encodedHeader = btoa(headerString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const encodedPayload = btoa(payloadString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Create the content to sign (header.payload)
    const contentToSign = `${encodedHeader}.${encodedPayload}`;
    
    // Create a signature using the HS256 algorithm
    const signature = await createSignature(contentToSign, secretKey);
    
    // Combine all parts into a standard JWT format: header.payload.signature
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  } catch (error) {
    console.error('Error creating JWT token:', error);
    throw error;
  }
};

/**
 * Helper function to prepare authentication headers
 * @returns {Promise<Object>} Headers object with authentication
 */
const prepareAuthHeaders = async () => {
  try {
    // Use the getAuthHeader method from secureStorage when possible
    const authHeader = await secureStorage.getAuthHeader();
    
    if (authHeader) {
      console.log('Using secure auth headers:', authHeader);
      return {
        'Content-Type': 'application/json',
        ...authHeader
      };
    }
    
    // Fallback to direct API key access if getAuthHeader doesn't work
    const apiKey = await secureStorage.getItem(AUTH_TOKEN_KEY);
    console.log('Preparing authentication headers with API key:', apiKey);
    
    if (!apiKey) {
      throw new Error('No authentication token found');
    }
    
    // Remove any "ApiKey " prefix to use clean base64
    const cleanApiKey = apiKey.replace(/^ApiKey\s+/, '');
    
    // Add the ApiKey prefix in the header
    return {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${cleanApiKey}`
    };
  } catch (error) {
    console.error('Error preparing authentication headers:', error);
    throw error;
  }
};

/**
 * Wrap payload in JWT token format
 * @param {object} payload - The payload to wrap
 * @returns {Promise<object>} - Wrapped payload with JWT token
 */
const wrapWithJwt = async (payload) => {
  const token = await createJwtToken(payload);
  return { token };
};

/**
 * Service for family-related API operations
 */
export const familyService = {
  /**
   * Create a new family
   * @param {string} familyName - Name of the family to create
   * @returns {Promise<object>} - The created family object
   */
  createFamily: async (familyName) => {
    try {
      // Get authentication headers
      const headers = await prepareAuthHeaders();
      
      // Create payload
      const payload = {
        family_name: familyName
      };
      
      // Create JWT wrapped payload for POST request
      const jwtPayload = await wrapWithJwt(payload);
      
      console.log('Sending JWT payload for create family:', jwtPayload);
      
      const response = await fetchWithRetry(
        `${API_BASE_URL}/family/create_family`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(jwtPayload)
        }
      );
      
      // Accept both 200 and 201 as success codes
      if (response.status !== 200 && response.status !== 201) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create family');
      }
      
      // For 201 responses, the body might be empty, so return a default success object
      if (response.status === 201) {
        try {
          return await response.json();
        } catch (e) {
          // If parsing fails (empty body), return a success object
          return { success: true, message: "Family created successfully", family_name: familyName };
        }
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating family:', error);
      throw error;
    }
  },
  
  /**
   * Get all families for the current user
   * @returns {Promise<Array>} - List of families
   */
  getFamilies: async () => {
    try {
      console.log('Starting getFamilies request');
      const headers = await prepareAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/family/get_families`, {
        method: 'GET',
        headers,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      // Parse the response as JSON
      const data = await response.json();
      console.log('Parsed families:', data);

      return data;
    } catch (error) {
      console.error('Error in getFamilies:', error);
      throw error;
    }
  },
  
  /**
   * Get members of a specific family
   * @param {string} familyName - Name of the family
   * @returns {Promise<Array>} - List of family members
   */
  getFamilyMembers: async (familyName) => {
    try {
      console.log(`Fetching members for family: ${familyName}`);
      const headers = await prepareAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/family/get_family_members?family_name=${encodeURIComponent(familyName)}`, {
        method: 'GET',
        headers,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      // Parse the response as JSON
      const data = await response.json();
      console.log('Parsed family members:', data);

      return data;
    } catch (error) {
      console.error('Error in getFamilyMembers:', error);
      throw error;
    }
  },
  
  /**
   * Delete a family (admin only)
   * @param {string} familyName - Name of the family to delete
   * @returns {Promise<object>} - Response from the server
   */
  deleteFamily: async (familyName) => {
    try {
      const headers = await prepareAuthHeaders();
      
      // DELETE request - use query parameters, no JWT needed
      const response = await fetchWithRetry(
        `${API_BASE_URL}/family/delete_family?family_name=${encodeURIComponent(familyName)}`,
        {
          method: 'DELETE',
          headers
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete family ${familyName}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting family ${familyName}:`, error);
      throw error;
    }
  },
  
  /**
   * Send a notification to invite a user to a family
   * @param {string} familyName - Name of the family
   * @param {string} receiverUsername - Username of the user to invite
   * @returns {Promise<object>} - The created notification object
   */
  sendFamilyInvitation: async (familyName, receiverUsername) => {
    try {
      const headers = await prepareAuthHeaders();
      
      const payload = {
        family_name: familyName,
        receiver_username: receiverUsername
      };
      
      // Create JWT wrapped payload for POST request
      const jwtPayload = await wrapWithJwt(payload);
      
      const response = await fetchWithRetry(
        `${API_BASE_URL}/family/create_family_request`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(jwtPayload)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending family invitation:', error);
      throw error;
    }
  },
  
  /**
   * Remove a user from a family
   * @param {string} familyName - Name of the family
   * @param {string} username - Username of the user to remove
   * @returns {Promise<object>} - Response from the server
   */
  removeUser: async (familyName, username) => {
    try {
      const headers = await prepareAuthHeaders();
      
      // DELETE request - use query parameters, no JWT needed
      const response = await fetchWithRetry(
        `${API_BASE_URL}/family/remove_family_member?family_name=${encodeURIComponent(familyName)}&username=${encodeURIComponent(username)}`,
        {
          method: 'DELETE',
          headers
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove user from family');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error removing user from family ${familyName}:`, error);
      throw error;
    }
  },
  
  /**
   * Leave a family
   * @param {string} familyName - Name of the family to leave
   * @returns {Promise<object>} - Response from the server
   */
  leaveFamily: async (familyName) => {
    try {
      const headers = await prepareAuthHeaders();
      
      // DELETE request - use query parameters, no JWT needed
      const response = await fetchWithRetry(
        `${API_BASE_URL}/family/leave?family_name=${encodeURIComponent(familyName)}`,
        {
          method: 'DELETE',
          headers
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Special handling for the case where user is the only admin
        if (errorData.error_code === "CANNOT_LEAVE_FAMILY") {
          throw new Error("You cannot leave the family as you are the only admin. Promote another member first.");
        }
        
        throw new Error(errorData.message || 'Failed to leave family');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error leaving family ${familyName}:`, error);
      throw error;
    }
  },
  
  /**
   * Promote a user to admin in a family
   * @param {string} familyName - Name of the family
   * @param {string} username - Username of the user to promote
   * @returns {Promise<object>} - Response from the server
   */
  promoteToAdmin: async (familyName, username) => {
    try {
      const headers = await prepareAuthHeaders();
      
      const payload = {
        family_name: familyName,
        username: username
      };
      
      // Create JWT wrapped payload for PUT request
      const jwtPayload = await wrapWithJwt(payload);
      
      const response = await fetchWithRetry(
        `${API_BASE_URL}/family/change_admin`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(jwtPayload)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to promote user to admin');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error promoting user in family ${familyName}:`, error);
      throw error;
    }
  },

  /**
   * Get all notifications for the current user
   * @returns {Promise<Array>} - List of notifications
   */
  getNotifications: async () => {
    try {
      const headers = await prepareAuthHeaders();

      // GET request - no JWT needed, just use auth header
      const response = await fetchWithRetry(
        `${API_BASE_URL}/family/get_requests`,
        {
          method: 'GET',
          headers,
        }
      );

      console.log('Raw notifications response:', response);

      // Ensure the response contains the expected structure
      if (response && typeof response === 'object' && 'requests' in response) {
        const requests = Array.isArray(response.requests) ? response.requests : [];
        console.log('Parsed notifications:', requests);
        return requests;
      } else {
        console.warn('Unexpected response structure for notifications:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
  
  /**
   * Accept a family invitation
   * @param {number} requestId - ID of the invitation request to accept
   * @returns {Promise<object>} - Response from the server
   */
  acceptFamilyInvitation: async (requestId) => {
    try {
      const headers = await prepareAuthHeaders();
      
      const payload = {
        request_id: requestId,
        accept: true
      };
      
      // Create JWT wrapped payload for PUT request
      const jwtPayload = await wrapWithJwt(payload);
      
      const response = await fetchWithRetry(
        `${API_BASE_URL}/family/accept_family_request`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(jwtPayload)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept invitation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error accepting family invitation:', error);
      throw error;
    }
  },

  /**
   * Decline a family invitation
   * @param {number} requestId - ID of the invitation request to decline
   * @returns {Promise<object>} - Response from the server
   */
  declineFamilyInvitation: async (requestId) => {
    try {
      const headers = await prepareAuthHeaders();
      
      const payload = {
        request_id: requestId,
        accept: false
      };
      
      // Create JWT wrapped payload for PUT request
      const jwtPayload = await wrapWithJwt(payload);
      
      // Reusing the accept endpoint with accept: false
      const response = await fetchWithRetry(
        `${API_BASE_URL}/family/accept_family_request`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(jwtPayload)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to decline invitation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error declining family invitation:', error);
      throw error;
    }
  },

  /**
   * Current username helper
   * @returns {Promise<string>} - Current username
   */
  getCurrentUsername: async () => {
    try {
      return await secureStorage.getItem(USERNAME_KEY) || '';
    } catch (error) {
      console.error('Error getting current username:', error);
      return '';
    }
  }
};