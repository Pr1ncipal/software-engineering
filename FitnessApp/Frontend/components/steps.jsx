import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { secureStorage, AUTH_TOKEN_KEY } from '../utils/secureStorage';
import { isNetworkAvailable, getAuthHeaders } from '../utils/networkUtils';
import { useNavigation } from '@react-navigation/native';
import encode from 'jwt-encode';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';


const StepsCalendar = () => {
  const navigation = useNavigation(); // Replace router with navigationx

  // Existing states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [stepsData, setStepsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [stepCount, setStepCount] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  const [weeklySteps, setWeeklySteps] = useState(0);
  const [monthlySteps, setMonthlySteps] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  
  // New states for step goals
  const [dailyStepGoal, setDailyStepGoal] = useState(10000); // Default 10,000 steps goal
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [tempStepGoal, setTempStepGoal] = useState('');

  // Format a date to YYYY-MM-DD
  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Show an alert message (web-friendly)
  const showAlert = (message, severity = 'info') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
    setTimeout(() => setAlertOpen(false), 3000);
  };

  // Fetch step goal when component mounts
  useEffect(() => {
    fetchStepGoal();
  }, []);

  // Generate calendar days when the month changes
  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  // Fetch steps data when component mounts or month changes
  useEffect(() => {
    fetchStepsData();
  }, [currentMonth]);

  // Fetch step goal from API or local storage
  const fetchStepGoal = async () => {
    try {
      // Check if user is online
      const connected = await isNetworkAvailable();
      if (!connected) {
        return;
      }
      
      // Try to get stored step goal from local storage first
      const storedGoal = localStorage.getItem('dailyStepGoal');
      if (storedGoal) {
        setDailyStepGoal(parseInt(storedGoal));
        return;
      }
      
      // In a real app, you would fetch from API here
      // For now, we'll use the default 10,000
      
    } catch (error) {
      console.error('Error fetching step goal:', error);
    }
  };

  // Generate the days for the calendar
  const generateCalendarDays = () => {
    // Existing implementation
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Previous month's days to show
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Add previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        currentMonth: false
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true
      });
    }
    
    // Add next month's days to fill one additional row if needed
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          currentMonth: false
        });
      }
    }
    
    setCalendarDays(days);
  };

  // Fetch steps data from API
  const fetchStepsData = async () => {
    setIsLoading(true);
    
    try {
      // Check if user is online
      const connected = await isNetworkAvailable();
      if (!connected) {
        showAlert('No internet connection. Please try again later.', 'error');
        setIsLoading(false);
        return;
      }

      // Get auth token
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        showAlert('Authentication required. Please log in.', 'error');
        navigation.navigate('Login');
        return;
      }

      // Build URL with optional month and year parameters
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed
      const url = `http://localhost:8080/api/user/get_step_data?month=${month}&year=${year}`;

      // Make API request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(token),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      // Update user goal from API response
      if (data.user_info && data.user_info.step_goal) {
        setDailyStepGoal(data.user_info.step_goal);
      }

      // Update statistics from API response
      if (data.statistics) {
        setWeeklySteps(data.statistics.weekly_steps || 0);
        setMonthlySteps(data.statistics.monthly_steps || 0);
        setStreakDays(data.statistics.current_streak || 0);
      }

      // Format steps data to be used by calendar and history
      const formattedStepsData = {};
      if (Array.isArray(data.steps_data)) {
        data.steps_data.forEach(entry => {
          formattedStepsData[entry.date] = entry.steps;
        });
      }

      setStepsData(formattedStepsData);
      
      // Success message
      if (Object.keys(formattedStepsData).length > 0) {
        showAlert('Steps data loaded successfully!', 'success');
      } else {
        showAlert('No steps data found for this month.', 'info');
      }
      
    } catch (error) {
      console.error('Error fetching steps data:', error);
      showAlert(`Error: ${error.message || 'Failed to fetch steps data'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate weekly and monthly stats
  const calculateStats = (stepsMap) => {
    // If we have statistics from the API, use those instead
    if (stepsMap === 'fromAPI') {
      // Already set from API response
      return;
    }
    
    // Otherwise calculate from local data
    // This is useful when user adds steps offline or before API refresh
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    let weekTotal = 0;
    let monthTotal = 0;
    
    // Calculate streak
    let streak = 0;
    let currentDate = new Date();
    let checkingStreak = true;
    
    while (checkingStreak) {
      const dateString = formatDateToYYYYMMDD(currentDate);
      if (stepsMap[dateString] && stepsMap[dateString] >= dailyStepGoal * 0.6) { // Consider 60% of goal as meeting the goal for streak
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        checkingStreak = false;
      }
    }
    
    // Sum up the weekly and monthly steps
    Object.keys(stepsMap).forEach(dateString => {
      const date = new Date(dateString);
      const steps = stepsMap[dateString];
      
      // Weekly total
      const isInCurrentWeek = date >= startOfWeek && date <= today;
      if (isInCurrentWeek) {
        weekTotal += steps;
      }
      
      // Monthly total
      const isInCurrentMonth = date.getMonth() === today.getMonth() && 
                              date.getFullYear() === today.getFullYear();
      if (isInCurrentMonth) {
        monthTotal += steps;
      }
    });
    
    setWeeklySteps(weekTotal);
    setMonthlySteps(monthTotal);
    setStreakDays(streak);
  };

  // Move to the previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  // Move to the next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDate(day.date);
    
    const dateString = formatDateToYYYYMMDD(day.date);
    if (stepsData[dateString]) {
      setStepCount(stepsData[dateString].toString());
    } else {
      setStepCount('');
    }
    
    setModalVisible(true);
  };

  // Save steps for the selected date
  const saveSteps = async () => {
    try {
      // Validate steps input
      const steps = parseInt(stepCount);
      if (isNaN(steps) || steps < 0) {
        showAlert('Please enter a valid number of steps.', 'error');
        return;
      }
      
      // Check network connectivity
      const connected = await isNetworkAvailable();
      if (!connected) {
        showAlert('No internet connection. Please try again later.', 'error');
        return;
      }
      
      // Get auth token
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        showAlert('Authentication required. Please log in.', 'error');
        navigation.navigate('Login');
        return;
      }
      
      // Format date for API
      const dateString = formatDateToYYYYMMDD(selectedDate);
      
      // Create JWT payload using the token as the secret
      const payload = {
        steps: steps,
        date: dateString,
        timestamp: new Date().getTime()
      };
      
      // Create JWT token
      const jwt = encode(payload, token);

      const authheaders = getAuthHeaders(token);
      
      // Send data to API

      console.log('Headers: ', authheaders);

      const url = 'http://localhost:8080/api/user/add_step_data';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...authheaders,
        },
        body: JSON.stringify({token: jwt})
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }
      
      // Update local state
      setStepsData(prevData => ({
        ...prevData,
        [dateString]: steps
      }));
      
      // Recalculate stats - or refetch data from API
      await fetchStepsData();
      
      showAlert('Steps saved successfully!', 'success');
      setModalVisible(false);
      
    } catch (error) {
      console.error('Error saving steps:', error);
      showAlert(`Error: ${error.message || 'Failed to save steps'}`, 'error');
    }
  };

  // Open goal modal
  const openGoalModal = () => {
    setTempStepGoal(dailyStepGoal.toString());
    setGoalModalVisible(true);
  };

  // Save step goal
  const saveStepGoal = async () => {
    try {
      // Validate goal input
      const goal = parseInt(tempStepGoal);
      if (isNaN(goal) || goal <= 0) {
        showAlert('Please enter a valid step goal.', 'error');
        return;
      }
      
      // Check network connectivity
      const connected = await isNetworkAvailable();
      if (!connected) {
        showAlert('No internet connection. Please try again later.', 'error');
        return;
      }
      
      // Get auth token
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        showAlert('Authentication required. Please log in.', 'error');
        navigation.navigate('Login');
        return;
      }
      
      // Create JWT payload using the token as the secret
      const payload = {
        target_steps: goal,
        goal_type: 'steps',
        achieve_by: '2025-12-31', // Example date, adjust as needed
        timestamp: new Date().getTime()
      };
      
      // Create JWT token
      const jwt = encode(payload, token);
      
      // Get authentication headers
      const authHeaders = getAuthHeaders(token);
      
      // Send goal to API
      const url = 'http://localhost:8080/api/user/create_goal';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: jwt })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }
      
      // Update state
      setDailyStepGoal(goal);
      
      // Save to local storage as fallback
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dailyStepGoal', goal.toString());
      }
      
      // Recalculate stats with new goal
      calculateStats(stepsData);
      
      showAlert('Step goal updated successfully!', 'success');
      setGoalModalVisible(false);
      
    } catch (error) {
      console.error('Error saving step goal:', error);
      showAlert(`Error: ${error.message || 'Failed to save step goal'}`, 'error');
    }
  };

  // Get a color based on step count
  const getStepColor = (steps) => {
    if (!steps) return '#edf2f7'; // Default light gray for no steps
    
    // Base colors on percentage of goal instead of fixed numbers
    const percentage = (steps / dailyStepGoal) * 100;
    
    if (percentage < 30) return '#fed7d7'; // Light red for <30% of goal
    if (percentage < 60) return '#feebc8'; // Light orange for 30-60% of goal
    if (percentage < 100) return '#fefcbf'; // Light yellow for 60-100% of goal
    return '#c6f6d5'; // Light green for >=100% of goal
  };

  // Get a more vibrant version of the same color for the text
  const getStepTextColor = (steps) => {
    if (!steps) return '#718096'; // Default gray for no steps
    
    // Base colors on percentage of goal instead of fixed numbers
    const percentage = (steps / dailyStepGoal) * 100;
    
    if (percentage < 30) return '#e53e3e'; // Red for <30% of goal
    if (percentage < 60) return '#dd6b20'; // Orange for 30-60% of goal
    if (percentage < 100) return '#d69e2e'; // Yellow for 60-100% of goal
    return '#38a169'; // Green for >=100% of goal
  };

  // Get activity level text based on step count
  const getActivityLevel = (steps, goalPercentage = null) => {
    // If goalPercentage is directly provided (from API)
    let percentage = goalPercentage;
    
    // Otherwise calculate it
    if (percentage === null) {
      percentage = (steps / dailyStepGoal) * 100;
    }
    
    if (percentage < 30) return 'Low Activity';
    if (percentage < 60) return 'Moderate Activity';
    if (percentage < 100) return 'Good Activity';
    return 'Goal Achieved!';
  };

  // Format month name
  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Calculate completion percentage for progress bars
  const getCompletionPercentage = (steps) => {
    const percentage = Math.min(100, Math.round((steps / dailyStepGoal) * 100));
    return `${percentage}%`;
  };

  // Calculate goal progress percentage
  const getGoalProgress = (steps) => {
    const percentage = Math.min(100, Math.round((steps / (dailyStepGoal * 7)) * 100));
    return percentage;
  };

  const [fontsLoaded] = useFonts({
    'RalewayRegular': require('../assets/fonts/Raleway-Regular.ttf'),
  });
  
  if (!fontsLoaded) return null;
  

  return (
    <LinearGradient
      colors={['#000080', '#007AFF']}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
  
      {/* Back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
  <Text style={styles.title}>Steps Tracker</Text>
  <View style={styles.titleUnderline} />
</View>

        <View style={styles.placeholderView} />
      </View>

      {/* Goal Setting Button and Progress */}
      <View style={styles.goalContainer}>
        <View style={styles.goalHeader}>
          <View>
            <Text style={styles.goalTitle}>Daily Step Goal</Text>
            <Text style={styles.goalValue}>{dailyStepGoal.toLocaleString()} steps</Text>
          </View>
          <TouchableOpacity 
            style={styles.editGoalButton}
            onPress={openGoalModal}
          >
            <Text style={styles.editGoalButtonText}>Edit Goal</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.weeklyGoalContainer}>
          <Text style={styles.weeklyGoalLabel}>
            Weekly Goal Progress: {getGoalProgress(weeklySteps)}%
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${getGoalProgress(weeklySteps)}%` }
              ]} 
            />
          </View>
          <Text style={styles.weeklyGoalSubtext}>
            {weeklySteps.toLocaleString()} / {(dailyStepGoal * 7).toLocaleString()} steps this week
          </Text>
        </View>
      </View>
      
      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>This Week</Text>
          <Text style={styles.statsValue}>{weeklySteps.toLocaleString()}</Text>
          <Text style={styles.statsUnit}>steps</Text>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>This Month</Text>
          <Text style={styles.statsValue}>{monthlySteps.toLocaleString()}</Text>
          <Text style={styles.statsUnit}>steps</Text>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Current Streak</Text>
          <Text style={styles.statsValue}>{streakDays}</Text>
          <Text style={styles.statsUnit}>days</Text>
        </View>
      </View>
      
      {/* Instruction above calendar */}
      <View style={styles.calendarInstructionContainer}>
        <Text style={styles.calendarInstruction}>
          <Text style={{ fontWeight: 'bold', color: '#4a69bd' }}>Tip:</Text> Tap any day on the calendar below to edit your steps.
        </Text>
      </View>
      
      {/* Calendar - More compact version */}
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{getMonthName(currentMonth)}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>
        
        {/* Calendar Day Headers */}
        <View style={styles.dayLabelsContainer}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={styles.dayLabel}>{day}</Text>
          ))}
        </View>
        
        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const dateString = formatDateToYYYYMMDD(day.date);
            const steps = stepsData[dateString];
            const isToday = dateString === formatDateToYYYYMMDD(new Date());
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !day.currentMonth && styles.otherMonthDay,
                  isToday && styles.today,
                  steps && { backgroundColor: getStepColor(steps) }
                ]}
                onPress={() => handleDaySelect(day)}
              >
                <Text style={[
                  styles.dayNumber,
                  !day.currentMonth && styles.otherMonthDayNumber,
                  isToday && styles.todayNumber,
                  steps && { color: getStepTextColor(steps) }
                ]}>
                  {day.date.getDate()}
                </Text>
                {steps ? (
                  <Text style={[
                    styles.stepCount,
                    { color: getStepTextColor(steps) }
                  ]}>
                    {steps > 999 ? `${Math.round(steps / 1000)}k` : steps}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Legend for calendar colors */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#fed7d7' }]} />
            <Text style={styles.legendText}>&lt;30% of goal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#feebc8' }]} />
            <Text style={styles.legendText}>30-60% of goal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#fefcbf' }]} />
            <Text style={styles.legendText}>60-100% of goal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#c6f6d5' }]} />
            <Text style={styles.legendText}>Goal achieved</Text>
          </View>
        </View>
      </View>
      
      {/* Steps History Section */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Recent Steps History</Text>
        
        {Object.keys(stepsData)
          .sort((a, b) => new Date(b) - new Date(a)) // Sort by date, newest first
          .slice(0, 10) // Show only latest 10 entries
          .map((dateString, index) => {
            const steps = stepsData[dateString];
            const date = new Date(dateString);
            const goalPercentage = Math.round((steps / dailyStepGoal) * 100);
            
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.historyItem}
                onPress={() => {
                  setSelectedDate(date);
                  setStepCount(steps.toString());
                  setModalVisible(true);
                }}
              >
                <View style={styles.historyDate}>
                  <Text style={styles.historyDay}>{date.getDate()}</Text>
                  <Text style={styles.historyMonth}>{date.toLocaleString('default', { month: 'short' })}</Text>
                </View>
                
                <View style={styles.historyDetails}>
                  <View style={styles.historyDetailsTop}>
                    <Text style={styles.historySteps}>{steps.toLocaleString()} steps</Text>
                    <Text style={[
                      styles.historyGoalPercent,
                      { color: getStepTextColor(steps) }
                    ]}>
                      {goalPercentage}%
                    </Text>
                  </View>
                  <Text style={styles.historyLabel}>
                    {getActivityLevel(steps)}
                  </Text>
                </View>
                
                <View style={[
                  styles.historyProgress, 
                  { backgroundColor: getStepColor(steps) }
                ]}>
                  <View 
                    style={[
                      styles.historyProgressFill,
                      { 
                        backgroundColor: getStepTextColor(steps),
                        width: `${Math.min(100, (steps / dailyStepGoal) * 100)}%`
                      }
                    ]} 
                  />
                </View>
              </TouchableOpacity>
            );
          })}
          
        {Object.keys(stepsData).length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No step data available. Tap on a day to add steps.
            </Text>
          </View>
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading step data...</Text>
          </View>
        )}
      </View>
      
      {/* Add Steps Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedDate.toDateString()}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Step Count</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={stepCount}
                onChangeText={setStepCount}
                placeholder="Enter number of steps"
              />
            </View>
            
            {parseInt(stepCount) > 0 && (
              <View style={styles.goalProgressInfo}>
                <Text style={styles.goalProgressLabel}>
                  Goal Progress: {Math.round((parseInt(stepCount) / dailyStepGoal) * 100)}%
                </Text>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill,
                      { width: `${Math.min(100, (parseInt(stepCount) / dailyStepGoal) * 100)}%` }
                    ]} 
                  />
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveSteps}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Step Goal Modal */}
      <Modal
        visible={goalModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Step Goal</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Daily Step Goal</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={tempStepGoal}
                onChangeText={setTempStepGoal}
                placeholder="Enter daily step goal"
              />
            </View>
            
            <View style={styles.goalTips}>
              <Text style={styles.goalTipTitle}>Recommended Goals:</Text>
              <View style={styles.goalTipItems}>
                <TouchableOpacity 
                  style={styles.goalTipItem}
                  onPress={() => setTempStepGoal("5000")}
                >
                  <Text style={styles.goalTipText}>5,000</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.goalTipItem}
                  onPress={() => setTempStepGoal("7500")}
                >
                  <Text style={styles.goalTipText}>7,500</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.goalTipItem}
                  onPress={() => setTempStepGoal("10000")}
                >
                  <Text style={styles.goalTipText}>10,000</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.goalTipItem}
                  onPress={() => setTempStepGoal("12500")}
                >
                  <Text style={styles.goalTipText}>12,500</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.goalTipDesc}>
                The CDC recommends adults aim for 10,000 steps daily for optimal health benefits.
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveStepGoal}
              >
                <Text style={styles.saveButtonText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Web Alert */}
      {typeof document !== 'undefined' && alertOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: 16,
            backgroundColor: alertSeverity === 'error' ? '#f44336' :
                            alertSeverity === 'warning' ? '#ff9800' : '#4caf50',
            color: 'white',
            borderRadius: 8,
            maxWidth: 400,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: 9999
          }}
        >
          {alertMessage}
        </div>
      )}
        </ScrollView>
  </LinearGradient>

  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  
  title: {
    fontSize: 60,
    fontFamily: 'RalewayRegular',
    color: '#ffffff',
    textAlign: 'center',
  },
  
  titleUnderline: {
    marginTop: 8,
    width: 120,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  
  // Goal Container Styles
  goalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
  },
  goalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  editGoalButton: {
    backgroundColor: '#4a69bd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editGoalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  weeklyGoalContainer: {
    marginTop: 8,
  },
  weeklyGoalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#edf2f7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a69bd',
    borderRadius: 4,
  },
  weeklyGoalSubtext: {
    fontSize: 12,
    color: '#718096',
  },
  
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statsLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  statsUnit: {
    fontSize: 12,
    color: '#a0aec0',
  },
  
  // Calendar styling
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    backgroundColor: '#e2e8f0',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  dayLabelsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%', // 7 days per row
    aspectRatio: 1,
    padding: 2,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40, // Fixed height to make calendar more compact
  },
  otherMonthDay: {
    backgroundColor: '#f7fafc',
  },
  today: {
    borderColor: '#4a69bd',
    borderWidth: 1.5,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2d3748',
  },
  otherMonthDayNumber: {
    color: '#a0aec0',
  },
  todayNumber: {
    fontWeight: 'bold',
  },
  stepCount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Legend styles
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#718096',
  },
  
  // History items
  historyContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2d3748',
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    alignItems: 'center',
  },
  historyDate: {
    width: 40,
    alignItems: 'center',
    marginRight: 8,
  },
  historyDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  historyMonth: {
    fontSize: 10,
    color: '#718096',
  },
  historyDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  historyDetailsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historySteps: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  historyGoalPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a69bd',
  },
  historyLabel: {
    fontSize: 12,
    color: '#718096',
  },
  historyProgress: {
    width: 60,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#edf2f7',
  },
  historyProgressFill: {
    height: '100%',
    backgroundColor: '#4299e1',
  },
  
  // Empty state
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  
  // Loading state
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#718096',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2d3748',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#4a5568',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f7fafc',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4a69bd',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Goal progress info in modal
  goalProgressInfo: {
    marginBottom: 20,
  },
  goalProgressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#edf2f7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#4a69bd',
    borderRadius: 4,
  },
  
  // Goal tips in goal modal
  goalTips: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  goalTipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  goalTipItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  goalTipItem: {
    backgroundColor: '#ebf8ff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bee3f8',
  },
  goalTipText: {
    fontSize: 14,
    color: '#3182ce',
    fontWeight: '600',
  },
  goalTipDesc: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 14,
  },
  placeholderView: {
    width: 80, // Same width as back button to center the title
  },
  calendarInstruction: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 8,
  },
  calendarInstructionContainer: {
    backgroundColor: '#e6f0fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  calendarInstruction: {
    fontSize: 15,
    color: '#4a69bd',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default StepsCalendar;