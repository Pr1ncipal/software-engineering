import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserId } from "../utils/getUserId";

const MotivationScreen = () => {
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState("");
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    // Immediately fetch streak
    fetchStreak();

    // Delay motivation by 10s
    const timer = setTimeout(() => {
      fetchMotivation();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const getUsernameFromStorage = async (): Promise<string | null> => {
    try {
      const encoded = await AsyncStorage.getItem("savedUsername");
      if (!encoded) return null;
      const decoded = atob(encoded);
      const parsed = JSON.parse(decoded);
      return parsed.value;
    } catch (err) {
      console.error("Error reading savedUsername:", err);
      return null;
    }
  };

  const fetchStreak = async () => {
    try {
      const username = await getUsernameFromStorage();
      if (!username) return;

      const userId = await getUserId(username);
      if (!userId) return;

      const res = await fetch(`http://localhost:5000/api/streak-graph?user_id=${userId}`);
      const data = await res.json();

      setStreakCount(data.day_streak ?? 0);
    } catch (err) {
      console.error("Failed to fetch streak:", err);
    }
  };

  const fetchMotivation = async () => {
    try {
      const username = await getUsernameFromStorage();
      if (!username) return;

      const userId = await getUserId(username);
      if (!userId) return;

      const response = await fetch(`http://localhost:5000/api/motivation?user_id=${userId}`);
      const data = await response.json();

      setMotivationMessage(data.message);
      setShowMotivation(true);

    } catch (err) {
      console.error("Failed to fetch motivation:", err);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔥 Streak Counter */}
      <View style={styles.streakBox}>
        <Text style={styles.streakText}>🔥 {streakCount}-day streak</Text>
      </View>

      {/* 💬 Motivation Toast with Close Button */}
      {showMotivation && (
        <View style={styles.motivationToast}>
          <View style={styles.toastHeader}>
            <Text style={styles.toastTitle}>💪 Keep Going!</Text>
            <TouchableOpacity onPress={() => setShowMotivation(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.toastText}>{motivationMessage.replace(/^"(.*)"$/, "$1")}</Text>
        </View>
      )}
    </View>
  );
};

export default MotivationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  streakBox: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#ffeedb",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  streakText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#d35400",
  },
  motivationToast: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: "#fffbe6",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderLeftWidth: 5,
    borderLeftColor: "#f39c12",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  toastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  toastTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#f39c12",
  },
  closeButton: {
    fontSize: 18,
    color: "#999",
    paddingHorizontal: 8,
  },
  toastText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 20,
  },
});
