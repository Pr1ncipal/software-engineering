import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    date_of_birth: '',
    sex: '',
    height: ''
  });

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      <TextInput style={styles.input} placeholder="Email" onChangeText={text => handleChange('email', text)} />
      <TextInput style={styles.input} placeholder="Username" onChangeText={text => handleChange('username', text)} />
      <TextInput style={styles.input} placeholder="First Name" onChangeText={text => handleChange('first_name', text)} />
      <TextInput style={styles.input} placeholder="Last Name" onChangeText={text => handleChange('last_name', text)} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={text => handleChange('password', text)} />
      <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" onChangeText={text => handleChange('date_of_birth', text)} />
      <TextInput style={styles.input} placeholder="Sex (M/F)" onChangeText={text => handleChange('sex', text)} />
      <TextInput style={styles.input} placeholder="Height (in inches)" keyboardType="numeric" onChangeText={text => handleChange('height', text)} />
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
