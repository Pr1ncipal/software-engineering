// components/MotivationScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import StreakGraph from './StreakGraph';


export default function MotivationScreen({ userId = 1 }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMotivation = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/motivation?user_id=${userId}`);
        const data = await res.json();
        setMessage(data.message || "You're doing great! 💪");
      } catch (err) {
        console.error("❌ Motivation fetch failed:", err);
        setMessage("Couldn't load motivation message.");
      } finally {
        setLoading(false);
      }
    };

    fetchMotivation();
  }, []);

  return (
    <View style={styles.container}>
      <StreakGraph userId={1} />
      <Text style={styles.title}>🔥 Daily Motivation</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#f4511e" />
      ) : (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff3eb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f4511e',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
});
