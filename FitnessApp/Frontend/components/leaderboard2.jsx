
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Dimensions, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { secureStorage } from '@/utils/secureStorage';

const { width } = Dimensions.get('window');
const API_URL = 'http://127.0.0.1:8080/api/leaderboard/get_leaderboard';
const AUTH_TOKEN_KEY = 'authToken';
const WORKOUT_IDS = { bench: '273', squat: '716', deadlift: '523' };

const LeaderboardPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('steps');
  const [currentWorkout, setCurrentWorkout] = useState(WORKOUT_IDS.bench);
  const [selectedDays, setSelectedDays] = useState(7);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [healthData, setHealthData] = useState({ overall: 0, components: [] });
  const isMounted = useRef(true);

  useEffect(() => () => { isMounted.current = false; }, []);

  const getAuthHeaders = async () => {
    const storedApiKey = await secureStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedApiKey) throw new Error('Missing auth token');
    const encodedKey = Buffer.from(storedApiKey).toString('base64');
    return { 'Authorization': `ApiKey ${encodedKey}`, 'Content-Type': 'application/json' };
  };

  const fetchLeaderboard = async (category, workout = '') => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        category,
        days: selectedDays.toString(),
        scope: 'global',
        workout: category === '1rm' ? workout : '',
        number: '10',
      }).toString();
      const response = await fetch(`${API_URL}?${params}`, { method: 'GET', headers });
      const text = await response.text();

      if (!response.ok) {
        console.warn(`Leaderboard fetch error for ${category}:`, text);
        if (isMounted.current) {
          setData([]);
          setError('No leaderboard data available.');
        }
        return;
      }

      const { leaderboard } = JSON.parse(text);

      if (isMounted.current) {
        setData(leaderboard);
        generateChartData(leaderboard, category);
        setError(null);
      }
    } catch (error) {
      console.error(error);
      if (isMounted.current) {
        setData([]);
        setError('No leaderboard data available.');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const fetchLeaderboardData = async (category, workout = '') => {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      category,
      days: selectedDays.toString(),
      scope: 'global',
      workout: category === '1rm' ? workout : '',
      number: '100',
    }).toString();
    const res = await fetch(`${API_URL}?${params}`, { method: 'GET', headers });
    const text = await res.text();
    if (!res.ok) throw new Error('Failed leaderboard data');
    const { leaderboard } = JSON.parse(text);
    return leaderboard;
  };

  const fetchHealthScore = async () => {
    try {
      const username = await secureStorage.getItem('username');
      const [stepsData, benchData, squatData, deadliftData, workoutsData] = await Promise.allSettled([
        fetchLeaderboardData('steps'),
        fetchLeaderboardData('1rm', WORKOUT_IDS.bench),
        fetchLeaderboardData('1rm', WORKOUT_IDS.squat),
        fetchLeaderboardData('1rm', WORKOUT_IDS.deadlift),
        fetchLeaderboardData('workouts'),
      ]);

      const stepsScore = stepsData.status === 'fulfilled' ? calculateUserScore(stepsData.value, username, 15000) : 0;
      const benchScore = benchData.status === 'fulfilled' ? calculateUserScore(benchData.value, username, 225) : 0;
      const squatScore = squatData.status === 'fulfilled' ? calculateUserScore(squatData.value, username, 315) : 0;
      const deadliftScore = deadliftData.status === 'fulfilled' ? calculateUserScore(deadliftData.value, username, 425) : 0;
      const workoutsScore = workoutsData.status === 'fulfilled' ? calculateWorkoutScore(workoutsData.value, username) : 0;

      const strengthScore = Math.round((benchScore + squatScore + deadliftScore) / 3);
      const overallScore = Math.round((stepsScore * 0.35) + (strengthScore * 0.40) + (workoutsScore * 0.25));

      if (isMounted.current) {
        setHealthData({
          overall: overallScore,
          components: [
            { name: 'Steps', value: stepsScore, color: '#4169E1' },
            { name: 'Strength', value: strengthScore, color: '#5856D6' },
            { name: 'Workouts', value: workoutsScore, color: '#FF9500' },
          ],
        });
      }
    } catch (error) {
      console.error('Error calculating health score', error);
    }
  };

  const calculateUserScore = (leaderboard, username, goal) => {
    if (!leaderboard) return 0;
    const user = leaderboard.find(u => u.username === username);
    if (!user) return 0;
    return Math.min(100, Math.round((parseFloat(user.value) / goal) * 100));
  };

  const calculateWorkoutScore = (leaderboard, username) => {
    if (!leaderboard) return 0;
    const user = leaderboard.find(u => u.username === username);
    if (!user) return 0;
    const count = parseInt(user.value, 10);
    if (count >= 3) return 100;
    if (count === 2) return 66;
    if (count === 1) return 33;
    return 0;
  };

  const generateChartData = (leaderboard, category) => {
    if (!leaderboard) return;
    const topFive = leaderboard.slice(0, 5);
    const labels = topFive.map(u => u.username.length > 7 ? u.username.slice(0, 7) + '...' : u.username);
    const values = topFive.map(u => parseFloat(u.value));
    setChartData({ labels, datasets: [{ data: values }] });
  };

  useEffect(() => {
    if (activeCategory === 'health') fetchHealthScore();
    else if (activeCategory === '1rm') fetchLeaderboard('1rm', currentWorkout);
    else fetchLeaderboard(activeCategory);
  }, [activeCategory, currentWorkout, selectedDays]);

  const handleTabPress = (category) => {
    setActiveCategory(category);
    setChartData(null);
  };

  const renderChart = () => {
    const chartConfig = {
      backgroundGradientFrom: '#fff',
      backgroundGradientTo: '#fff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: { borderRadius: 16 },
    };

    if (activeCategory === 'health') {
      return (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <PieChart
            data={healthData.components}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
          <View style={{ position: 'absolute', top: 100, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#4169E1' }}>{healthData.overall}</Text>
            <Text style={{ fontSize: 12, color: '#4169E1' }}>Overall</Text>
          </View>
        </View>
      );
    }

    if (!chartData) return null;

    return (
      <BarChart
        data={chartData}
        width={width - 32}
        height={220}
        chartConfig={chartConfig}
        verticalLabelRotation={30}
        showValuesOnTopOfBars
        fromZero
      />
    );
  };

  const renderItem = ({ item, index }) => {
    const badgeColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#E0E0E0';
    return (
      <View style={styles.leaderboardItem}>
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.rankBadgeText}>{index + 1}</Text>
        </View>

        {/* Username */}
        <View style={{ flex: 1 }}>
          <Text style={styles.usernameText}>{item.username}</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>Athlete</Text>
        </View>

        {/* Score */}
        <Text style={styles.valueText}>
          {parseFloat(item.value).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4169E1" />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Days Picker */}
        <View style={styles.daysSelectorContainer}>
          {[7, 30, 90, 180].map(day => (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDays(day)}
              style={[styles.daysButton, selectedDays === day && styles.daysButtonActive]}
            >
              <Text style={[styles.daysButtonText, selectedDays === day && styles.daysButtonTextActive]}>
                {day}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Tabs */}
        <View style={styles.tabsRow}>
          {['steps', '1rm', 'workouts', 'health'].map(category => (
            <TouchableOpacity
              key={category}
              onPress={() => handleTabPress(category)}
              style={[styles.tabButton, activeCategory === category && styles.activeTabButton]}
            >
              <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
                {category.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Workout Selector */}
        {activeCategory === '1rm' && (
          <View style={styles.workoutSelectorContainer}>
            {Object.entries(WORKOUT_IDS).map(([name, id]) => (
              <TouchableOpacity
                key={id}
                onPress={() => setCurrentWorkout(id)}
                style={[
                  styles.workoutButton,
                  currentWorkout === id && styles.activeWorkoutButton
                ]}
              >
                <Text style={[
                  styles.workoutButtonText,
                  currentWorkout === id && styles.activeWorkoutButtonText
                ]}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Chart */}
        {renderChart()}

        {/* Leaderboard List */}
        {loading ? (
          <ActivityIndicator size="large" color="#4169E1" style={{ marginTop: 20 }} />
        ) : error ? (
          <Text style={{ color: 'red', marginTop: 20, textAlign: 'center' }}>{error}</Text>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingVertical: 10 }}
            renderItem={renderItem}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default LeaderboardPage;
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  daysSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  daysButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  daysButtonActive: {
    backgroundColor: '#4169E1',
  },
  daysButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  daysButtonTextActive: {
    color: 'white',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#4169E1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activeTabText: {
    color: '#4169E1',
  },
  workoutSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  workoutButton: {
    marginHorizontal: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
  },
  activeWorkoutButton: {
    backgroundColor: '#4169E1',
  },
  workoutButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  activeWorkoutButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  rankBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  usernameText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  valueText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4169E1',
  },
});
