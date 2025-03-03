import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function WorkoutForm() {
  // User and workout metadata
  const [userName, setUserName] = useState('');
  const [workoutType, setWorkoutType] = useState('Strength');
  const [notes, setNotes] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  
  // Exercises array
  const [exercises, setExercises] = useState([{
    exerciseID: Date.now(), // Using timestamp as temporary ID
    exerciseOrder: 1,
    superset: -1, // -1 means not part of a superset
    exerciseName: '',
    reps: [0],
    setType: ['Normal'],
    weight: [0],
    perceivedDifficulty: [5],
    exerciseNotes: ''
  }]);

  // Set types for dropdown
  const setTypes = ['Warmup', 'Normal', 'Drop', 'Failure'];

  // Add a new exercise to the list
  const addExercise = () => {
    setExercises([...exercises, {
      exerciseID: Date.now(),
      exerciseOrder: exercises.length + 1,
      superset: -1,
      exerciseName: '',
      reps: [0],
      setType: ['Normal'],
      weight: [0],
      perceivedDifficulty: [5],
      exerciseNotes: ''
    }]);
  };

  // Add a new set to an exercise
  const addSet = (exerciseIndex) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].reps.push(0);
    updatedExercises[exerciseIndex].setType.push('Normal');
    updatedExercises[exerciseIndex].weight.push(0);
    updatedExercises[exerciseIndex].perceivedDifficulty.push(5);
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
    updatedExercises[exerciseIndex][field][setIndex] = field === 'setType' ? value : Number(value);
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!userName) {
      Alert.alert('Error', 'Please enter a user name');
      return;
    }

    if (exercises.some(ex => !ex.exerciseName)) {
      Alert.alert('Error', 'Please name all exercises');
      return;
    }

    // Prepare the workout data
    const workoutData = {
      user: userName,
      workoutType: workoutType,
      notes: notes,
      averageHeartRate: heartRate ? Number(heartRate) : 0,
      totalWeightLifted: totalWeight ? Number(totalWeight) : 0,
      exercises: exercises.map(ex => ({
        exerciseID: ex.exerciseID,
        exerciseOrder: ex.exerciseOrder,
        superset: ex.superset,
        exerciseName: ex.exerciseName,
        reps: ex.reps,
        setType: ex.setType,
        weight: ex.weight,
        perceivedDifficulty: ex.perceivedDifficulty,
        exerciseNotes: ex.exerciseNotes
      }))
    };

    try {
      // Log the JSON for now
      console.log('Workout data submitted:', JSON.stringify(workoutData, null, 2));

      // Show the JSON in an alert for debug purposes
      Alert.alert('JSON Data', JSON.stringify(workoutData, null, 2));
      
      // For now, show a success message
      Alert.alert('Success', 'Workout data submitted successfully!');

      // Reset form (optional)
      // resetForm();
    } catch (error) {
      console.error('Error submitting workout data:', error);
      Alert.alert('Error', 'Something went wrong while submitting the data');
    }
  };

  // Reset the form
  const resetForm = () => {
    setUserName('');
    setWorkoutType('Strength');
    setNotes('');
    setHeartRate('');
    setTotalWeight('');
    setExercises([{
      exerciseID: Date.now(),
      exerciseOrder: 1,
      superset: -1,
      exerciseName: '',
      reps: [0],
      setType: ['Normal'],
      weight: [0],
      perceivedDifficulty: [5],
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
          placeholder="User Name"
          value={userName}
          onChangeText={setUserName}
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
          style={styles.input}
          placeholder="Total Weight Lifted (kg)"
          keyboardType="numeric"
          value={totalWeight}
          onChangeText={setTotalWeight}
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

          <TextInput
            style={styles.input}
            placeholder="Exercise Name (e.g., Bench Press)"
            value={exercise.exerciseName}
            onChangeText={(value) => updateExerciseField(exerciseIndex, 'exerciseName', value)}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Superset Group (-1 for none)</Text>
              <TextInput
                style={styles.input}
                placeholder="Superset"
                keyboardType="numeric"
                value={exercise.superset.toString()}
                onChangeText={(value) => updateExerciseField(exerciseIndex, 'superset', Number(value))}
              />
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
            <View key={setIndex} style={styles.setContainer}>
              <View style={styles.setHeader}>
                <Text style={styles.setTitle}>Set {setIndex + 1}</Text>
                <TouchableOpacity 
                  style={styles.removeSetButton}
                  onPress={() => removeSet(exerciseIndex, setIndex)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={styles.quarterInput}>
                  <Text style={styles.label}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Reps"
                    keyboardType="numeric"
                    value={exercise.reps[setIndex].toString()}
                    onChangeText={(value) => updateSetField(exerciseIndex, 'reps', setIndex, value)}
                  />
                </View>

                <View style={styles.quarterInput}>
                  <Text style={styles.label}>Weight</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Weight"
                    keyboardType="numeric"
                    value={exercise.weight[setIndex].toString()}
                    onChangeText={(value) => updateSetField(exerciseIndex, 'weight', setIndex, value)}
                  />
                </View>

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
              </View>

              <View style={styles.row}>
                <View style={styles.fullInput}>
                  <Text style={styles.label}>Perceived Difficulty (1-10)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Difficulty (1-10)"
                    keyboardType="numeric"
                    value={exercise.perceivedDifficulty[setIndex].toString()}
                    onChangeText={(value) => {
                      const numValue = Number(value);
                      if (numValue >= 1 && numValue <= 10) {
                        updateSetField(exerciseIndex, 'perceivedDifficulty', setIndex, value);
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => addSet(exerciseIndex)}
          >
            <Text style={styles.addButtonText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity 
        style={styles.addExerciseButton}
        onPress={addExercise}
      >
        <Text style={styles.addButtonText}>+ Add Exercise</Text>
      </TouchableOpacity>

      <View style={styles.submitContainer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Submit Workout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    paddingTop: 10,
    borderRadius: 5,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  pickerContainer: {
    marginBottom: 10,
  },
  pickerWrapper: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: 'white',
    height: 40,
    justifyContent: 'center',
  },
  setTypePickerWrapper: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: 'white',
    height: 40,
    justifyContent: 'center',
  },
  picker: {
    height: 40,
    backgroundColor: 'white',
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  setContainer: {
    marginVertical: 5,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  setTitle: {
    fontWeight: 'bold',
  },
  removeSetButton: {
    backgroundColor: '#ff6b6b',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#4ecdc4',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addExerciseButton: {
    backgroundColor: '#1e90ff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitContainer: {
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});