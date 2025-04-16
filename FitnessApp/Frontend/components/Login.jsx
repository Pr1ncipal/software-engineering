import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  Button, 
  Text, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Dimensions, 
  Platform,
  ActivityIndicator,
  Switch 
} from 'react-native';
import CryptoJS from "crypto-js";
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
// Replace AsyncStorage with SecureStore
import { secureStorage, AUTH_TOKEN_KEY, USERNAME_KEY } from '../utils/secureStorage';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginForm({ onLogin }) {
  const navigation = useNavigation();
  // Screen dimension handling
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isSmallScreen = screenWidth < 768;

  // Update screen dimensions on orientation change or window resize
  useEffect(() => {
    const updateLayout = () => {
      setScreenWidth(Dimensions.get('window').width);
    };
    Dimensions.addEventListener('change', updateLayout);
    return () => {
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener('change', updateLayout);
      }
    };
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState('');
  
  // Timeout references
  const timeoutRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  //-----------------------------------------------------------------------------------
  // AUTHENTICATION --- Using SecureStore for sensitive data
  
  // Try to load saved credentials on mount
  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        // Check if we have a saved session for auto-login
        const authToken = await secureStorage.getItem(AUTH_TOKEN_KEY);
        
        if (authToken) {
          // Validate token with backend before auto-login
          const tokenValid = await validateToken(authToken);
          
          if (tokenValid) {
            // Trigger onLogin callback if token is valid
            if (onLogin) {
              onLogin();
            }
            // Auto login to home page if token is valid
            navigation.navigate('Home'); 
            return;
          } else {
            // If token is invalid, remove it from SecureStore
            await secureStorage.removeItem(AUTH_TOKEN_KEY);
          }
        }
        
        // Just load username if we're not logged in (this can still use AsyncStorage as it's not sensitive)
        const savedUsername = await secureStorage.getItem(USERNAME_KEY);
        if (savedUsername) {
          setFormData(prev => ({ ...prev, username: savedUsername }));
        }
      } catch (error) {
        console.error("Error loading saved credentials:", error);
      }
    };
    checkSavedCredentials();
  }, [onLogin]);

  // Cleanup timeouts 
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Function to reset the form state
  const resetForm = () => {
    setLoading(false);
    setTimeoutMessage('Sign-in timed out. Please try again.');
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  // Validate token with backend
  const validateToken = async (token) => {
    try {
      // Add error handling for network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
      
      const response = await fetch('http://localhost:8080/api/user/validate-token', {
        method: 'GET',
        headers: { 
          'Authorization': `ApiKey ${token}`,
          'Content-Type': 'application/json' 
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error("Error validating token:", error.message);
      return false;
    }
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    // Just clears timeout message if/when user starts typing again
    if (timeoutMessage) {
      setTimeoutMessage('');
    }
  };

  // Convert plain text password to SHA-256 hash
  const hashPassword = (password) => {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  };

  // Form validation
  const validateForm = () => {
    let isValid = true;
    let newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  // Form submission for regular login
  const handleSubmit = async () => {
    if (!validateForm()) {
      console.log('Validation Error', 'Please correct the errors in the form');
      return;
    }
    
    setLoading(true);
    setTimeoutMessage('');
    
    // timeout for 5 seconds to show "taking longer" message
    timeoutRef.current = setTimeout(() => {
      setTimeoutMessage('The sign-in process is taking longer than expected. Please wait...');
    }, 5000);
    // Timeout for 15 seconds to reset the form
    resetTimeoutRef.current = setTimeout(() => {
      resetForm();
    }, 15000);
    

    try {
      const hashedPassword = hashPassword(formData.password);
      
      const userData = {
        username: formData.username,
        pass_hash: hashedPassword,
      };
  
      console.log("Sending login data:", userData);
      
      const response = await fetch('http://localhost:8080/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      // Clear the timeouts when we get a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Login response:", data); // Log the full response

      // ALWAYS store the token for API validation during this session
      await secureStorage.setItem(AUTH_TOKEN_KEY, data.token);

      // Only store username if "Remember Me" is checked
      if (rememberMe) {
        await secureStorage.setItem(USERNAME_KEY, formData.username);
        console.log("Credentials saved with Remember Me");
      } else {
        // If "Remember Me" is not checked, we'll still need the token for this session
        // but should set it to expire (we'll use a workaround since SecureStore doesn't support expiry)
        console.log("Token saved for this session only");
      }

      console.log("Token saved to SecureStore");
      
      // Reset loading state
      setLoading(false);
      
      // Trigger onLogin callback if provided
      if (onLogin) {
        onLogin();
      }
      
      // Show success message
      Alert.alert('Success', 'Login successful!');
      navigation.navigate('Home');
      
    } catch (error) {
      console.error("Error in submission:", error);
      Alert.alert('Error', 'Login failed. Please check your credentials.');
      setLoading(false);
      setTimeoutMessage('');
    }
  };
  //-------------------------------------------------------------------------------------

  // Add a logout function for later use
  const logout = async () => {
    try {
      await secureStorage.removeItem(AUTH_TOKEN_KEY);
      // You may want to keep the username for convenience
      // await secureStorage.removeItem(USERNAME_KEY);
      
      // Navigate to login screen or show confirmation
      Alert.alert('Logged out', 'You have been logged out successfully.');
      
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Rest of your component remains the same...
  // Placeholder for social sign-in handlers (UI only)
  const handleGoogleSignIn = () => {
    Alert.alert('Notice', 'Google Sign-In functionality is currently disabled.');
  };

  const handleAppleSignIn = () => {
    Alert.alert('Notice', 'Apple Sign-In functionality is currently disabled.');
  };

  // Navigation functions
  const navigateToRegister = () => {
    navigation.navigate('RegisterForm');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const [fontsLoaded] = useFonts({
    'RalewayRegular': require('../assets/fonts/Raleway-Regular.ttf'),
  });
  
  if (!fontsLoaded) {
    return null; // Or show a <Text>Loading...</Text> or <ActivityIndicator />
  }

  return (
    <LinearGradient
      colors={['#007AFF', '#B3E5FC']}
      style={styles.safeArea}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.outerContainer}>
          <View style={[
            styles.container, 
            isSmallScreen ? styles.containerSmall : styles.containerLarge
          ]}>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>Sign In</Text>
                <View style={styles.titleUnderline} />
            </View>

  
            <Text style={styles.label}>Username:</Text>
            <TextInput 
              style={[
                styles.input, 
                errors.username ? styles.inputError : null,
                loading ? styles.inputDisabled : null,
                isSmallScreen ? styles.inputSmall : {}
              ]} 
              placeholder="Username" 
              value={formData.username}
              onChangeText={text => handleChange('username', text)} 
              autoCapitalize="none"
              testID="username-input"
              editable={!loading}
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
  
            <Text style={styles.label}>Password:</Text>
            <TextInput 
              style={[
                styles.input, 
                errors.password ? styles.inputError : null,
                loading ? styles.inputDisabled : null,
                isSmallScreen ? styles.inputSmall : {}
              ]} 
              placeholder="Password" 
              secureTextEntry 
              value={formData.password}
              onChangeText={text => handleChange('password', text)} 
              testID="password-input"
              editable={!loading}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
  
            <View style={styles.rememberForgotRow}>
              <View style={styles.rememberMeContainer}>
                <Switch
                  value={rememberMe}
                  onValueChange={val => {
                    setRememberMe(val);
                    if (timeoutMessage) setTimeoutMessage('');
                  }}
                  trackColor={{ false: "#767577", true: "#007AFF" }}
                  thumbColor={rememberMe ? "#007AFF" : "#f4f3f4"}
                  testID="remember-me-switch"
                  disabled={loading}
                />
                <Text style={styles.rememberMeText}>Remember me</Text>
              </View>
  
              <TouchableOpacity 
                onPress={handleForgotPassword}
                style={styles.forgotPasswordContainer}
                testID="forgot-password-button"
                disabled={loading}
              >
                <Text style={[
                  styles.forgotPasswordText,
                  loading ? styles.textDisabled : null
                ]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
  
            <View style={styles.buttonContainer}>
              <Button 
                title={loading ? "Signing in..." : "Log In"} 
                onPress={handleSubmit} 
                color="#007AFF" 
                disabled={loading}
                testID="login-button"
              />
            </View>
  
            {timeoutMessage ? (
              <View style={styles.timeoutContainer}>
                <Text style={[
                  styles.timeoutMessage,
                  timeoutMessage.includes('timed out') ? styles.timeoutError : null
                ]}>
                  {timeoutMessage}
                </Text>
              </View>
            ) : null}
  
            <View style={styles.socialContainer}>
              <Text style={styles.orText}>OR</Text>
              <TouchableOpacity 
                style={[
                  styles.socialButton, 
                  styles.googleButton,
                  loading ? styles.buttonDisabled : null
                ]}
                onPress={handleGoogleSignIn}
                disabled={loading}
                testID="google-signin-button"
              >
                <View style={styles.socialButtonContent}>
                  <Text style={[
                    styles.googleButtonText,
                    loading ? styles.textDisabled : null
                  ]}>
                    Sign in with Google
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.socialButton, 
                  styles.appleButton,
                  loading ? styles.buttonDisabled : null
                ]}
                onPress={handleAppleSignIn}
                disabled={loading}
                testID="apple-signin-button"
              >
                <View style={styles.socialButtonContent}>
                  <Text style={[
                    styles.appleButtonText,
                    loading ? styles.textDisabled : null
                  ]}>
                    Sign in with Apple
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
  
            {loading && (
              <ActivityIndicator 
                size="large" 
                color="#007AFF" 
                style={styles.loadingIndicator} 
              />
            )}
  
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={navigateToRegister} 
                testID="register-link"
                disabled={loading}
              >
                <Text style={[
                  styles.registerLink,
                  loading ? styles.textDisabled : null
                ]}>Register here!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}


// Styles 
const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingVertical: 20,
    },
    outerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    container: {
      marginBottom: 20,
      padding: 20,
      backgroundColor: 'white',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 6,
    },
    containerLarge: {
      width: '50%',
      maxWidth: 500,
    },
    containerSmall: {
      width: '90%',
      maxWidth: 500,
    },
    title: {
        fontSize: 30,
        fontFamily: 'RalewayRegular',
        color: '#007AFF', // or #007AFF if you want to keep it blue
        textAlign: 'center',
      },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 25,
      },
      
    titleUnderline: {
        marginTop: 6,
        width: 40,
        height: 4,
        backgroundColor: '#007AFF',
        borderRadius: 2,
      },
            
    label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 5,
      color: '#555',
    },
    input: {
      height: 48,
      borderColor: '#ccc',
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 12,
      backgroundColor: '#f2f2f2',
      borderRadius: 10,
      fontSize: 16,
      color: '#333',
    },
    inputSmall: {
      height: 50,
      fontSize: 16,
      marginBottom: 15,
    },
    inputError: {
      borderColor: '#dc3545',
    },
    inputDisabled: {
      backgroundColor: '#f5f5f5',
      color: '#888',
    },
    errorText: {
      color: '#dc3545',
      fontSize: 12,
      marginTop: -10,
      marginBottom: 10,
    },
    rememberForgotRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    rememberMeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rememberMeText: {
      marginLeft: 8,
      color: '#555',
      fontSize: 14,
    },
    forgotPasswordContainer: {
      alignSelf: 'flex-end',
    },
    forgotPasswordText: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '600',
    },
    buttonContainer: {
      marginTop: 10,
      width: '100%',
      borderRadius: 10,
      overflow: 'hidden',
    },
    socialContainer: {
      marginTop: 20,
      width: '100%',
      alignItems: 'center',
    },
    orText: {
      color: '#888',
      marginVertical: 10,
      fontWeight: '500',
    },
    socialButton: {
      width: '100%',
      height: 45,
      borderRadius: 10,
      marginVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 2,
    },
    socialButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleButton: {
      backgroundColor: 'black',
      borderColor: '#ddd',
      borderWidth: 1,
    },
    appleButton: {
      backgroundColor: 'black',
    },
    googleButtonText: {
      color: '#007AFF',
      fontWeight: '600',
      marginLeft: 10,
    },
    appleButtonText: {
      color: 'white',
      fontWeight: '600',
      marginLeft: 10,
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    registerText: {
      color: '#555',
    },
    registerLink: {
      color: '#007AFF',
      fontWeight: 'bold',
    },
    loadingIndicator: {
      marginTop: 20,
    },
    textDisabled: {
      color: '#aaa',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    timeoutContainer: {
      marginTop: 10,
      alignItems: 'center',
    },
    timeoutMessage: {
      color: '#007AFF',
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '500',
    },
    timeoutError: {
      color: '#e74c3c',
    }
  });