import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const API_URL = 'http://127.0.0.1:8080/api/leaderboard/get_leaderboard';
const apiKey = 'aFAvLklqd1NnT3U3QT9fO21RQmpFezdDUyhfNV5EcFU1cSEwRks5aDVpbHk9e31ET1IvWSZJbCpZLFk3c2BIMw==';

// Workout ID mapping
const WORKOUT_IDS = {
  bench: '273',
  squat: '716',
  deadlift: '523'
};

const LeaderboardPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('steps');
  const [currentWorkout, setCurrentWorkout] = useState('273'); // Default to bench press ID
  const [error, setError] = useState(null);

  const fetchLeaderboard = async (category, workout = '') => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        category, 
        days: '7',
        scope: 'global',
        workout: category === '1rm' ? workout : '',
        number: '10'
      }).toString();
  
      const response = await fetch(`${API_URL}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${apiKey}`
        }
      });
  
      const responseText = await response.text();
      console.log('Raw API Response:', response.status, responseText);
  
      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        if (errorData.error === 'no_leaderboard_data') {
          setError('No leaderboard data available');
          setData([]);
        } else {
          console.error('Leaderboard fetch error:', response.status, responseText);
        }
        setLoading(false);
        return;
      }
  
      const result = JSON.parse(responseText);
      setData(result.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to fetch leaderboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeCategory === '1rm') {
      fetchLeaderboard(activeCategory, currentWorkout);
    } else {
      fetchLeaderboard(activeCategory);
    }
  }, [activeCategory, currentWorkout]);

  // Workout selection component with custom design
  const WorkoutSelector = () => {
    const workouts = [
      { id: '273', name: 'Bench', icon: 'fitness' },
      { id: '716', name: 'Squat', icon: 'body' },
      { id: '523', name: 'Deadlift', icon: 'basketball' }
    ];
    
    return (
      <View style={styles.workoutSelectorContainer}>
        {workouts.map((workout) => (
          <TouchableOpacity
            key={workout.id}
            style={[
              styles.workoutButton, 
              currentWorkout === workout.id && styles.activeWorkoutButton
            ]}
            onPress={() => setCurrentWorkout(workout.id)}
          >
            <View style={styles.workoutButtonContent}>
              <Ionicons 
                name={workout.icon} 
                size={24} 
                color={currentWorkout === workout.id ? 'white' : '#4169E1'}
              />
              <Text style={[
                styles.workoutButtonText, 
                currentWorkout === workout.id && styles.activeWorkoutButtonText
              ]}>
                {workout.name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Premium Rank Badge Component
  const RankBadge = ({ index }) => {
    const rankColors = [
      ['#FFD700', '#FFA500'],  // Gold
      ['#C0C0C0', '#A9A9A9'],  // Silver
      ['#CD7F32', '#8B4513']   // Bronze
    ];

    if (index < 3) {
      const [startColor, endColor] = rankColors[index];
      return (
        <View style={[styles.rankBadgeContainer, { 
          backgroundColor: startColor,
          borderColor: endColor
        }]}>
          <Text style={styles.rankBadgeText}>{index + 1}</Text>
        </View>
      );
    }

    return (
      <View style={styles.standardRankContainer}>
        <Text style={styles.standardRankText}>{index + 1}</Text>
      </View>
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.row}>
      <RankBadge index={index} />
      <View style={styles.userInfoContainer}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userSubtext}>Athlete</Text>
      </View>
      <View style={styles.statContainer}>
        <Text style={styles.statValue}>{parseFloat(item.value).toLocaleString()}</Text>
        <Text style={styles.statLabel}>
          {activeCategory === '1rm' ? '1RM (lbs)' : 
           activeCategory === 'steps' ? 'Steps' : 
           activeCategory === 'workouts' ? 'Workouts' : 
           'Pace'}
        </Text>
      </View>
    </View>
  );

  // Render empty or error state
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#4169E1" style={styles.loadingIndicator} />;
    }

    if (error) {
      return (
        <View style={styles.emptyListContainer}>
          <Ionicons name="sad-outline" size={64} color="#888" />
          <Text style={styles.emptyListText}>{error}</Text>
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyListContainer}>
          <Ionicons name="stats-chart-outline" size={64} color="#888" />
          <Text style={styles.emptyListText}>No leaderboard data available</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4169E1" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>
      
      <View style={styles.tabContainer}>
        {['steps', '1rm', 'workouts', 'pace'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.tab, activeCategory === category && styles.activeTab]}
            onPress={() => setActiveCategory(category)}
          >
            <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
              {category.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeCategory === '1rm' && <WorkoutSelector />}

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  
    // Container and Basic Layout
    container: { 
      flex: 1, 
      backgroundColor: '#f5f5f5' 
    },
    
    // Header Styles
    header: { 
      backgroundColor: '#4169E1', 
      paddingVertical: 20, 
      paddingHorizontal: 15, 
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    },
    headerTitle: { 
      fontSize: 24, 
      fontWeight: 'bold', 
      color: 'white' 
    },
    
    // Category Tab Styles
    tabContainer: { 
      flexDirection: 'row', 
      justifyContent: 'center', 
      marginTop: 20,
      marginHorizontal: 15
    },
    tab: { 
      flex: 1,
      paddingVertical: 12, 
      marginHorizontal: 5, 
      borderRadius: 10, 
      borderWidth: 1, 
      borderColor: '#4169E1',
      alignItems: 'center',
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3
    },
    activeTab: { 
      backgroundColor: '#4169E1' 
    },
    tabText: { 
      color: '#4169E1', 
      fontWeight: '600',
      fontSize: 16
    },
    activeTabText: { 
      color: 'white' 
    },
    
    // Workout Selector Styles
    workoutSelectorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginVertical: 15,
      marginHorizontal: 15
    },
    workoutButton: {
      flex: 1,
      marginHorizontal: 5,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#4169E1',
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3
    },
    activeWorkoutButton: {
      backgroundColor: '#4169E1'
    },
    workoutButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10
    },
    workoutButtonText: {
      color: '#4169E1',
      fontWeight: '600',
      marginLeft: 8,
      fontSize: 16
    },
    activeWorkoutButtonText: {
      color: 'white'
    },
    
    // Leaderboard List Styles
    listContent: { 
      paddingBottom: 20 
    },
    row: { 
      flexDirection: 'row', 
      padding: 16, 
      alignItems: 'center', 
      borderBottomWidth: 1, 
      borderBottomColor: '#eee',
      backgroundColor: 'white',
      marginHorizontal: 15,
      marginVertical: 5,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    },
    
    // Rank and User Styles
    rankContainer: { 
      width: 50, 
      alignItems: 'center' 
    },
    rankText: { 
      fontSize: 16, 
      fontWeight: 'bold', 
      color: '#888' 
    },
    userName: { 
      flex: 1, 
      fontSize: 14, 
      fontWeight: '500', 
      color: '#333' 
    },
    statValue: { 
      fontSize: 14, 
      fontWeight: 'bold', 
      color: '#4169E1' 
    },
    
    // Loading and Empty State Styles
    loadingIndicator: { 
      marginTop: 20 
    },
    emptyListContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 50
    },
    emptyListText: {
      fontSize: 18,
      color: '#888'
    },
 
  // Premium Rank Styling
  rankBadgeContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5
  },
  rankBadgeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  },
  standardRankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  standardRankText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600'
  },

  // Enhanced Row Styling
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 15
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  userSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  statContainer: {
    alignItems: 'flex-end'
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4169E1'
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  }
});

export default LeaderboardPage;