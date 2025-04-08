// components/Home.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

export default function Home() {
  const [fontsLoaded] = useFonts({
    'RalewayRegular': require('../assets/fonts/Raleway-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null; // or a loading screen
  }

  return (
    <LinearGradient
      colors={['#007AFF', '#E6F0FA']} // blue to soft white
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Widget 1: Welcome */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>👋 Welcome Back, Amir</Text>
          <Text style={styles.widgetText}>Ready to crush your goals today?</Text>
        </View>

        {/* Widget 2: Activity Summary */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>🏃‍♂️ This Week's Activity</Text>
          <Text style={styles.widgetText}>Workouts: 4</Text>
          <Text style={styles.widgetText}>Steps: 45,890</Text>
          <Text style={styles.widgetText}>Calories Burned: 2,300</Text>
        </View>

        {/* Widget 3: Daily Tip */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>💡 Daily Fitness Tip</Text>
          <Text style={styles.widgetText}>
            Consistency beats intensity. A short daily workout is better than a long one once a week!
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 60,
  },
  widget: {
    backgroundColor: '#ffffffee',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  widgetTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    fontFamily: 'RalewayRegular',
  },
  widgetText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    fontFamily: 'RalewayRegular',
  },
});
