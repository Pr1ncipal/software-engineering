import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { secureStorage, AUTH_TOKEN_KEY } from '../utils/secureStorage';
import ChooseExercise from './chooseExercise';
import encode from 'jwt-encode';
import * as NetworkUtils from '../utils/networkUtils'; 
import { Base64 } from 'js-base64';
import { Snackbar, Alert as MuiAlert, IconButton } from '@mui/material'; // Added IconButton import
import CloseIcon from '@mui/icons-material/Close'; // Added CloseIcon import
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';


// Alert component for web
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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

  // Add states for web alerts
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [alertAction, setAlertAction] = useState(null);
  
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

  // Function to show web-based alerts
  const showAlert = useCallback((title, message, severity = 'info', action = null) => {
    setAlertMessage(`${title}: ${message}`);
    setAlertSeverity(severity);
    setAlertAction(action);
    setAlertOpen(true);
  }, []);

  // Handle alert close
  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertOpen(false);
    // Execute action if one was provided (like resetForm)
    if (alertAction) {
      alertAction();
      setAlertAction(null);
    }
  };

  // Load auth token on component mount
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        // Check for network connection first
        const isConnected = await NetworkUtils.isNetworkAvailable();
        if (!isConnected) {
          showAlert('No Connection', 'You are offline. Please connect to the internet and try again.', 'error');
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
            showAlert('Session Expired', 'Your session has expired. Please log in again.', 'warning');
            secureStorage.removeItem(AUTH_TOKEN_KEY);
            setIsAuthenticated(false);
          }
        } else {
          showAlert('Authentication Required', 'Please log in to continue.', 'warning');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error retrieving or validating auth token:', err);
        showAlert('Authentication Error', 'Failed to authenticate. Please try logging in again.', 'error');
        setIsAuthenticated(false);
      }
    };
    
    getAuthToken();
  }, [showAlert]);

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
        showAlert('Cannot Remove', 'Each exercise must have at least one set', 'warning');
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
  }, [showAlert]);

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

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 1: return '#4299e1'; // Blue - Easy
      case 2: return '#68d391'; // Green - Moderate
      case 3: return '#f6e05e'; // Yellow - Challenging
      case 4: return '#f6ad55'; // Orange - Hard
      case 5: return '#fc8181'; // Red - Maximum effort
      default: return '#4299e1';
    }
  };

  const handleSubmitWorkout = async () => {
    if (!isAuthenticated) {
      showAlert('Authentication Required', 'Please log in to submit a workout.', 'warning');
      return;
    }
    
    if (isSubmitting) {
      return; // Prevent multiple submissions
    }
    
    // Validate form
    if (!workoutName.trim()) {
      showAlert('Missing Information', 'Please enter a workout name.', 'warning');
      return;
    }
    
    // Validate exercises
    const validExercises = exercises.filter(ex => ex.exerciseName.trim());
    if (validExercises.length === 0) {
      showAlert('Missing Exercises', 'Please add at least one exercise to your workout.', 'warning');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Check for network connectivity
      const isConnected = await NetworkUtils.isNetworkAvailable();
      if (!isConnected) {
        showAlert('No Connection', 'You are offline. Please connect to the internet to submit your workout.', 'error');
        setIsSubmitting(false);
        return;
      }
      
      // Format exercises to match the expected API format in workoutExample.json
      const formattedExercises = exercises
        .filter(ex => ex.exerciseName.trim())
        .map((ex, index) => {
          const parsedEx = parseNumericValues(ex);
          return {
            exerciseID: parsedEx.databaseExerciseId || parseInt(parsedEx.exerciseID),
            superset: parsedEx.superset,
            order_exercise: index + 1,
            reps: parsedEx.reps,
            setType: parsedEx.setType.map(type => type.toLowerCase()),
            weight: parsedEx.weight,
            percievedDifficulty: parsedEx.perceivedDifficulty, // Note: Using the misspelled version to match the example
            notes: parsedEx.exerciseNotes
          };
        });
      
      // Construct the workout payload to match workoutExample.json format
      const workoutData = {
        name: workoutName.trim(),
        workoutType: workoutType.toLowerCase(),
        notes: notes.trim(),
        averageHeartRate: heartRate ? parseInt(heartRate) : null,
        exercises: formattedExercises
      };
      
      console.log('Submitting workout:', JSON.stringify(workoutData, null, 2));
      
      // Get authentication headers
      const headers = {
        'Content-Type': 'application/json'
      };

      // Properly encode the token in base64 as required by the API
      try {
        const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
        
        if (!token) {
          console.error('Authorization token is missing');
          showAlert('Authentication Error', 'No authentication token found. Please log in again.', 'error', () => setIsAuthenticated(false));
          setIsSubmitting(false);
          return;
        }
        
        // Update the state in case it changed
        setAuthToken(token);
        
        // Encode and add to headers
        const base64Token = Base64.encode(token);
        headers['Authorization'] = `ApiKey ${base64Token}`;
        
        console.log('Token successfully encoded and added to headers');
      } catch (err) {
        console.error('Error retrieving or processing auth token:', err);
        showAlert('Authentication Error', 'Failed to process authentication token. Please try logging in again.', 'error');
        setIsSubmitting(false);
        return;
      }

      // Submit the workout with proper headers
      const secret = await secureStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch('http://localhost:8080/api/workout/add_workout', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({"token": encode(workoutData, secret)})
      });
      
      // Log response details for debugging
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Server returned ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Workout submitted successfully:', result);
      
      // Show success message
      showAlert('Workout Logged!', 'Your workout has been successfully recorded.', 'success', resetForm);
      
    } catch (error) {
      console.error('Error submitting workout:', error);
      showAlert('Submission Error', `Failed to submit workout: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [fontsLoaded] = useFonts({
    'RalewayRegular': require('../assets/fonts/Raleway-Regular.ttf'),
  });
  
  if (!fontsLoaded) {
    return null; // Or show a <Text>Loading...</Text> or <ActivityIndicator />
  }
  
  return (
    <LinearGradient
      colors={['#52a447', '#007AFF', '#B3E5FC']} // black to gold
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
  
      <View style={styles.titleContainer}>
                <Text style={styles.title}>Log Your Workout</Text>
                <View style={styles.titleUnderline} />
            </View>

      {/* Workout Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Workout Details</Text>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Workout Name"
          value={workoutName}
          onChangeText={setWorkoutName}
        />
        
        <View style={styles.inputGroup}>
          <View style={styles.halfInput}>
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
          
          <View style={styles.halfInput}>
            <Text style={styles.label}>Heart Rate (bpm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Average Heart Rate"
              keyboardType="numeric"
              value={heartRate}
              onChangeText={setHeartRate}
            />
          </View>
        </View>
        
        <TextInput
          style={styles.textArea}
          placeholder="Workout Notes"
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/* Replace the existing Snackbar with this fixed position alert */}
      <div 
        style={{
          display: alertOpen ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <Alert 
          onClose={handleAlertClose} 
          severity={alertSeverity}
          variant="filled"
          elevation={24}
          sx={{ 
            width: { xs: '90%', sm: '70%', md: '50%' },
            padding: 2,
            fontSize: '1rem',
            maxWidth: '500px',
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleAlertClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {alertMessage}
        </Alert>
      </div>

      {/* Exercises Section Header - Without the Add button */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exercises</Text>
      </View>

      {/* Exercises Cards */}
      {exercises.map((exercise, exerciseIndex) => (
        <View key={exercise.exerciseID} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Exercise {exercise.exerciseOrder}</Text>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => removeExercise(exerciseIndex)}
            >
              <Text style={styles.iconButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Exercise selector button */}
          <TouchableOpacity
            style={styles.selectExerciseButton}
            onPress={() => openExerciseModal(exerciseIndex)}
          >
            <Text style={styles.selectExerciseButtonLabel}>
              {exercise.exerciseName || "Select an exercise"}
            </Text>
          </TouchableOpacity>

          {/* Superset selector */}
          <View style={styles.inputGroup}>
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
          
          {/* Sets Section Header - Without Add Button */}
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionTitle}>Sets</Text>
          </View>

          {/* Sets */}
          {exercise.reps.map((_, setIndex) => (
            <View key={setIndex} style={styles.setContainer}>
              <View style={styles.setHeader}>
                <Text style={styles.setTitle}>Set {setIndex + 1}</Text>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => removeSet(exerciseIndex, setIndex)}
                >
                  <Text style={styles.iconButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.setInputsRow}>
                {/* Set Type - Left */}
                <View style={[styles.setInput, styles.setInputWide]}>
                  <Text style={styles.setLabel}>Type</Text>
                  <View style={styles.setPickerWrapper}>
                    <Picker
                      selectedValue={exercise.setType[setIndex]}
                      onValueChange={(value) => updateSetField(exerciseIndex, 'setType', setIndex, value)}
                      style={styles.setPicker}
                    >
                      {setTypes.map((type) => (
                        <Picker.Item key={type} label={type} value={type} />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                {/* Reps - Middle */}
                <View style={styles.setInput}>
                  <Text style={styles.setLabel}>Reps</Text>
                  <TextInput
                    style={styles.setInputField}
                    placeholder="0"
                    keyboardType="numeric"
                    value={exercise.reps[setIndex]}
                    onChangeText={(value) => updateSetField(exerciseIndex, 'reps', setIndex, value)}
                  />
                </View>

                {/* Weight - Right */}
                <View style={styles.setInput}>
                  <Text style={styles.setLabel}>Weight</Text>
                  <TextInput
                    style={styles.setInputField}
                    placeholder="0"
                    keyboardType="numeric"
                    value={exercise.weight[setIndex]}
                    onChangeText={(value) => updateSetField(exerciseIndex, 'weight', setIndex, value)}
                  />
                </View>
              </View>

              {/* Difficulty Selector */}
              <View style={styles.difficultyContainer}>
                <Text style={styles.setLabel}>Difficulty</Text>
                <View style={styles.difficultySliderContainer}>
                  <Text style={styles.difficultyValue}>
                    {exercise.perceivedDifficulty[setIndex]}
                  </Text>
                  <View style={styles.difficultySliderWrapper}>
                    <View 
                      style={[
                        styles.difficultySliderTrack,
                        {
                          backgroundColor: getDifficultyColor(parseInt(exercise.perceivedDifficulty[setIndex]))
                        }
                      ]}
                    />
                    <View style={styles.difficultyButtonsContainer}>
                      {difficultyOptions.map((difficulty) => {
                        const isActive = parseInt(exercise.perceivedDifficulty[setIndex]) >= difficulty;
                        return (
                          <TouchableOpacity
                            key={difficulty}
                            style={[
                              styles.difficultyButton,
                              isActive && styles.difficultyButtonActive,
                              { borderColor: isActive ? getDifficultyColor(difficulty) : '#e2e8f0' }
                            ]}
                            onPress={() => updateSetField(exerciseIndex, 'perceivedDifficulty', setIndex, difficulty.toString())}
                          >
                            <Text 
                              style={[
                                styles.difficultyButtonText,
                                isActive && { color: getDifficultyColor(difficulty) }
                              ]}
                            >
                              {difficulty}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* New Add Set button positioned after sets */}
          <TouchableOpacity 
            style={styles.addSetButton}
            onPress={() => addSet(exerciseIndex)}
          >
            <Text style={styles.addSetButtonText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* New Add Exercise button positioned after exercises */}
      <TouchableOpacity 
        style={styles.addExerciseButton}
        onPress={addExercise}
      >
        <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetForm}
          disabled={isSubmitting}
        >
          <Text style={styles.resetButtonText}>Clear Form</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmitWorkout}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Log Workout'}
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
            <Text style={styles.modalTitle}>Select Exercise</Text>
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
  </LinearGradient>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 60,
    fontFamily: 'RalewayRegular',
    color: '#ffffff', // or #007AFF if you want to keep it blue
    textAlign: 'center',
  },
titleContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  
titleUnderline: {
    marginTop: 5,
    width: 120,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  // Inputs
  input: {
    height: 48,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#2d3748',
  },
  textArea: {
    minHeight: 80,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderRadius: 8,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#2d3748',
  },
  inputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  halfInput: {
    width: '48%',
  },
  fullInput: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 14,
    color: '#4a5568',
  },
  pickerWrapper: {
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    height: 48,
    justifyContent: 'center',
    marginBottom: 16,
  },
  picker: {
    height: 48,
  },
  // Sets
  setContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4a5568',
  },
  setInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  setInput: {
    width: '28%',
  },
  setInputWide: {
    width: '40%',
  },
  setLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  setInputField: {
    height: 40,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  setPickerWrapper: {
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: '#fff',
    height: 40,
  },
  setPicker: {
    height: 40,
  },
  
  // New difficulty styles
  difficultyContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  difficultySliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  difficultyValue: {
    fontSize: 18,
    fontWeight: '700',
    width: 30,
    textAlign: 'center',
    color: '#2d3748',
  },
  difficultySliderWrapper: {
    flex: 1,
    marginLeft: 12,
    height: 36,
    position: 'relative',
  },
  difficultySliderTrack: {
    position: 'absolute',
    height: 4,
    left: 0,
    right: 0,
    top: 16,
    borderRadius: 2,
    backgroundColor: '#4299e1',
  },
  difficultyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    left: 0,
    right: 0,
    height: '100%',
  },
  difficultyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Increased from 1 to 2
    borderColor: '#e2e8f0',
  },
  difficultyButtonActive: {
    borderColor: '#3182ce',
    backgroundColor: '#ebf8ff',
    borderWidth: 2.5, // Make active buttons have even thicker borders
  },
  difficultyButtonText: {
    fontSize: 15, // Slightly larger text
    fontWeight: '700', // More bold
    color: '#4a5568',
  },
  
  // Exercise selection button
  selectExerciseButton: {
    backgroundColor: '#ebf8ff',
    borderColor: '#bee3f8',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectExerciseButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3182ce',
  },
  // Buttons
  addButtonSmall: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonTiny: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f56565',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#48bb78',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#cbd5e0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  resetButtonText: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#9ae6b4',
    opacity: 0.7,
  },
  addExerciseButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addExerciseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  addSetButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addSetButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4299e1',
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
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
});