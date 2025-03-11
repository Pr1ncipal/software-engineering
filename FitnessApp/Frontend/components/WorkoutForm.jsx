import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'http://localhost:8080'; // Replace with your actual API URL

export default function WorkoutForm() {
  const [exercises, setExercises] = useState([{ lift: '', sets: '', reps: '', percivedDiff: '5', setType: 'normal', superset: null }]);
  const [workouts, setWorkouts] = useState([]);
  const [showSupersetPicker, setShowSupersetPicker] = useState(null);

  // Fetch all workouts when the component mounts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/workout/get_exercises`);
        const data = await response.json();
        setWorkouts(data);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        Alert.alert('Error', 'Something went wrong while fetching workouts');
      }
    };

    fetchWorkouts();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (exercises.some(exercise => !exercise.lift || !exercise.sets || !exercise.reps)) {
      // Show an error if any fields are empty
      Alert.alert('Error', 'Please fill out all fields for each exercise');
      return;
    }

    try {
      // Send the data to the backend
      const response = await fetch(`${API_URL}/api/workout/add_workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exercises),
      });

      if (response.ok) {
        // Show a success message
        Alert.alert('Success', 'Workout data submitted successfully!');

        // Clear the form
        setExercises([{ lift: '', sets: '', reps: '', percivedDiff: '5', setType: 'normal', superset: null }]);

        // Fetch the updated list of workouts
        fetchWorkouts();
      } else {
        Alert.alert('Error', 'Failed to submit workout data');
      }
    } catch (error) {
      console.error('Error submitting workout data:', error);
      Alert.alert('Error', 'Something went wrong while submitting the data');
    }
  };

  const handleInputChange = (index, field, value) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const addExercise = () => {
    setExercises([...exercises, { lift: '', sets: '', reps: '', percivedDiff: '5', setType: 'normal', superset: null }]);
  };

  const startConnectSuperset = (index) => {
    setShowSupersetPicker(index);
  };

  const connectSuperset = (sourceIndex, targetIndex) => {
    if (sourceIndex === targetIndex) {
      setShowSupersetPicker(null);
      return;
    }

    // Create a copy of exercises
    let newExercises = [...exercises];
    
    // Connect the exercises
    newExercises[sourceIndex].superset = targetIndex;
    newExercises[targetIndex].superset = sourceIndex;
    
    // Reorder exercises to group supersets together
    // If the target is below the source, move it right after the source
    if (targetIndex > sourceIndex) {
      const targetExercise = newExercises[targetIndex];
      newExercises.splice(targetIndex, 1); // Remove target from its position
      newExercises.splice(sourceIndex + 1, 0, targetExercise); // Insert after source
      
      // Update superset references after reordering
      for (let i = 0; i < newExercises.length; i++) {
        if (newExercises[i].superset !== null) {
          // Find the new index of the superset partner
          for (let j = 0; j < newExercises.length; j++) {
            if (i !== j && 
                ((sourceIndex === newExercises[i].superset && targetIndex === j) || 
                 (targetIndex === newExercises[i].superset && sourceIndex === j))) {
              newExercises[i].superset = j;
              break;
            }
          }
        }
      }
    }
    
    setExercises(newExercises);
    setShowSupersetPicker(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Your Workout</Text>

      {exercises.map((exercise, index) => (
        <View key={index} style={[
          styles.exerciseContainer, 
          exercise.superset !== null ? styles.supersetContainer : null
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Lift (e.g., Bench Press)"
            value={exercise.lift}
            onChangeText={(value) => handleInputChange(index, 'lift', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Sets"
            keyboardType="numeric"
            value={exercise.sets}
            onChangeText={(value) => handleInputChange(index, 'sets', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Reps"
            keyboardType="numeric"
            value={exercise.reps}
            onChangeText={(value) => handleInputChange(index, 'reps', value)}
          />

          <Text>Perceived Difficulty:</Text>
          <Picker
            selectedValue={exercise.percivedDiff}
            style={styles.picker}
            onValueChange={(value) => handleInputChange(index, 'percivedDiff', value)}
          >
            <Picker.Item label="5 (Easy)" value="5" />
            <Picker.Item label="6" value="6" />
            <Picker.Item label="7" value="7" />
            <Picker.Item label="8" value="8" />
            <Picker.Item label="9" value="9" />
            <Picker.Item label="10 (Hard)" value="10" />
          </Picker>

          <Text>Set Type:</Text>
          <Picker
            selectedValue={exercise.setType}
            style={styles.picker}
            onValueChange={(value) => handleInputChange(index, 'setType', value)}
          >
            <Picker.Item label="Warmup" value="warmup" />
            <Picker.Item label="Normal" value="normal" />
            <Picker.Item label="Failure" value="failure" />
            <Picker.Item label="Drop" value="drop" />
          </Picker>

          {exercise.superset !== null ? (
            <View style={styles.supersetInfo}>
              <Text style={styles.supersetText}>
                Superset with: {exercises[exercise.superset]?.lift || `Exercise ${exercise.superset + 1}`}
              </Text>
            </View>
          ) : (
            showSupersetPicker === index ? (
              <View>
                <Text>Select exercise to superset with:</Text>
                <Picker
                  selectedValue={null}
                  style={styles.picker}
                  onValueChange={(targetIndex) => connectSuperset(index, parseInt(targetIndex))}
                >
                  <Picker.Item label="Select an exercise" value={null} />
                  {exercises.map((ex, idx) => (
                    idx !== index && ex.superset === null ? 
                    <Picker.Item 
                      key={idx} 
                      label={ex.lift || `Exercise ${idx + 1}`} 
                      value={idx.toString()} 
                    /> : null
                  ))}
                </Picker>
                <Button title="Cancel" onPress={() => setShowSupersetPicker(null)} />
              </View>
            ) : (
              <Button title="Connect Superset" onPress={() => startConnectSuperset(index)} />
            )
          )}
        </View>
      ))}

      <Button title="Add Exercise" onPress={addExercise} />
      <Button title="Submit Workout" onPress={handleSubmit} />

      <Text style={styles.title}>Previous Workouts</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.workoutItem}>
            <Text>{item.lift}</Text>
            <Text>Sets: {item.sets}</Text>
            <Text>Reps: {item.reps}</Text>
          </View>
        )}
      />
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
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  exerciseContainer: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  supersetContainer: {
    borderColor: '#3498db',
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  supersetInfo: {
    backgroundColor: '#e0f0ff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  supersetText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  workoutItem: {
    padding: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
  },
});
