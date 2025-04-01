// components/StreakGraph.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export default function StreakGraph({ userId = 1 }) {
  const [data, setData] = useState([0, 0, 0, 0, 0, 0, 0]); // default to 7 days
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/streak-graph?user_id=${userId}`)
      .then(res => res.json())
      .then(json => {
        setData(json.streaks); // Expect array of 7 values
      })
      .catch(err => console.error("Failed to load graph data", err))
      .finally(() => setLoading(false));
  }, []);

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{ data }],
  };

  return (
    <View>
      <Text style={{ textAlign: 'center', fontSize: 18, marginBottom: 10 }}>
        🔥 Weekly Workout Streak
      </Text>
      <BarChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        fromZero
        showValuesOnTopOfBars
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: "#f4511e",
          backgroundGradientFrom: "#f4511e",
          backgroundGradientTo: "#ff9068",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: () => "#fff",
          style: {
            borderRadius: 12,
          },
        }}
        style={{
          borderRadius: 16,
          alignSelf: "center",
        }}
      />
    </View>
  );
}
