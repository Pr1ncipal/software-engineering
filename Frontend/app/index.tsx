import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WorkoutForm from '@/components/WorkoutForm';  // Import WorkoutForm

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <WorkoutForm />  {/* Render WorkoutForm */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
