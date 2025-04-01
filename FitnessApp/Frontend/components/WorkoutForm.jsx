import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, Text, Alert, ScrollView, TouchableOpacity, Modal, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { secureStorage, AUTH_TOKEN_KEY } from '../utils/secureStorage';
import ChooseExercise from './chooseExercise';
import encode from 'jwt-encode';
import * as NetworkUtils from '../utils/networkUtils'; // Add a new utility file for network operations

export default function WorkoutForm() {
  // Workout metadata state
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState('Strength');
  const [notes, setNotes] = useState('');
  const [heartRate, setHeartRate] = useState('');
  
  // Modal state for exercise picker
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
  
  // Auth state
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initial exercise template
  const createEmptyExercise = useCallback(() => ({
    exerciseID: Date.now().toString(),
    exerciseOrder: 1,
    superset: '-1',
    exerciseName: '',
    reps: ['0'],
    setType: ['Normal'],
    weight: ['0'],
    perceivedDifficulty: ['5'],
    exerciseNotes: ''
  }), []);
  
  // Exercises array
  const [exercises, setExercises] = useState(() => [createEmptyExercise()]);

  // Constants for dropdowns
  const setTypes = ['Warmup', 'Normal', 'Drop', 'Failure'];
  const difficultyOptions = [1, 2, 3, 4, 5];

  // Load auth token on component mount
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        // Check for network connection first
        const isConnected = await NetworkUtils.isNetworkAvailable();
        if (!isConnected) {
          Alert.alert('No Connection', 'You are offline. Please connect to the internet and try again.');
          setIsAuthenticated(false);
          return;
        }
        
        const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          // Validate token with a quick API call
          const isValid = await NetworkUtils.validateToken(token);
          
          if (isValid) {
            setAuthToken(token);
            setIsAuthenticated(true);
          } else {
            // Token exists but is invalid - user needs to log in again
            Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
            secureStorage.removeItem(AUTH_TOKEN_KEY);
            setIsAuthenticated(false);
          }
        } else {
          Alert.alert('Authentication Required', 'Please log in to continue.');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error retrieving or validating auth token:', err);
        Alert.alert('Authentication Error', 'Failed to authenticate. Please try logging in again.');
        setIsAuthenticated(false);
      }
    };
    
    getAuthToken();
  }, []);

  // Open exercise selection modal for a specific exercise
  const openExerciseModal = useCallback((exerciseIndex) => {
    setCurrentExerciseIndex(exerciseIndex);
    setExerciseModalVisible(true);
  }, []);

  // Handle exercise selection from the modal
  const handleExerciseSelect = useCallback((selectedExercise) => {
    if (currentExerciseIndex !== null) {
      setExercises(prevExercises => {
        const updatedExercises = [...prevExercises];
        updatedExercises[currentExerciseIndex] = {
          ...updatedExercises[currentExerciseIndex],
          exerciseName: selectedExercise.name,
          databaseExerciseId: selectedExercise.id || null
        };
        return updatedExercises;
      });
    }
    setExerciseModalVisible(false);
    setCurrentExerciseIndex(null);
  }, [currentExerciseIndex]);

  // Add a new exercise to the list
  const addExercise = useCallback(() => {
    setExercises(prevExercises => [
      ...prevExercises, 
      {
        ...createEmptyExercise(),
        exerciseID: Date.now().toString(),
        exerciseOrder: prevExercises.length + 1
      }
    ]);
  }, [createEmptyExercise]);

  // Add a new set to an exercise
  const addSet = useCallback((exerciseIndex) => {
    setExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = {...updatedExercises[exerciseIndex]};
      exercise.reps = [...exercise.reps, '0'];
      exercise.setType = [...exercise.setType, 'Normal'];
      exercise.weight = [...exercise.weight, '0'];
      exercise.perceivedDifficulty = [...exercise.perceivedDifficulty, '5'];
      updatedExercises[exerciseIndex] = exercise;
      return updatedExercises;
    });
  }, []);

  // Update exercise values
  const updateExerciseField = useCallback((exerciseIndex, field, value) => {
    setExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        [field]: value
      };
      return updatedExercises;
    });
  }, []);

  // Update set values
  const updateSetField = useCallback((exerciseIndex, field, setIndex, value) => {
    setExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const updatedSets = [...updatedExercises[exerciseIndex][field]];
      updatedSets[setIndex] = value;
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        [field]: updatedSets
      };
      return updatedExercises;
    });
  }, []);

  // Handle superset selection
  const handleSupersetChange = useCallback((exerciseIndex, value) => {
    setExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      
      // Update this exercise's superset
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        superset: value
      };
      
      // If a superset is selected (not -1), also update the other exercise
      if (value !== '-1') {
        const otherExerciseIndex = prevExercises.findIndex(ex => ex.exerciseID.toString() === value);
        if (otherExerciseIndex !== -1) {
          updatedExercises[otherExerciseIndex] = {
            ...updatedExercises[otherExerciseIndex],
            superset: updatedExercises[exerciseIndex].exerciseID.toString()
          };
        }
      }
      
      return updatedExercises;
    });
  }, []);

  // Remove an exercise
  const removeExercise = useCallback((exerciseIndex) => {
    setExercises(prevExercises => {
      const updatedExercises = prevExercises.filter((_, index) => index !== exerciseIndex);
      
      // Update order numbers
      return updatedExercises.map((ex, idx) => ({
        ...ex,
        exerciseOrder: idx + 1
      }));
    });
  }, []);

  // Remove a set
  const removeSet = useCallback((exerciseIndex, setIndex) => {
    setExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = updatedExercises[exerciseIndex];
      
      if (exercise.reps.length <= 1) {
        Alert.alert('Cannot Remove', 'Each exercise must have at least one set');
        return prevExercises;
      }
      
      const updatedReps = [...exercise.reps];
      const updatedSetTypes = [...exercise.setType];
      const updatedWeights = [...exercise.weight];
      const updatedDifficulties = [...exercise.perceivedDifficulty];
      
      updatedReps.splice(setIndex, 1);
      updatedSetTypes.splice(setIndex, 1);
      updatedWeights.splice(setIndex, 1);
      updatedDifficulties.splice(setIndex, 1);
      
      updatedExercises[exerciseIndex] = {
        ...exercise,
        reps: updatedReps,
        setType: updatedSetTypes,
        weight: updatedWeights,
        perceivedDifficulty: updatedDifficulties
      };
      
      return updatedExercises;
    });
  }, []);

  // Parse numeric values before submission
  const parseNumericValues = useCallback((data) => {
    return {
      ...data,
      superset: parseInt(data.superset) || -1,
      reps: data.reps.map(rep => parseInt(rep) || 0),
      weight: data.weight.map(w => parseFloat(w) || 0),
      perceivedDifficulty: data.perceivedDifficulty.map(diff => parseInt(diff) || 5)
    };
  }, []);

  // Reset the form
  const resetForm = useCallback(() => {
    console.log('Resetting form');
    setWorkoutName('');
    setWorkoutType('Strength');
    setNotes('');
    setHeartRate('');
    setExercises([createEmptyExercise()]);
  }, [createEmptyExercise]);

  // Close the exercise modal
  const handleCloseModal = useCallback(() => {
    setExerciseModalVisible(false);
    setCurrentExerciseIndex(null);
  }, []);

  // Update the Submit button to show loading state
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Log Your Workout</Text>

      {/* Workout Info */}
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

          {/* Exercise selector button */}
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

          {/* Superset selector */}
          <View style={styles.row}>
            <View style={styles.fullInput}>
              <Text style={styles.label}>Superset With</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={exercise.superset}
                  onValueChange={(value) => handleSupersetChange(exerciseIndex, value)}
                  style={styles.picker}
                >
                  <Picker.Item label="No Superset" value="-1" />
                  {exercises
                    .filter((ex, idx) => idx !== exerciseIndex)
                    .map((ex) => (
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

          {/* Exercise notes */}
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

              {/* Add Set Type Picker here */}
              <View style={styles.halfInput}>
                <Text style={styles.label}>Set Type</Text>
                <View style={styles.setTypePickerWrapper}>
                  <Picker
                    selectedValue={exercise.setType[setIndex]}
                    onValueChange={(value) => updateSetField(exerciseIndex, 'setType', setIndex, value)}
                    style={styles.picker}
                  >
                    {setTypes.map((type) => (
                      <Picker.Item key={type} label={type} value={type} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Weight (lbs)</Text>
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

          {/* Add Set button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addSet(exerciseIndex)}
          >
            <Text style={styles.addButtonText}>Add Set</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Exercise button */}
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
          disabled={isSubmitting}
        >
          <Text style={styles.resetButtonText}>Reset Form</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={async () => {
            console.log('Submit button clicked');
            
            // Basic validation
            if (!workoutName) {
              setNotes(prev => prev + "\nError: Please enter a workout name");
              console.log("Missing workout name");
              return;
            }

            if (exercises.some(ex => !ex.exerciseName)) {
              setNotes(prev => prev + "\nError: Please name all exercises");
              console.log("Missing exercise name(s)");
              return;
            }
            
            try {
              setIsSubmitting(true);
              setNotes(prev => prev + "\nSubmitting workout...");
              
              // Get auth token
              const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
              
              if (!token) {
                setNotes(prev => prev + "\nError: Not authenticated");
                console.log("No auth token found");
                setIsSubmitting(false);
                return;
              }
              
              // Prepare auth headers
              const headers = NetworkUtils.getAuthHeaders(token);
              
              // Format workout data
              const workoutData = {
                name: workoutName,
                workoutType: workoutType.toLowerCase(),
                notes: notes,
                averageHeartRate: heartRate ? Number(heartRate) : 0,
                exercises: exercises.map((ex, index) => ({
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

              // Add required fields for cardio workout type
              if (workoutType !== 'Strength') {
                workoutData.distance = 0; // Default values for required fields
                workoutData.duration = 0;
              }
              
              // Create JWT token
              const workoutJWT = encode(workoutData, token);
              
              // Prepare payload
              const payload = {
                token: workoutJWT
              };
              
              console.log("Sending to backend:", JSON.stringify(payload).substring(0, 100) + "...");
              setNotes(prev => prev + "\nSending data to server...");
              
              // Direct fetch without using complex utility
              const response = await fetch('http://localhost:8080/api/workout/add_workout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...headers
                },
                body: JSON.stringify(payload)
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`Server error ${response.status}: ${errorText}`);
                
                // Don't add server errors to the notes field
                // Instead, show an alert with the error details
                Alert.alert(
                  `Error (${response.status})`, 
                  `The server encountered an error. Please try again later.`,
                  [{ text: 'OK' }]
                );
                
                throw new Error(`Server error ${response.status}`);
              }
              
              const result = await response.json();
              console.log("Backend response:", result);
              
              // Only add success messages to notes
              setNotes(prev => prev + "\nSuccess! Workout submitted.");
              
              // Reset form after success
              setTimeout(() => {
                setWorkoutName('');
                setWorkoutType('Strength');
                setHeartRate('');
                setNotes(''); // Clear notes on successful submission
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
              }, 1500); // Small delay so user can see success message
              
            } catch (error) {
              console.error("Submission error:", error);
              
              // Don't modify notes for errors, show alert instead
              Alert.alert(
                "Submission Failed", 
                error.message.includes('Server error') 
                  ? "The server couldn't process your workout. Please try again later." 
                  : `Error: ${error.message}`,
                [{ text: 'OK' }]
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit to Backend'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Selection Modal */}
      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select an Exercise</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModal}
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
  disabledButton: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
});