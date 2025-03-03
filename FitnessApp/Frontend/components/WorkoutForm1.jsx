import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';

export default function WorkoutForm() {
  const [lift, setLift] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  // Handle form submission
  const handleSubmit = async () => {
    if (!lift || !sets || !reps) {
      // Show an error if fields are empty
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }

    // Prepare the data to send
    const workoutData = {
      lift,
      sets,
      reps,
    };

    try {
      // Here we will later send this data to KrakenID or another backend
      console.log('Workout data submitted:', workoutData);

      // For now, show a success message
      Alert.alert('Success', 'Workout data submitted successfully!');

      // Clear the form
      setLift('');
      setSets('');
      setReps('');
    } catch (error) {
      console.error('Error submitting workout data:', error);
      Alert.alert('Error', 'Something went wrong while submitting the data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Your Workout</Text>

      <TextInput
        style={styles.input}
        placeholder="Lift (e.g., Bench Press)"
        value={lift}
        onChangeText={setLift}
      />

      <TextInput
        style={styles.input}
        placeholder="Sets"
        keyboardType="numeric"
        value={sets}
        onChangeText={setSets}
      />

      <TextInput
        style={styles.input}
        placeholder="Reps"
        keyboardType="numeric"
        value={reps}
        onChangeText={setReps}
      />

      <Button title="Submit Workout" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
});
