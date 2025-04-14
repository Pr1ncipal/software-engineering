// File: WeightForecastChart.jsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserId } from "../utils/getUserId";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const WeightForecastChart = () => {
  const [chartData, setChartData] = useState(null);
  const [progressPrediction, setProgressPrediction] = useState("");

  useEffect(() => {
    fetchPrediction();
    fetchWeightChart();
  }, []);

  const getUsernameFromStorage = async () => {
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

  const fetchPrediction = async () => {
    try {
      const username = await getUsernameFromStorage();
      const userId = await getUserId(username);
      const res = await fetch(`http://localhost:5000/api/progress-prediction?user_id=${userId}`);
      const data = await res.json();
      setProgressPrediction(data.prediction ?? "");
    } catch (err) {
      console.error("Failed to fetch prediction:", err);
    }
  };

  const fetchWeightChart = async () => {
    try {
      const username = await getUsernameFromStorage();
      const userId = await getUserId(username);
      const res = await fetch(`http://localhost:5000/api/weight-chart?user_id=${userId}`);
      const data = await res.json();

      if (data.error || !data.datasets) {
        console.warn("Chart data not available:", data.error);
        return;
      }

      const processedData = {
        ...data,
        datasets: [
          data.datasets[0],
          data.datasets[1],
          {
            data: data.datasets[1].data.map(val => val !== null ? Math.max(val - 2, 0) : null),
            color: (opacity = 1) => `rgba(243, 156, 18, ${opacity * 0.2})`,
            strokeWidth: 0,
          },
          {
            data: data.datasets[1].data.map(val => val !== null ? val + 2 : null),
            color: (opacity = 1) => `rgba(243, 156, 18, ${opacity * 0.2})`,
            strokeWidth: 0,
          }
        ],
        legend: ["Actual", "Predicted", "Lower Bound", "Upper Bound"]
      };

      setChartData(processedData);
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
    }
  };

  const getPredictionStartIndex = () => {
    if (!chartData || !chartData.datasets || chartData.datasets.length < 2) return -1;
    const actualData = chartData.datasets[0].data;
    for (let i = 0; i < actualData.length; i++) {
      if (actualData[i] === null) return i;
    }
    return actualData.length;
  };

  const renderWeightChart = () => {
    if (!chartData) return null;
    const predictionStartIdx = getPredictionStartIndex();
    const hasPrediction = predictionStartIdx >= 0 && predictionStartIdx < chartData.labels.length;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.graphTitle}>📊 Weight Progress</Text>
        <LineChart
          data={{
            labels: chartData.labels,
            datasets: [
              {
                data: chartData.datasets[1].data,
                color: (opacity = 1) => `rgba(243, 156, 18, ${opacity})`,
                strokeWidth: 4,
              },
              {
                data: chartData.datasets[0].data,
                color: (opacity = 1) => `rgba(30, 82, 180, ${opacity})`,
                strokeWidth: 4,
              },
            ],
          }}
          width={screenWidth - 80}
          height={220}
          yAxisInterval={12}
          fromZero={false}
          withInnerLines={true}
          withOuterLines={true}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#f8f8f8",
            backgroundGradientTo: "#fff",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: "5",
              strokeWidth: "2",
              stroke: "#fff",
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
            },
            propsForLabels: {
              fontWeight: '600',
            },
            useShadowColorFromDataset: true,
          }}
          style={{ marginVertical: 10, borderRadius: 16, paddingRight: 60 }}
          segments={5}
          formatYLabel={(y) => `${y} lbs`}
          verticalLabelRotation={0}
          withShadow={true}
          withVerticalLines={true}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          min={chartData.yAxisRange?.[0]}
          max={chartData.yAxisRange?.[1]}
        />

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3259A5' }]} />
            <Text style={styles.legendText}>Actual Weight</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f39c12' }]} />
            <Text style={styles.legendText}>Predicted Weight</Text>
          </View>
        </View>

        {hasPrediction && (
          <View style={styles.predictionInfo}>
            <Text style={styles.progressTitle}>📈 Your Progress Forecast</Text>
            <Text style={styles.predictionInfoText}>{progressPrediction.message}</Text>
          </View>
        )}
      </View>
    );
  };

  return <ScrollView style={styles.container}>{renderWeightChart()}</ScrollView>;
};

export default WeightForecastChart;

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
    zIndex: 10,
  },
  streakText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#d35400",
  },
  motivationToast: {
    marginTop: 80,
    marginHorizontal: 20,
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
    zIndex: 5,
  },
  toastHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 6,
  },
  closeButton: {
    fontSize: 18,
    color: "#999",
    paddingHorizontal: 8,
  },
  toastTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#f39c12",
    marginBottom: 4,
  },
  toastText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 20,
  },
  progressBox: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "#eafaf1",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2ecc71",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  progressTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#f39c12",
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 20,
  },
  chartContainer: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 30,
  },
  graphTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#2980b9",
    marginBottom: 12,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#555",
  },
  predictionInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#f39c12",
  },
  predictionInfoText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
});
