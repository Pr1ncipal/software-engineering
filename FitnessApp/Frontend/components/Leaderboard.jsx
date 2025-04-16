

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { secureStorage } from '@/utils/secureStorage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

const { width } = Dimensions.get('window');

const API_URL = 'http://127.0.0.1:8080/api/leaderboard/get_leaderboard';
//const apiKey = 'TVhFMXpWLSFhVkkreDVxU1BfVCNmMkUqKU1uRThWNFd0TFVGKV49PF98M1wpX0tkfm4zYkBiR1wueG1rfGotLg==';
const AUTH_TOKEN_KEY = 'authToken';

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
  const [categoryErrors, setCategoryErrors] = useState({});
  const [chartData, setChartData] = useState(null);
  const [showChart, setShowChart] = useState(false);
  
  // Ref to track mounted state
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchLeaderboard = async (category, workout = '') => {
    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }
    
    // For health category, we don't need to fetch from API
    if (category === 'health') {
      if (isMounted.current) {
        setLoading(false);
        setData([]);
        setShowChart(true);
      }
      return;
    }
    
    try {

      const storedApiKey = await secureStorage.getItem(AUTH_TOKEN_KEY)
      
      const encodedKey = Buffer.from(storedApiKey).toString('base64');
      if (!storedApiKey){
        throw new Error('API key is missing. Please log in again')
      }
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
          'Authorization': `ApiKey ${encodedKey}`
        }
      });
      
      const responseText = await response.text();
      console.log(`${category} API Response:`, response.status, responseText);
  
      if (!response.ok) {
        // Store error status for this specific category
        if (isMounted.current) {
          setCategoryErrors(prev => ({
            ...prev, 
            [category]: response.status
          }));
          
          if (response.status === 500) {
            setError(`Server error occurred for ${category}`);
            setData([]);
          } else {
            try {
              const errorData = JSON.parse(responseText);
              if (errorData.error === 'no_leaderboard_data') {
                setError('No leaderboard data available');
                setData([]);
              } else {
                setError(`Error: ${errorData.error || 'Unknown error'}`);
              }
            } catch (e) {
              setError('Failed to parse error response');
            }
          }
          setLoading(false);
        }
        return;
      }
  
      // Clear error for this category if it was successful
      if (isMounted.current) {
        setCategoryErrors(prev => {
          const newErrors = {...prev};
          delete newErrors[category];
          return newErrors;
        });
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        if (isMounted.current) {
          setError('Failed to parse leaderboard data');
          setLoading(false);
        }
        return;
      }
      
      if (isMounted.current) {
        setData(result.leaderboard);
        generateChartData(result.leaderboard, category);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      if (isMounted.current) {
        setError('Failed to fetch leaderboard');
      }
    }
    if (isMounted.current) {
      setLoading(false);
    }
  };

  // Generate chart data based on leaderboard data
  const generateChartData = (leaderboardData, category) => {
    if (!leaderboardData || leaderboardData.length === 0) return;
    
    const labels = leaderboardData.slice(0, 5).map(item => {
      // Truncate long usernames
      return item.username.length > 8 ? item.username.substring(0, 7) + '...' : item.username;
    });
    
    const values = leaderboardData.slice(0, 5).map(item => parseFloat(item.value));
    
    let unit = '';
    switch (category) {
      case 'steps':
        unit = 'Steps';
        break;
      case '1rm':
        unit = 'lbs';
        break;
      case 'workouts':
        unit = 'Count';
        break;
      case 'pace':
        unit = 'Pace';
        break;
      default:
        unit = '';
    }
    
    setChartData({
      labels,
      datasets: [
        {
          data: values,
          color: (opacity = 1) => getChartColor(category, opacity),
          strokeWidth: 2,
        }
      ],
      unit
    });
    
    setShowChart(true);
  };
  
  // Get chart color based on category
  const getChartColor = (category, opacity = 1) => {
    switch(category) {
      case 'steps':
        return `rgba(65, 105, 225, ${opacity})`;
      case 'workouts':
        return `rgba(255, 149, 0, ${opacity})`;
      case '1rm':
        return `rgba(88, 86, 214, ${opacity})`;
      case 'pace':
        return `rgba(76, 217, 100, ${opacity})`;
      default:
        return `rgba(65, 105, 225, ${opacity})`;
    }
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    if (category === 'health') {
      // Just set the active category, no need to fetch data
      setShowChart(true);
      setData([]);
      setLoading(false);
    } else if (category === '1rm') {
      fetchLeaderboard(category, currentWorkout);
    } else {
      fetchLeaderboard(category);
    }
  };

  useEffect(() => {
    // Initial load of data
    if (activeCategory === '1rm') {
      fetchLeaderboard(activeCategory, currentWorkout);
    } else if (activeCategory !== 'health') {
      fetchLeaderboard(activeCategory);
    }
  }, []);

  // Handle workout change for 1RM category
  const handleWorkoutChange = (workoutId) => {
    setCurrentWorkout(workoutId);
    if (activeCategory === '1rm') {
      fetchLeaderboard(activeCategory, workoutId);
    }
  };

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
            onPress={() => handleWorkoutChange(workout.id)}
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

  // Enhanced Charts component with improved visuals
  const LeaderboardCharts = () => {
    if (!showChart) return null;
    
    // Get chart type based on category
    const getChartType = () => {
      switch(activeCategory) {
        case 'steps':
          return 'bar';
        case 'workouts':
          return 'line';
        case '1rm':
          return 'bar';
        case 'pace':
          return 'line';
        case 'health':
          return 'pie';
        default:
          return 'bar';
      }
    };
    
    // Custom chart config
    const chartConfig = {
      backgroundGradientFrom: '#fff',
      backgroundGradientTo: '#fff',
      decimalPlaces: 0,
      color: (opacity = 1) => getChartColor(activeCategory, opacity),
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: getChartColor(activeCategory, 1)
      }
    };

    const [fontsLoaded] = useFonts({
      'RalewayRegular': require('../assets/fonts/Raleway-Regular.ttf'),
    });
    
    if (!fontsLoaded) return null;
    
    // For health category we create mock data
    if (activeCategory === 'health') {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Family Health Score</Text>
          <View style={styles.chartWrapper}>
            <PieChart
              data={[
                { name: 'Steps', value: 85, color: '#4169E1', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                { name: 'Strength', value: 75, color: '#5856D6', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                { name: 'Workouts', value: 90, color: '#FF9500', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                { name: 'Pace', value: 80, color: '#4CD964', legendFontColor: '#7F7F7F', legendFontSize: 12 },
              ]}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
          <View style={styles.healthScoreCircleContainer}>
            <View style={styles.healthScoreCircle}>
              <Text style={styles.healthScoreText}>83</Text>
              <Text style={styles.healthScoreLabel}>OVERALL SCORE</Text>
            </View>
          </View>
          <View style={styles.chartDivider} />
          <Text style={styles.chartSubtitle}>Score Breakdown</Text>
          <View style={styles.scoreBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Steps</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '85%', backgroundColor: '#4169E1' }]} />
              </View>
              <Text style={styles.breakdownValue}>85%</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Strength</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '75%', backgroundColor: '#5856D6' }]} />
              </View>
              <Text style={styles.breakdownValue}>75%</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Workouts</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '90%', backgroundColor: '#FF9500' }]} />
              </View>
              <Text style={styles.breakdownValue}>90%</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Pace</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '80%', backgroundColor: '#4CD964' }]} />
              </View>
              <Text style={styles.breakdownValue}>80%</Text>
            </View>
          </View>
          <View style={styles.chartDivider} />
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>Family Insights</Text>
            <View style={styles.insightRow}>
              <Ionicons name="trending-up" size={24} color="#4CD964" />
              <Text style={styles.insightText}>Family activity up 12% this week</Text>
            </View>
            <View style={styles.insightRow}>
              <Ionicons name="star" size={24} color="#FFCC00" />
              <Text style={styles.insightText}>Workouts are your strongest category</Text>
            </View>
            <View style={styles.insightRow}>
              <Ionicons name="fitness" size={24} color="#FF9500" />
              <Text style={styles.insightText}>Suggested focus: Increase strength training</Text>
            </View>
          </View>
        </View>
      );
    }
    
    if (!chartData || data.length === 0) return null;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Top 5 {activeCategory.toUpperCase()} Leaders</Text>
        <View style={styles.chartWrapper}>
          {getChartType() === 'bar' && (
            <BarChart
              data={chartData}
              width={width - 40}
              height={220}
              chartConfig={{
                ...chartConfig,
                barPercentage: 0.7,
                barRadius: 5,
                fillShadowGradient: getChartColor(activeCategory, 1),
                fillShadowGradientOpacity: 1,
              }}
              verticalLabelRotation={30}
              fromZero={true}
              showValuesOnTopOfBars={true}
              style={styles.chart}
            />
          )}
          
          {getChartType() === 'line' && (
            <LineChart
              data={chartData}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          )}
        </View>
        
        <View style={styles.chartDivider} />
        
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Quick Stats</Text>
          <View style={styles.insightRow}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.insightText}>
              {data[0]?.username || 'Leader'} is ahead by {Math.round(parseFloat(data[0]?.value || 0) - parseFloat(data[1]?.value || 0))} {chartData.unit}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Ionicons name="analytics" size={24} color="#4169E1" />
            <Text style={styles.insightText}>
              Average: {Math.round(data.reduce((sum, item) => sum + parseFloat(item.value), 0) / data.length)} {chartData.unit}
            </Text>
          </View>
        </View>
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
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (activeCategory === '1rm') {
                fetchLeaderboard(activeCategory, currentWorkout);
              } else if (activeCategory !== 'health') {
                fetchLeaderboard(activeCategory);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Special case for health category
    if (activeCategory === 'health') {
      return <LeaderboardCharts />;
    }

    if (data.length === 0 && !error) {
      return (
        <View style={styles.emptyListContainer}>
          <Ionicons name="stats-chart-outline" size={64} color="#888" />
          <Text style={styles.emptyListText}>No leaderboard data available</Text>
        </View>
      );
    }

    return (
      <ScrollView>
        <LeaderboardCharts />
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false} // Disable scroll since we're using ScrollView
        />
      </ScrollView>
    );
  };

  // Status indicator component to show which tab has errors
  const CategoryStatusIndicator = ({ category }) => {
    if (categoryErrors[category] === 500) {
      return <View style={styles.errorIndicator} />;
    }
    return null;
  };

  return (
    <LinearGradient colors={['#8E2DE2','#007AFF','#B3E5FC']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
      
      <View style={styles.titleContainer}>
  <Text style={styles.title}>Leaderboard</Text>
  <View style={styles.titleUnderline} />
</View>

      
      <View style={styles.tabContainer}>
        {['steps', '1rm', 'workouts', 'pace', 'health'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.tab, activeCategory === category && styles.activeTab]}
            onPress={() => handleCategoryChange(category)}
          >
            <View style={styles.tabContentWrapper}>
              <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
                {category === 'health' ? 'OVERALL' : category.toUpperCase()}
              </Text>
              <CategoryStatusIndicator category={category} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {activeCategory === '1rm' && <WorkoutSelector />}

      {renderContent()}
      
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // Container and Basic Layout
  container: { 
    flex: 1, 
    backgroundColor: 'transparent' 
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
    justifyContent: 'space-between', 
    marginTop: 20,
    marginHorizontal: 15
  },
  tab: { 
    flex: 1,
    paddingVertical: 12, 
    marginHorizontal: 3, 
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
    fontSize: 12
  },
  activeTabText: { 
    color: 'white' 
  },
  tabContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  errorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
    marginLeft: 5
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
  
  // Enhanced Chart Styles
  chartContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center'
  },
  chartSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 10
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8
  },
  chartDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15
  },
  
  // Health Score specific styles
  healthScoreCircleContainer: {
    alignItems: 'center',
    marginVertical: 15
  },
  healthScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  healthScoreText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white'
  },
  healthScoreLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500'
  },
  scoreBreakdown: {
    marginTop: 5
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  breakdownLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginHorizontal: 10
  },
  progressBar: {
    height: 10,
    borderRadius: 5
  },
  breakdownValue: {
    width: 40,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    color: '#333'
  },
  
  // Insights container
  insightsContainer: {
    marginTop: 5
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  insightText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    flex: 1
  },
  
  // Leaderboard List Styles
  listContent: { 
    paddingBottom: 20 
  },
  
  // Error and Loading States
  loadingIndicator: { 
    marginTop: 20 
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    padding: 20
  },
  emptyListText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 10
  },
  errorText: {
    fontSize: 18,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 10
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4169E1',
    borderRadius: 8
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold'
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
  },


  //amir was here:

  gradient: {
    flex: 1,
  },
  
  title: {
    fontSize: 60,
    fontFamily: 'RalewayRegular',
    color: '#ffffff',
    textAlign: 'center',
  },
  
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  
  titleUnderline: {
    marginTop: 5,
    width: 120,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  
});

export default LeaderboardPage;
