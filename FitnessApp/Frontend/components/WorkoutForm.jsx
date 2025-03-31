import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { secureStorage, AUTH_TOKEN_KEY } from '../utils/secureStorage';
import ChooseExercise from './chooseExercise';
import encode from 'jwt-encode';
import decode from 'jwt-decode';

export default function WorkoutForm() {
  // User and workout metadata
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState('Strength');
  const [notes, setNotes] = useState('');
  const [heartRate, setHeartRate] = useState('');
  
  // Modal state for exercise picker
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
  
  // Exercises array
  const [exercises, setExercises] = useState([{
    exerciseID: Date.now().toString(),
    exerciseOrder: 1,
    superset: '-1',
    exerciseName: '',
    reps: ['0'],
    setType: ['Normal'],
    weight: ['0'],
    perceivedDifficulty: ['5'],
    exerciseNotes: ''
  }]);

  // Set types for dropdown
  const setTypes = ['Warmup', 'Normal', 'Drop', 'Failure'];

  // Difficulty options for the Picker
  const difficultyOptions = [1, 2, 3, 4, 5];

  // Auth state
  const [authToken, setAuthToken] = useState(null);

  // Add effect to get auth token
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
        setAuthToken(token);
      } catch (err) {
        console.error('Error retrieving auth token:', err);
        Alert.alert('Error', 'Authentication failed. Please log in again.');
      }
    };
    
    getAuthToken();
  }, []);

  // Open exercise selection modal for a specific exercise
  const openExerciseModal = (exerciseIndex) => {
    setCurrentExerciseIndex(exerciseIndex);
    setExerciseModalVisible(true);
  };

  // Handle exercise selection from the modal
  const handleExerciseSelect = (selectedExercise) => {
    if (currentExerciseIndex !== null) {
      const updatedExercises = [...exercises];
      updatedExercises[currentExerciseIndex].exerciseName = selectedExercise.name;
      
      // If the exercise has an ID from the database, store it
      if (selectedExercise.id) {
        updatedExercises[currentExerciseIndex].databaseExerciseId = selectedExercise.id;
      }
      
      setExercises(updatedExercises);
    }
    // Close the modal
    setExerciseModalVisible(false);
    setCurrentExerciseIndex(null);
  };

  // Add a new exercise to the list
  const addExercise = () => {
    const newExerciseId = Date.now().toString();
    setExercises([...exercises, {
      exerciseID: newExerciseId,
      exerciseOrder: exercises.length + 1,
      superset: '-1',
      exerciseName: '',
      reps: ['0'],
      setType: ['Normal'],
      weight: ['0'],
      perceivedDifficulty: ['5'],
      exerciseNotes: ''
    }]);
  };

  // Add a new set to an exercise
  const addSet = (exerciseIndex) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].reps.push('0');
    updatedExercises[exerciseIndex].setType.push('Normal');
    updatedExercises[exerciseIndex].weight.push('0');
    updatedExercises[exerciseIndex].perceivedDifficulty.push('5');
    setExercises(updatedExercises);
  };

  // Update exercise values
  const updateExerciseField = (exerciseIndex, field, value) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex][field] = value;
    setExercises(updatedExercises);
  };

  // Update set values
  const updateSetField = (exerciseIndex, field, setIndex, value) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex][field][setIndex] = value;
    setExercises(updatedExercises);
  };

  // Remove an exercise
  const removeExercise = (exerciseIndex) => {
    const updatedExercises = exercises.filter((_, index) => index !== exerciseIndex);
    // Update order numbers
    updatedExercises.forEach((exercise, index) => {
      exercise.exerciseOrder = index + 1;
    });
    setExercises(updatedExercises);
  };

  // Remove a set
  const removeSet = (exerciseIndex, setIndex) => {
    if (exercises[exerciseIndex].reps.length > 1) {
      const updatedExercises = [...exercises];
      updatedExercises[exerciseIndex].reps.splice(setIndex, 1);
      updatedExercises[exerciseIndex].setType.splice(setIndex, 1);
      updatedExercises[exerciseIndex].weight.splice(setIndex, 1);
      updatedExercises[exerciseIndex].perceivedDifficulty.splice(setIndex, 1);
      setExercises(updatedExercises);
    } else {
      Alert.alert('Cannot Remove', 'Each exercise must have at least one set');
    }
  };

  // Parse numeric values before submission
  const parseNumericValues = (data) => {
    return {
      ...data,
      superset: parseInt(data.superset) || -1,
      reps: data.reps.map(rep => parseInt(rep) || 0),
      weight: data.weight.map(w => parseFloat(w) || 0),
      perceivedDifficulty: data.perceivedDifficulty.map(diff => parseInt(diff) || 5)
    };
  };

  const handleSubmit = async () => {
    if (!workoutName) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    if (exercises.some(ex => !ex.exerciseName)) {
      Alert.alert('Error', 'Please name all exercises');
      return;
    }

    try {
      // Get auth headers and token
      const headers = await secureStorage.getAuthHeader();
      const authToken = await secureStorage.getItem(AUTH_TOKEN_KEY);
      
      if (!headers || !authToken) {
        Alert.alert('Error', 'You must be logged in to submit a workout.');
        return;
      }
      
      // Prepare the workout data
      const workoutData = {
        name: workoutName,
        workoutType: workoutType.toLowerCase(),
        notes: notes,
        averageHeartRate: heartRate ? Number(heartRate) : 0,
        exercises: exercises.map((ex, index) => parseNumericValues({
          exerciseID: ex.databaseExerciseId || null,
          superset: ex.superset === '-1' ? -1 : parseInt(ex.superset) || -1,
          order_exercise: index + 1,
          reps: ex.reps.map(rep => parseInt(rep) || 0),
          setType: ex.setType.map(type => type.toLowerCase()),
          weight: ex.weight.map(w => parseFloat(w) || 0),
          percievedDifficulty: ex.perceivedDifficulty.map(diff => parseInt(diff) || 5),
          notes: ex.exerciseNotes
        }))
      };
      
      // Sign the workout data using the auth token as the secret
      const workoutJWT = encode(workoutData, authToken);
      
      // Prepare the payload with the JWT
      const payload = {
        token: workoutJWT
      };
      
      // Send the JWT payload to the server with auth headers
      const response = await fetch('http://localhost:8080/api/workout/create_workout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }
      
      const result = await response.json();
    
      Alert.alert('Success', 'Workout data submitted successfully!');
      
      // Optional: Reset the form after successful submission
      resetForm();
      
    } catch (error) {
      console.error('Error submitting workout:', error);
      Alert.alert('Error', `Failed to submit workout: ${error.message}`);
    }
  };

  // Reset the form
  const resetForm = () => {
    setWorkoutName('');
    setWorkoutType('Strength');
    setNotes('');
    setHeartRate('');
    setExercises([{
      exerciseID: Date.now().toString(),
      exerciseOrder: 1,
      superset: '-1',
      exerciseName: '',
      reps: ['0'],
      setType: ['Normal'],
      weight: ['0'],
      perceivedDifficulty: ['5'],
      exerciseNotes: ''
    }]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Log Your Workout</Text>

      {/* User and Workout Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Info</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Workout Name"
          value={workoutName}
          onChangeText={setWorkoutName}
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Workout Type</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={workoutType}
              onValueChange={setWorkoutType}
              style={styles.picker}
            >
              <Picker.Item label="Strength" value="Strength" />
              <Picker.Item label="Cardio" value="Cardio" />
              <Picker.Item label="Flexibility" value="Flexibility" />
              <Picker.Item label="HIIT" value="HIIT" />
            </Picker>
          </View>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Average Heart Rate"
          keyboardType="numeric"
          value={heartRate}
          onChangeText={setHeartRate}
        />
        
        <TextInput
          style={styles.textArea}
          placeholder="Workout Notes"
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/* Exercises */}
      {exercises.map((exercise, exerciseIndex) => (
        <View key={exercise.exerciseID} style={styles.exerciseContainer}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.sectionTitle}>Exercise {exercise.exerciseOrder}</Text>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeExercise(exerciseIndex)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>

          {/* Replace the exercise name input with a button */}
          <View style={styles.exerciseNameContainer}>
            <TouchableOpacity
              style={styles.selectExerciseFullButton}
              onPress={() => openExerciseModal(exerciseIndex)}
            >
              <Text style={styles.selectExerciseButtonLabel}>Exercise:</Text>
              <Text 
                style={[
                  styles.selectedExerciseName, 
                  { fontWeight: exercise.exerciseName ? '500' : '400' }
                ]}
              >
                {exercise.exerciseName || "Select an exercise"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Replace the superset input with a dropdown picker */}
          <View style={styles.row}>
            <View style={styles.fullInput}>
              <Text style={styles.label}>Superset With</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={exercise.superset}
                  onValueChange={(value) => {
                    // Update this exercise's superset
                    updateExerciseField(exerciseIndex, 'superset', value);
                    
                    // If a superset is selected (not -1), also update the other exercise
                    if (value !== '-1') {
                      const otherExerciseIndex = exercises.findIndex(ex => ex.exerciseID.toString() === value);
                      if (otherExerciseIndex !== -1) {
                        const updatedExercises = [...exercises];
                        updatedExercises[otherExerciseIndex].superset = exercise.exerciseID.toString();
                        setExercises(updatedExercises);
                      }
                    }
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="No Superset" value="-1" />
                  {exercises
                    .filter((ex, idx) => idx !== exerciseIndex)
                    .map((ex, idx) => (
                      <Picker.Item 
                        key={ex.exerciseID}
                        label={ex.exerciseName || `Unnamed Exercise ${ex.exerciseOrder}`}
                        value={ex.exerciseID.toString()}
                      />
                    ))}
                </Picker>
              </View>
            </View>
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Exercise Notes"
            multiline
            numberOfLines={2}
            value={exercise.exerciseNotes}
            onChangeText={(value) => updateExerciseField(exerciseIndex, 'exerciseNotes', value)}
          />

          {/* Sets */}
          {exercise.reps.map((_, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Reps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Reps"
                  keyboardType="numeric"
                  value={exercise.reps[setIndex]}
                  onChangeText={(value) => updateSetField(exerciseIndex, 'reps', setIndex, value)}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Weight"
                  keyboardType="numeric"
                  value={exercise.weight[setIndex]}
                  onChangeText={(value) => updateSetField(exerciseIndex, 'weight', setIndex, value)}
                />
              </View>

              <View style={styles.fullInput}>
                <Text style={styles.label}>Perceived Difficulty (1-5)</Text>
                <Picker
                  selectedValue={exercise.perceivedDifficulty[setIndex]}
                  onValueChange={(value) => updateSetField(exerciseIndex, 'perceivedDifficulty', setIndex, value)}
                  style={styles.picker}
                >
                  {difficultyOptions.map((difficulty) => (
                    <Picker.Item key={difficulty} label={`${difficulty}`} value={`${difficulty}`} />
                  ))}
                </Picker>
              </View>

              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeSet(exerciseIndex, setIndex)}
              >
                <Text style={styles.removeButtonText}>Remove Set</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addSet(exerciseIndex)}
          >
            <Text style={styles.addButtonText}>Add Set</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity 
        style={styles.addButton}
        onPress={addExercise}
      >
        <Text style={styles.addButtonText}>Add Exercise</Text>
      </TouchableOpacity>

      {/* Submit and Reset Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetForm}
        >
          <Text style={styles.resetButtonText}>Reset Form</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Submit Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Selection Modal */}
      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select an Exercise</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setExerciseModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <ChooseExercise onExerciseSelect={handleExerciseSelect} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f9',
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
    color: '#2c3e50',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '500',
    color: '#34495e',
  },
  input: {
    height: 45,
    borderColor: '#ced6e0',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 12,
    borderRadius: 10,
    backgroundColor: '#ecf0f1',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderColor: '#ced6e0',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 12,
    paddingTop: 12,
    borderRadius: 10,
    textAlignVertical: 'top',
    backgroundColor: '#ecf0f1',
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerWrapper: {
    borderColor: '#ced6e0',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#ecf0f1',
    height: 45,
    justifyContent: 'center',
  },
  setTypePickerWrapper: {
    borderColor: '#ced6e0',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#ecf0f1',
    height: 45,
    justifyContent: 'center',
  },
  picker: {
    height: 45,
    backgroundColor: '#ecf0f1',
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  halfInput: {
    width: '48%',
  },
  quarterInput: {
    width: '23%',
  },
  fullInput: {
    width: '100%',
  },
  exerciseContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  setContainer: {
    marginVertical: 5,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#bdc3c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  setTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2c3e50',
  },
  removeSetButton: {
    backgroundColor: '#e74c3c',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#1abc9c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  addExerciseButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitContainer: {
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#95a5a6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectExerciseFullButton: {
    backgroundColor: '#ecf0f1',
    borderColor: '#ced6e0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  selectExerciseButtonLabel: {
    fontWeight: '500',
    color: '#7f8c8d',
    marginRight: 8,
  },
  selectedExerciseName: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f4f4f9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#3498db',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  setRow: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
});
