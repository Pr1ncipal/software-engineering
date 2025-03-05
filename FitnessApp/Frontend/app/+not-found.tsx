import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WorkoutForm from '@/components/WorkoutForm';  // Import WorkoutForm
import { Link } from 'expo-router';

export default function AboutPage() {
  return (
    <SafeAreaView style={styles.container}>
        <Link href="/tabs" style={styles.button}>
            Go back home
        </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: "#ffffff"
    },
    text: {
      color: "black"
    },
    button: {
      fontSize: 20,
      textDecorationLine: "underline",
      color: "#000000"
    },
  });
