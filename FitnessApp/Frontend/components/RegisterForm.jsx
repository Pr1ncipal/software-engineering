import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { API_URL } from './globals';

//  hash the password 
//   sex is M/F, height in inches, weight in lbs 
export default function RegisterForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    dob: '',
    sex: '',
    height: '',
    weight: ''
  });

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // Convert plain text password to SHA-256 hash
  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async () => {
    try {
      const hashedPassword = await hashPassword(formData.password);

      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        username: formData.username,
        pass_hash: hashedPassword, // Send hashd password
        dob: formData.dob, 
        sex: formData.sex.toUpperCase(), // Ensure uppercase M/F
        height: formData.height,
        weight: formData.weight
      };

      const response = await fetch(API_URL +'/api/user/create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'User registered successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to register user.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the server.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput style={styles.input} placeholder="First Name" onChangeText={text => handleChange('first_name', text)} /> // Limit to 20 chars
      <TextInput style={styles.input} placeholder="Last Name" onChangeText={text => handleChange('last_name', text)} /> // Limit to 30 chars
      <TextInput keyboardType = "email-address" style={styles.input} placeholder="Email" onChangeText={text => handleChange('email', text)} />
      <TextInput style={styles.input} placeholder="Username" onChangeText={text => handleChange('username', text)} /> // Limit to 20 chars
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={text => handleChange('password', text)} />
      <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" onChangeText={text => handleChange('dob', text)} /> // Change to date picker
      <TextInput style={styles.input} placeholder="Sex (M/F)" maxLength={1} onChangeText={text => handleChange('sex', text)} /> // Make so they can only get M or F
      <TextInput style={styles.input} placeholder="Height (in inches)" keyboardType="numeric" onChangeText={text => handleChange('height', text)} /> // Height should be changed. Seperate feet and inches
      <TextInput style={styles.input} placeholder="Weight (in lbs)" keyboardType="numeric" onChangeText={text => handleChange('weight', text)} />
      <Button title="Register" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: 'white',
    borderRadius: 5
  }
});
