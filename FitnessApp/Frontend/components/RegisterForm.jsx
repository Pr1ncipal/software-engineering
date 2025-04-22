import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, ScrollView, Platform, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CryptoJS from "crypto-js";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { secureStorage } from '@/utils/secureStorage';
import { Box } from '@mui/material';

const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS === 'web') {
    // For web, use the browser's native alert
    // You could also use a custom modal component here
    if (buttons.length > 1) {
      // If there are multiple buttons, use confirm() for simple cases
      if (window.confirm(`${title}\n\n${message}`)) {
        // User clicked OK/first action
        buttons[0].onPress && buttons[0].onPress();
      } else {
        // User clicked Cancel/second action
        buttons[1].onPress && buttons[1].onPress();
      }
    } else {
      // Simple alert with just an OK button
      window.alert(`${title}\n\n${message}`);
      buttons[0].onPress && buttons[0].onPress();
    }
  } else {
    // For mobile, use React Native's Alert
    Alert.alert(title, message, buttons);
  }
};


export default function RegisterForm({ onLogin }) {
  const navigation = useNavigation();

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isSmallScreen = screenWidth < 768;

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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
  const months = [
    { label: "Jan", value: "01" }, { label: "Feb", value: "02" }, { label: "Mar", value: "03" },
    { label: "Apr", value: "04" }, { label: "May", value: "05" }, { label: "June", value: "06" },
    { label: "July", value: "07" }, { label: "Aug", value: "08" }, { label: "Sep", value: "09" },
    { label: "Oct", value: "10" }, { label: "Nov", value: "11" }, { label: "Dec", value: "12" }
  ];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const feet = Array.from({ length: 7 }, (_, i) => (i + 1).toString() + "'");
  const inches = Array.from({ length: 12 }, (_, i) => i.toString() + "\"");

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', username: '', password: '',
    year: currentYear.toString(), month: "01", day: "01", sex: 'M',
    feet: "5'", inches: "6\"", weight: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => setFormData({ ...formData, [name]: value });
  const hashPassword = (password) => CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.weight.trim() || isNaN(formData.weight)) newErrors.weight = 'Weight must be a number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert('Validation Error', 'Please correct the errors in the form');
      return;
    }
    
    try {
      const hashedPassword = hashPassword(formData.password);
      
      // Format DOB as YYYY-MM-DD
      const dob = `${formData.year}-${formData.month}-${formData.day}`;
      
      // Calculate height in inches from feet and inches
      const feetValue = parseInt(formData.feet.replace("'", ""));
      const inchesValue = parseInt(formData.inches.replace("\"", ""));
      const heightInInches = (feetValue * 12) + inchesValue;

      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        username: formData.username,
        password_hash: hashedPassword,
        dob: dob,                
        sex: formData.sex,       
        height: heightInInches.toString(), // Convert to string for consistency
        weight: formData.weight
      };

      console.log("Sending user data:", userData);
      
      const response = await fetch('http://localhost:8080/api/user/create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Registration failed with status: ${response.status}`;
        } catch (jsonError) {
          errorMessage = `Registration failed with status: ${response.status}. Could not parse error details.`;
        }
        
        console.error("Registration failed:", errorMessage);
        showAlert('Registration Failed', errorMessage);
        return;
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Success response data:", data);
      } catch (jsonError) {
        console.error("Error parsing success response:", jsonError);
        showAlert('Warning', 'Registration may have succeeded but we could not process the server response.');
        return;
      }
      
      if (data.token) {
        try {
          await secureStorage.setItem(AUTH_TOKEN_KEY, data.token);
          console.log("Authentication token saved to SecureStore");
        } catch (storageError) {
          console.error("Error storing auth token:", storageError);
          showAlert('Warning', 'Registration successful, but there was a problem saving your login token.');
        }
      } else {
        console.warn("No authentication token received from registration");
        showAlert('Note', 'Your account was created but no login token was provided. You may need to log in separately.');
      }
      
      showAlert(
        'Registration Successful', 
        'Your account has been created successfully!',
        [
          { 
            text: 'Go to Login', 
            onPress: () => {
              if (navigation) {
                navigation.navigate('Login');
              } else {
                console.error("Navigation object is not available");
              }
            } 
          },
          {
            text: 'Stay Here',
            style: 'cancel'
          }
        ]
      );
      
    } catch (error) {
      console.error("Unexpected error in registration:", error);
      showAlert(
        'Registration Error', 
        error.message || 'An unexpected error occurred during registration. Please try again later.'
      );
    }
  };

  const RenderPicker = ({ selectedValue, onValueChange, items, style }) => (
    Platform.OS === 'ios' ?
      <View style={[style, styles.iosPicker]}>
        <Picker selectedValue={selectedValue} onValueChange={onValueChange} itemStyle={styles.iosPickerItem}>{items}</Picker>
      </View> :
      <Picker style={style} selectedValue={selectedValue} onValueChange={onValueChange}>{items}</Picker>
  );

  return (
    <View style={{ height: '100vh', width: '100%', overflow: 'auto' }}>
      <LinearGradient 
        colors={['#FDA085', '#007AFF', '#B3E5FC']} 
        style={{ minHeight: '100%', width: '100%' }}
      >
        <View style={[styles.outerContainer, { paddingTop: 60, paddingBottom: 100 }]}>
          <View style={[styles.container, isSmallScreen ? styles.containerSmall : styles.containerLarge]}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back to Login</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Strong Starts Here!</Text>


            <Text style={styles.label}>Name:</Text>
            <View style={styles.nameContainer}>
              <View style={styles.nameField}>
                <TextInput
                  style={[
                    styles.input,
                    errors.first_name ? styles.inputError : null,
                    isSmallScreen ? styles.inputSmall : {}
                  ]}
                  placeholder="First Name"
                  value={formData.first_name}
                  onChangeText={text => handleChange('first_name', text)}
                  maxLength={20}
                />
                {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
              </View>
            
              <View style={styles.nameField}>
                <TextInput
                  style={[
                    styles.input,
                    errors.last_name ? styles.inputError : null,
                    isSmallScreen ? styles.inputSmall : {}
                  ]}
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChangeText={text => handleChange('last_name', text)}
                  maxLength={30}
                />
                {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
              </View>
            </View>
          
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={[
                styles.input,
                errors.email ? styles.inputError : null,
                isSmallScreen ? styles.inputSmall : {}
              ]}
              placeholder="Email"
              value={formData.email}
              keyboardType="email-address"
              onChangeText={text => handleChange('email', text)}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          
            <Text style={styles.label}>Username:</Text>
            <TextInput
              style={[
                styles.input,
                errors.username ? styles.inputError : null,
                isSmallScreen ? styles.inputSmall : {}
              ]}
              placeholder="Username"
              value={formData.username}
              onChangeText={text => handleChange('username', text)}
              maxLength={20}
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          
            <Text style={styles.label}>Password:</Text>
            <TextInput
              style={[
                styles.input,
                errors.password ? styles.inputError : null,
                isSmallScreen ? styles.inputSmall : {}
              ]}
              placeholder="Password (8+ characters)"
              secureTextEntry
              value={formData.password}
              onChangeText={text => handleChange('password', text)}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}


            <Text style={styles.label}>Date of Birth:</Text>
            <View style={[
              styles.pickerContainer,
              isSmallScreen ? styles.pickerContainerSmall : {}
            ]}>
              <RenderPicker
                style={[
                  styles.picker,
                  isSmallScreen ? styles.pickerSmall : {}
                ]}
                selectedValue={formData.month}
                onValueChange={(value) => handleChange('month', value)}
                items={months.map((month) => <Picker.Item key={month.value} label={month.label} value={month.value} />)}
              />
              <RenderPicker
                style={[
                  styles.picker,
                  isSmallScreen ? styles.pickerSmall : {}
                ]}
                selectedValue={formData.day}
                onValueChange={(value) => handleChange('day', value)}
                items={days.map((day) => <Picker.Item key={day} label={day} value={day} />)}
              />
              <RenderPicker
                style={[
                  styles.picker,
                  isSmallScreen ? styles.pickerSmall : {}
                ]}
                selectedValue={formData.year}
                onValueChange={(value) => handleChange('year', value)}
                items={years.map((year) => <Picker.Item key={year} label={year.toString()} value={year.toString()} />)}
              />
            </View>


            <Text style={styles.label}>Sex:</Text>
            <RenderPicker
              style={[
                styles.input,
                isSmallScreen ? styles.inputSmall : {}
              ]}
              selectedValue={formData.sex}
              onValueChange={(value) => handleChange('sex', value)}
              items={[
                <Picker.Item key="M" label="Male" value="M" />,
                <Picker.Item key="F" label="Female" value="F" />
              ]}
            />


            <Text style={styles.label}>Height:</Text>
            <View style={[
              styles.pickerContainer,
              isSmallScreen ? styles.pickerContainerSmall : {}
            ]}>
              <RenderPicker
                style={[
                  styles.picker,
                  isSmallScreen ? styles.pickerSmall : {}
                ]}
                selectedValue={formData.feet}
                onValueChange={(value) => handleChange('feet', value)}
                items={feet.map((ft) => <Picker.Item key={ft} label={ft} value={ft} />)}
              />
              <RenderPicker
                style={[
                  styles.picker,
                  isSmallScreen ? styles.pickerSmall : {}
                ]}
                selectedValue={formData.inches}
                onValueChange={(value) => handleChange('inches', value)}
                items={inches.map((inch) => <Picker.Item key={inch} label={inch} value={inch} />)}
              />
            </View>


            <Text style={styles.label}>Weight:</Text>
            <TextInput
              style={[
                styles.input,
                errors.weight ? styles.inputError : null,
                isSmallScreen ? styles.inputSmall : {}
              ]}
              placeholder="Weight (in lbs)"
              keyboardType="numeric"
              value={formData.weight}
              onChangeText={text => handleChange('weight', text)}
            />
            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}


            <View style={styles.buttonContainer}>
              <Button title="Register" onPress={handleSubmit} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    height: '100vh', // Explicit height for web
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  outerContainer: {
    width: '100%',
    minHeight: '100%',
    paddingTop: 60,
    paddingBottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Keep your other styles the same
  container: {
    width: '90%', // Make container take most of the width on all screens
    marginBottom: 50, // Add more bottom margin
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
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 25,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#555',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  nameField: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  pickerContainerSmall: {
    flexDirection: 'row',
  },
  picker: {
    flex: 1,
    height: Platform.OS === 'ios' ? 150 : 40,
    marginHorizontal: 2,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  pickerSmall: {
    height: Platform.OS === 'ios' ? 150 : 50,
    fontSize: 16,
  },
  iosPicker: {
    overflow: 'hidden',
    backgroundColor: 'white',
    borderRadius: 5,
  },
  iosPickerItem: {
    height: 110,
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  inputSmall: {
    height: 50, // Taller input fields on small screens
    fontSize: 16, // Larger font for better touch targets
    marginBottom: 15,
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 10,
    width: '100%',
  }
});

