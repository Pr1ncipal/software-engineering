import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import encode from 'jwt-encode';
import { secureStorage, AUTH_TOKEN_KEY } from '../utils/secureStorage';
import { isNetworkAvailable, getAuthHeaders } from '../utils/networkUtils';
import { Picker } from '@react-native-picker/picker';
import ChooseExercise from './chooseExercise';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigation } from '@react-navigation/native';

// Create a custom input component that works better with React Native
const CustomDatePickerInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
  <TouchableOpacity onPress={onClick} style={styles.input}>
    <Text style={value ? styles.selectedExerciseText : styles.placeholderText}>
      {value || placeholder}
    </Text>
  </TouchableOpacity>
));

// Replace your calendar implementation with this:
const CalendarPicker = ({ selected, onChange, placeholder }) => {
  // Handle web and native platforms differently
  if (typeof document !== 'undefined') {
    return (
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="MM/dd/yyyy"
        minDate={new Date()}
        popperPlacement="top-start"
        popperProps={{
          strategy: 'fixed',
          modifiers: [
            {
              name: 'preventOverflow',
              options: {
                rootBoundary: 'viewport',
                altAxis: true,
              },
            },
            {
              name: 'offset',
              options: {
                offset: [0, 10],
              },
            }
          ]
        }}
        customInput={
          <CustomDatePickerInput placeholder={placeholder} />
        }
      />
    );
  } else {
    // For React Native, use a simple TouchableOpacity that could open a native date picker
    return (
      <TouchableOpacity onPress={() => onChange(new Date())} style={styles.input}>
        <Text style={selected ? styles.selectedExerciseText : styles.placeholderText}>
          {selected ? selected.toLocaleDateString() : placeholder}
        </Text>
      </TouchableOpacity>
    );
  }
};

const ProfilePage = () => {
  const navigation = useNavigation();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Add this line here
  const screenWidth = Dimensions.get('window').width;

  // State variables for user data
  const [userData, setUserData] = useState({
    activities: {},
    current_weight: [{ weight: "0", height: 0, date: new Date().toISOString() }],
    starting_weight: [{ weight: "0", height: 0, date: new Date().toISOString() }],
    goal_weight: ""
  });
  
  // User's personal information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');

  // State for the weight/height update modal
  const [modalVisible, setModalVisible] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Alert state for web version
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  // State for goal setting modal
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalType, setGoalType] = useState('weight');
  const [achieveByDate, setAchieveByDate] = useState(new Date());  // New state for Date object
  const [achieveBy, setAchieveBy] = useState('');  // Keep this for YYYY-MM-DD string format
  const [targetWeight, setTargetWeight] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const [targetExercise, setTargetExercise] = useState('');
  const [targetExerciseName, setTargetExerciseName] = useState('');
  const [displayDate, setDisplayDate] = useState(''); // MM-DD-YYYY format for display
  
  // New: State for exercise picker modal
  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);

  // Add these state variables in the ProfilePage component
  const [progressPrediction, setProgressPrediction] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    // Fetch user profile data when component mounts
    fetchProfileData();
    fetchPrediction();
    fetchWeightChart();
    
    // Set default achieve by date to 3 months from now
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    setAchieveByDate(threeMonthsFromNow);
    setAchieveBy(formatDateToYYYYMMDD(threeMonthsFromNow));
    setDisplayDate(formatDateToMMDDYYYY(threeMonthsFromNow));
    
    // Add clean-up for any event listeners or styles added to the document
    return () => {
      if (typeof document !== 'undefined') {
        const datepickerStyles = document.getElementById('datepicker-styles');
        if (datepickerStyles) {
          datepickerStyles.remove();
        }
      }
    };
  }, []);

  // Format date object to YYYY-MM-DD string
  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date to MM-DD-YYYY for display
  const formatDateToMMDDYYYY = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  // Handle date change from calendar picker
  const handleDateChange = (date) => {
    setAchieveByDate(date);
    setAchieveBy(formatDateToYYYYMMDD(date));
    setDisplayDate(formatDateToMMDDYYYY(date));
  };

  // Handle exercise selection from ChooseExercise component
  const handleExerciseSelect = (exercise) => {
    setTargetExercise(exercise.id.toString());
    setTargetExerciseName(exercise.name);
    setExercisePickerVisible(false);
  };

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);

      // Check network connectivity
      const connected = await isNetworkAvailable();
      if (!connected) {
        showAlert('No internet connection. Please try again when you\'re online.', 'error');
        setIsLoading(false);
        return;
      }

      // Get auth token for API request
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        showAlert('Authentication required. Please login again.', 'error');
        setIsLoading(false);
        return;
      }

      // Get proper headers with base64 encoded token
      const headers = await getAuthHeaders(token);

      // Make the API request
      const response = await fetch('http://localhost:8080/api/user/get_user_page', {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching profile:', errorText);
        showAlert('Failed to load profile data. Please try again later.', 'error');
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Update state with fetched data
      setUserData(data.data);
      
      // Set user's personal information from the response
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setUsername(data.username || '');

      // Set form values for the modal
      const currentWeight = data.data.current_weight[data.data.current_weight.length - 1] || {};
      setHeight(currentWeight.height?.toString() || "");
      setWeight(currentWeight.weight?.toString() || "");
      setGoalWeight(data.data.goal_weight?.toString() || "");

    } catch (error) {
      console.error('Error in fetchProfileData:', error);
      showAlert('An error occurred while loading your profile. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateWeightHeight = async () => {
    try {
      setIsLoading(true);

      // Validate inputs - require at least one of height or weight
      if ((!weight || weight.trim() === '') && (!height || height.trim() === '')) {
        showAlert('Please enter either weight or height or both.', 'warning');
        setIsLoading(false);
        return;
      }

      if (weight && (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0)) {
        showAlert('Please enter a valid weight (positive number).', 'warning');
        setIsLoading(false);
        return;
      }

      if (height && (isNaN(parseInt(height)) || parseInt(height) <= 0)) {
        showAlert('Please enter a valid height in inches (positive number).', 'warning');
        setIsLoading(false);
        return;
      }

      // Check network connectivity
      const connected = await isNetworkAvailable();
      if (!connected) {
        showAlert('No internet connection. Please try again when you\'re online.', 'error');
        setIsLoading(false);
        return;
      }

      // Prepare payload - only include fields that have values
      const updateData = {};
      
      if (height && height.trim() !== '') {
        updateData.height = parseInt(height);
      }
      
      if (weight && weight.trim() !== '') {
        updateData.weight = parseFloat(weight);
      }
      
      if (goalWeight && goalWeight.trim() !== '') {
        updateData.goal_weight = parseFloat(goalWeight);
      }

      // Get auth token for JWT signing
      const secret = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (!secret) {
        showAlert('Authentication required. Please login again.', 'error');
        setIsLoading(false);
        return;
      }

      // Get proper headers with base64 encoded token
      const headers = await getAuthHeaders(secret);

      // Encode the payload as JWT
      const token = encode(updateData, secret);

      // Submit the update request
      const response = await fetch('http://localhost:8080/api/user/update_weight', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating weight/height:', errorText);
        showAlert('Failed to update profile. Please try again later.', 'error');
        setIsLoading(false);
        return;
      }

      // Show success message
      showAlert('Profile updated successfully!', 'success');

      // Close the modal
      setModalVisible(false);

      // Refresh the profile data
      fetchProfileData();

    } catch (error) {
      console.error('Error in updateWeightHeight:', error);
      showAlert('An error occurred while updating your profile. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new goal
  const createGoal = async () => {
    try {
      setIsLoading(true);

      // Validate inputs based on goal type
      if (goalType === 'weight') {
        if (!targetWeight || isNaN(parseFloat(targetWeight)) || parseFloat(targetWeight) <= 0) {
          showAlert('Please enter a valid target weight.', 'warning');
          setIsLoading(false);
          return;
        }
      } else if (goalType === 'strength') {
        if (!targetWeight || isNaN(parseFloat(targetWeight)) || parseFloat(targetWeight) <= 0) {
          showAlert('Please enter a valid target weight.', 'warning');
          setIsLoading(false);
          return;
        }
        if (!targetReps || isNaN(parseInt(targetReps)) || parseInt(targetReps) <= 0) {
          showAlert('Please enter a valid target number of reps.', 'warning');
          setIsLoading(false);
          return;
        }
        if (!targetExercise) {
          showAlert('Please select an exercise.', 'warning');
          setIsLoading(false);
          return;
        }
      }
      
      if (!achieveBy) {
        showAlert('Please select a target date.', 'warning');
        setIsLoading(false);
        return;
      }
      
      // Validate achieve by date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of day for fair comparison
      
      if (achieveByDate < today) {
        showAlert('Target date must be in the future.', 'warning');
        setIsLoading(false);
        return;
      }

      // Check network connectivity
      const connected = await isNetworkAvailable();
      if (!connected) {
        showAlert('No internet connection. Please try again when you\'re online.', 'error');
        setIsLoading(false);
        return;
      }

      // Prepare payload based on goal type
      let goalData = {
        goal_type: goalType,
        achieve_by: formatDateToYYYYMMDD(achieveByDate),
      };

      if (goalType === 'weight') {
        goalData.target_weight = parseFloat(targetWeight);
      } else if (goalType === 'strength') {
        goalData.target_weight = parseFloat(targetWeight);
        goalData.target_reps = parseInt(targetReps);
        goalData.target_exercise = parseInt(targetExercise);
      }

      console.log("Goal data being sent:", goalData);

      // Get auth token for JWT signing
      const secret = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (!secret) {
        showAlert('Authentication required. Please login again.', 'error');
        setIsLoading(false);
        return;
      }

      // Get proper headers with base64 encoded token
      const headers = await getAuthHeaders(secret);

      // Encode the payload as JWT
      const token = encode(goalData, secret);

      // Submit the goal creation request
      const response = await fetch('http://localhost:8080/api/user/create_goal', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creating goal:', errorText);
        showAlert('Failed to create goal. Please try again later.', 'error');
        setIsLoading(false);
        return;
      }

      // Show success message
      showAlert('Goal created successfully!', 'success');

      // Close the modal
      setGoalModalVisible(false);

      // Reset form fields
      setTargetWeight('');
      setTargetReps('');
      setTargetExercise('');
      setTargetExerciseName('');

      // Refresh the profile data
      fetchProfileData();

    } catch (error) {
      console.error('Error creating goal:', error);
      showAlert('An error occurred while creating your goal. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to show alerts (works for both React Native and web)
  const showAlert = (message, severity = 'info') => {
    // Check if we're running on web or native platform
    const isWeb = typeof document !== 'undefined';
    
    if (isWeb) {
      setAlertMessage(message);
      setAlertSeverity(severity);
      setAlertOpen(true);
    } else {
      // React Native Alert
      Alert.alert(
        severity === 'error' ? 'Error' :
        severity === 'warning' ? 'Warning' : 'Success',
        message,
        [{ text: 'OK' }]
      );
    }
  };

  // Helper functions to get latest stats
  const getCurrentWeight = () => {
    if (userData.current_weight && userData.current_weight.length > 0) {
      return parseFloat(userData.current_weight[userData.current_weight.length - 1].weight).toFixed(1);
    }
    return "N/A";
  };

  const getStartingWeight = () => {
    if (userData.starting_weight && userData.starting_weight.length > 0) {
      return parseFloat(userData.starting_weight[0].weight).toFixed(1);
    }
    return "N/A";
  };

  const getGoalWeight = () => {
    if (userData.goal_weight) {
      return parseFloat(userData.goal_weight).toFixed(1);
    }
    return "N/A";
  };

  const getCurrentHeight = () => {
    if (userData.current_weight && userData.current_weight.length > 0) {
      const heightInches = userData.current_weight[userData.current_weight.length - 1].height;
      const feet = Math.floor(heightInches / 12);
      const inches = heightInches % 12;
      return `${feet}'${inches}"`;
    }
    return "N/A";
  };

  // Get last 10 workouts from activities
  const getLastTenWorkouts = () => {
    const activities = Object.entries(userData.activities || {}).map(([name, data]) => ({
      name,
      ...data,
      dateObj: data["Date Performed"] ? new Date(data["Date Performed"]) : new Date(0)
    }));

    // Sort by date, most recent first
    activities.sort((a, b) => b.dateObj - a.dateObj);

    // Return only the first 10
    return activities.slice(0, 10);
  };

  // Prepare chart data
  const prepareChartData = () => {
    // Create weight history from starting and current weights
    const allWeights = [
      ...userData.starting_weight.map(w => ({
        date: new Date(w.date),
        weight: parseFloat(w.weight)
      })),
      ...userData.current_weight.map(w => ({
        date: new Date(w.date),
        weight: parseFloat(w.weight)
      }))
    ];

    // Sort by date
    allWeights.sort((a, b) => a.date - b.date);

    // Add goal weight as the last point if it exists
    if (userData.goal_weight) {
      const lastDate = allWeights.length > 0
        ? allWeights[allWeights.length - 1].date
        : new Date();

      // Set goal weight date 3 months in the future from latest entry
      const goalDate = new Date(lastDate);
      goalDate.setMonth(goalDate.getMonth() + 3);

      allWeights.push({
        date: goalDate,
        weight: parseFloat(userData.goal_weight),
        isGoal: true
      });
    }

    // Format for the chart
    return {
      labels: allWeights.map(w => {
        const date = new Date(w.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: allWeights.map(w => w.weight),
          color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Weight Progress"]
    };
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Clear the auth token from secure storage
      await secureStorage.removeItem(AUTH_TOKEN_KEY);
      
      showAlert('Logged out successfully!', 'success');
      
      // Close the dialog
      setLogoutDialogOpen(false);
      
      // Navigate to login page after a short delay
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 1500);
    } catch (error) {
      console.error('Error during logout:', error);
      showAlert('Error logging out. Please try again.', 'error');
      setIsLoading(false);
    }
  };

  // Inside your Goal Setting Modal, replace the existing calendar picker with:
  const renderCalendarField = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Target Date</Text>
      <CalendarPicker
        selected={achieveByDate}
        onChange={handleDateChange}
        placeholder="MM/DD/YYYY"
      />
    </View>
  );

  // Add these functions in the ProfilePage component
  const fetchPrediction = async () => {
    try {
      // Check network connectivity
      const connected = await isNetworkAvailable();
      if (!connected) {
        showAlert('No internet connection. Please try again when online.', 'error');
        return;
      }

      // Get auth token
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        showAlert('Authentication required. Please login again.', 'error');
        return;
      }

      const headers = await getAuthHeaders(token);
      
      const res = await fetch('http://localhost:5000/api/ai/progress-prediction', {
        method: 'GET',
        headers: headers
      });
      
      const data = await res.json();
      setProgressPrediction(data.prediction ?? null);
    } catch (err) {
      console.error("Failed to fetch prediction:", err);
    }
  };

  const fetchWeightChart = async () => {
    try {
      // Check network connectivity
      const connected = await isNetworkAvailable();
      if (!connected) {
        showAlert('No internet connection. Please try again when online.', 'error');
        return;
      }

      // Get auth token
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        showAlert('Authentication required. Please login again.', 'error');
        return;
      }

      const headers = await getAuthHeaders(token);
      
      const res = await fetch('http://localhost:5000/api/ai/weight-chart', {
        method: 'GET',
        headers: headers
      });
      
      const data = await res.json();

      if (data.error || !data.datasets) {
        console.warn("Chart data not available:", data.error);
        return;
      }

      // Process the data to create confidence intervals
      const processedData = {
        ...data,
        datasets: [
          // Actual data
          data.datasets[0],
          // Predicted data
          data.datasets[1],
          // Lower confidence bound (2lbs below prediction)
          {
            data: data.datasets[1].data.map(val => val !== null ? Math.max(val - 2, 0) : null),
            color: (opacity = 1) => `rgba(243, 156, 18, ${opacity * 0.2})`,
            strokeWidth: 0,
          },
          // Upper confidence bound (2lbs above prediction)
          {
            data: data.datasets[1].data.map(val => val !== null ? val + 2 : null),
            color: (opacity = 1) => `rgba(243, 156, 18, ${opacity * 0.2})`,
            strokeWidth: 0,
          }
        ],
        legend: ["Actual", "Predicted", "Lower Bound", "Upper Bound"]
      };

      setChartData(processedData);

      // Update streak count if included in response
      if (data.streakCount !== undefined) {
        setStreakCount(data.streakCount);
      }
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
    }
  };

  // Helper function to determine where prediction starts
  const getPredictionStartIndex = () => {
    if (!chartData || !chartData.datasets || chartData.datasets.length < 2) return -1;
    
    const actualData = chartData.datasets[0].data;
    for (let i = 0; i < actualData.length; i++) {
      if (actualData[i] === null) return i;
    }
    return actualData.length;
  };

  // Replace the existing renderWeightChart or prepareChartData function with this:
  const renderWeightChart = () => {
    // Fallback to basic chart if predictive data isn't available
    if (!chartData) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Weight Progress</Text>
          {userData.starting_weight.length > 0 ? (
            <LineChart
              data={prepareChartData()} // Your original chart data function
              width={Dimensions.get('window').width - 40}
              height={220}
              yAxisSuffix=" lbs"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#ffa726'
                },
                // Skip dots for null data points
                hidePointsAtIndex: prepareChartData().datasets[0].data
                  .map((value, index) => value === null || value === undefined ? index : -1)
                  .filter(index => index !== -1)
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.noDataChart}>
              <Text style={styles.noDataText}>No weight data available</Text>
            </View>
          )}
        </View>
      );
    }

    const predictionStartIdx = getPredictionStartIndex();
    const hasPrediction = predictionStartIdx >= 0 && predictionStartIdx < chartData.labels.length;

    // Find indexes where data is missing (null or undefined)
    const actualNullIndexes = chartData.datasets[0].data
      .map((value, index) => value === null || value === undefined ? index : -1)
      .filter(index => index !== -1);
    
    const predictedNullIndexes = chartData.datasets[1].data
      .map((value, index) => value === null || value === undefined ? index : -1)
      .filter(index => index !== -1);

    // Create a merged dataset that combines actual and predicted data into one continuous line
    const continuousData = [];
    for (let i = 0; i < chartData.labels.length; i++) {
      if (i < predictionStartIdx) {
        // Use actual data for the first part
        continuousData.push(chartData.datasets[0].data[i]);
      } else {
        // Use predicted data for the rest
        continuousData.push(chartData.datasets[1].data[i]);
      }
    }

    const goalWeight = userData.goal_weight ? parseFloat(userData.goal_weight) : null;
    
    // Calculate custom y-axis range with padding below the goal
    let customYAxisRange = null;
    if (chartData && chartData.yAxisRange) {
      customYAxisRange = [...chartData.yAxisRange];

      if (goalWeight) {
        const rangeSize = customYAxisRange[1] - customYAxisRange[0];
        const effectiveRangeSize = Math.max(rangeSize, 20);
        const minPadding = Math.max(effectiveRangeSize * 0.15, 5); // 15% or at least 5 lbs

        // Always set the min to be BELOW the goal weight, even if data is lower
        customYAxisRange[0] = goalWeight - minPadding;

        // Optionally, add a bit of space above the highest point or goal
        customYAxisRange[1] = Math.max(
          customYAxisRange[1],
          goalWeight + effectiveRangeSize * 0.1
        );
      }
    }
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.graphTitle}>📊 Weight Progress</Text>
        
        <LineChart
          data={{
            labels: chartData.labels,
            datasets: [
              {
                data: continuousData,
                // This color function changes based on index position
                color: (opacity = 1, index) => {
                  if (index < predictionStartIdx) {
                    return `rgba(30, 82, 180, ${opacity})`; // Blue for actual data
                  } else {
                    return `rgba(243, 156, 18, ${opacity})`; // Orange for predicted data
                  }
                },
                strokeWidth: 4,
                withDots: true,
              },
              // Add a horizontal line for the goal weight if it exists
              ...(goalWeight ? [{
                data: Array(chartData.labels.length).fill(goalWeight),
                color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`, // Green line for goal
                strokeWidth: 2,
                strokeDashArray: [5, 5], // Dashed line
                withDots: false,
              }] : [])
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
              // This changes dot colors based on the index
              color: (index) => index < predictionStartIdx 
                ? "#3259A5" // Blue for actual data
                : "#f39c12", // Orange for predicted data
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
            },
            // Hide dots for null/undefined values
            hidePointsAtIndex: [...actualNullIndexes, ...predictedNullIndexes],
            useShadowColorFromDataset: false,
          }}
          
          style={{ 
            marginVertical: 10, 
            borderRadius: 16,
            paddingRight: 60,
          }}
          segments={5}
          formatYLabel={(y) => `${y} lbs`}
          verticalLabelRotation={0}
          withShadow={true}
          withVerticalLines={true}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          // Use our custom range with padding instead of the original rang
          min={customYAxisRange?.[0] || chartData.yAxisRange?.[0]}
          max={customYAxisRange?.[1] || chartData.yAxisRange?.[1]}
          // This is important for applying the color function properly
          getDotColor={(dataPoint, dataPointIndex) => 
            dataPointIndex < predictionStartIdx ? "#3259A5" : "#f39c12"
          }
        />

        {/* Updated legend to include goal line */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3259A5' }]} />
            <Text style={styles.legendText}>Actual Weight</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f39c12' }]} />
            <Text style={styles.legendText}>Predicted Weight</Text>
          </View>
          {goalWeight && (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { 
                backgroundColor: '#2ecc71',
                height: 2,
                width: 15,
                borderRadius: 0,
                marginTop: 5
              }]} />
              <Text style={styles.legendText}>Goal Weight</Text>
            </View>
          )}
        </View>

        {/* Calculate and show goal achievement date if possible */}
        {goalWeight && hasPrediction && (
          <View style={styles.goalAchievementContainer}>
            {findGoalAchievementDate(continuousData, chartData.labels, goalWeight, predictionStartIdx)}
          </View>
        )}

        {/* Rest of your component remains the same */}
        {streakCount > 0 && (
          <View style={styles.streakBox}>
            <Text style={styles.streakText}>🔥 {streakCount}-day streak</Text>
          </View>
        )}

        {hasPrediction && progressPrediction && (
          <View style={styles.predictionInfo}>
            <Text style={styles.progressTitle}>📈 Your Progress Forecast</Text>
            <Text style={styles.predictionInfoText}>
              {progressPrediction.message || "Based on your current progress, here's your predicted weight trend."}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Add this new function to calculate when the user will reach their goal
  const findGoalAchievementDate = (weightData, labels, goalWeight, startPredictionIdx) => {
    // Don't check if already at goal
    if (weightData[startPredictionIdx - 1] <= goalWeight) {
      return (
        <Text style={styles.goalAchievementText}>
          <Text style={styles.goalEmphasis}>🏆 Congratulations!</Text> You've already reached your goal weight!
        </Text>
      );
    }
    
    // Look through predicted data points to find when weight drops below goal
    for (let i = startPredictionIdx; i < weightData.length; i++) {
      if (weightData[i] <= goalWeight) {
        return (
          <Text style={styles.goalAchievementText}>
            <Text style={styles.goalEmphasis}>🎯 Goal achievement:</Text> You're predicted to reach your goal weight by{' '}
            <Text style={styles.goalEmphasis}>{labels[i]}</Text>!
          </Text>
        );
      }
    }
    
    // Goal won't be reached in the visible prediction window
    return (
      <Text style={styles.goalAchievementText}>
        <Text style={styles.goalEmphasis}>📝 Goal tracking:</Text> Your goal weight is not predicted to be reached within the current forecast period.
      </Text>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Web-based alert - replaced Platform.OS check with direct web detection */}
      {typeof document !== 'undefined' && alertOpen && (
        <div
          style={{
            display: 'flex',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              padding: 16,
              backgroundColor: alertSeverity === 'error' ? '#f44336' :
                alertSeverity === 'warning' ? '#ff9800' : '#4caf50',
              color: 'white',
              borderRadius: 8,
              maxWidth: 400,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>{alertMessage}</div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: 18,
                  cursor: 'pointer'
                }}
                onClick={() => setAlertOpen(false)}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation dialog */}
      {typeof document !== 'undefined' && logoutDialogOpen && (
        <div
          style={{
            display: 'flex',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              padding: 24,
              backgroundColor: 'white',
              borderRadius: 8,
              maxWidth: 400,
              width: '90%',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Confirm Logout</h3>
            <p style={{ margin: '0 0 24px 0', color: '#666' }}>
              Are you sure you want to log out of your account?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                style={{
                  background: '#eee',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 16px',
                  marginRight: 8,
                  cursor: 'pointer',
                  color: '#333',
                  fontWeight: 'bold'
                }}
                onClick={() => setLogoutDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                style={{
                  background: '#f44336',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout button in top right corner */}
      <View style={styles.logoutButtonContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setLogoutDialogOpen(true)}
          disabled={isLoading}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Header Section */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://picsum.photos/id/73/400' }}
          style={styles.profilePicture}
        />
        <Text style={styles.name}>
          {firstName && lastName ? `${firstName} ${lastName}` : 'Anonymous User'}
        </Text>
        {username && (
          <Text style={styles.username}>@{username}</Text>
        )}
        <Text style={styles.bio}>
          Fitness enthusiast and weight lifting journeyman
        </Text>
      </View>

      {/* Weight Progress Chart */}
      {renderWeightChart()}

      {/* Weight Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Starting Weight</Text>
          <Text style={styles.statsValue}>{getStartingWeight()} lbs</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Current Weight</Text>
          <Text style={styles.statsValue}>{getCurrentWeight()} lbs</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Goal Weight</Text>
          <Text style={styles.statsValue}>{getGoalWeight()} lbs</Text>
        </View>
      </View>

      <View style={styles.heightContainer}>
        <Text style={styles.heightLabel}>Current Height:</Text>
        <Text style={styles.heightValue}>{getCurrentHeight()}</Text>
      </View>

      {/* Update the stepsContainer section to use the new data structure */}

      <View style={styles.stepsContainer}>
        <View style={styles.stepsInfoContainer}>
          <Text style={styles.stepsTitle}>Daily Steps</Text>
          <View style={styles.stepsData}>
            <Text style={styles.stepsCount}>
              {userData.steps?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.stepsUnit}>steps today</Text>
          </View>
          <View style={styles.stepsProgressContainer}>
            <View style={styles.stepsProgress}>
              <View 
                style={[
                  styles.stepsProgressFill, 
                  { 
                    width: `${Math.min(100, ((userData.steps || 0) / (userData.step_goal || 10000)) * 100)}%` 
                  }
                ]}
              />
            </View>
            <Text style={styles.stepsGoal}>
              Goal: {userData.step_goal?.toLocaleString() || '10,000'} steps
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.viewStepsButton}
          onPress={() => navigation.navigate('Steps')}
        >
          <Text style={styles.viewStepsText}>View Steps</Text>
        </TouchableOpacity>
      </View>

      {/* Button Group */}
      <View style={styles.buttonGroup}>
        {/* Update Weight/Height Button */}
        <TouchableOpacity
          style={[styles.button, styles.updateButton]}
          onPress={() => setModalVisible(true)}
          disabled={isLoading}
        >
          <Text style={styles.updateButtonText}>Update Weight & Height</Text>
        </TouchableOpacity>
        
        {/* NEW: Set Goal Button */}
        <TouchableOpacity
          style={[styles.button, styles.goalButton]}
          onPress={() => setGoalModalVisible(true)}
          disabled={isLoading}
        >
          <Text style={styles.goalButtonText}>Set New Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Workouts Section */}
      <View style={styles.workoutsContainer}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>

        {getLastTenWorkouts().length > 0 ? (
          getLastTenWorkouts().map((workout, index) => (
            <View key={index} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutDate}>
                  {workout["Date Performed"] ? new Date(workout["Date Performed"]).toLocaleDateString() : 'No date'}
                </Text>
              </View>

              <View style={styles.workoutStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Sets</Text>
                  <Text style={styles.statValue}>{workout["Total Sets"]}</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Weight Lifted</Text>
                  <Text style={styles.statValue}>
                    {parseFloat(workout["Total Weight Lifted"]).toLocaleString()} lbs
                  </Text>
                </View>
              </View>

              <View style={styles.muscleGroupsContainer}>
                <Text style={styles.muscleGroupsLabel}>Muscle Groups:</Text>
                <View style={styles.muscleGroups}>
                  {workout["Muscle Groups"] && workout["Muscle Groups"].length > 0 ? (
                    workout["Muscle Groups"].map((muscle, i) => (
                      <View key={i} style={styles.muscleTag}>
                        <Text style={styles.muscleTagText}>
                          {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noMusclesText}>No muscle groups specified</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noWorkoutsContainer}>
            <Text style={styles.noWorkoutsText}>No workouts found</Text>
          </View>
        )}
      </View>

      {/* Weight/Height Update Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Weight & Height</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height (inches)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="Enter height in inches"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Enter weight in pounds"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={goalWeight}
                onChangeText={setGoalWeight}
                keyboardType="numeric"
                placeholder="Enter your goal weight (optional)"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={updateWeightHeight}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NEW: Goal Setting Modal */}
      <Modal
        visible={goalModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set New Fitness Goal</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={goalType}
                  onValueChange={(value) => setGoalType(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Weight Goal" value="weight" />
                  <Picker.Item label="Strength Goal" value="strength" />
                </Picker>
              </View>
            </View>
            
            {/* Replace the old calendar input with our new component */}
            {renderCalendarField()}
            
            {/* Rest of your goal form fields */}
            {goalType === 'weight' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Weight (lbs)</Text>
                <TextInput
                  style={styles.input}
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="numeric"
                  placeholder="Enter target weight"
                />
              </View>
            )}
            
            {goalType === 'strength' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Target Weight (lbs)</Text>
                  <TextInput
                    style={styles.input}
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    keyboardType="numeric"
                    placeholder="Enter target weight"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Target Reps</Text>
                  <TextInput
                    style={styles.input}
                    value={targetReps}
                    onChangeText={setTargetReps}
                    keyboardType="numeric"
                    placeholder="Enter target repetitions"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Exercise</Text>
                  <TouchableOpacity 
                    style={styles.exerciseSelector} 
                    onPress={() => setExercisePickerVisible(true)}
                  >
                    <Text style={targetExercise ? styles.selectedExerciseText : styles.placeholderText}>
                      {targetExerciseName || "Tap to select an exercise"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setGoalModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={createGoal}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? "Creating..." : "Create Goal"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exercise Picker Modal */}
      <Modal
        visible={exercisePickerVisible}
        animationType="slide"
        onRequestClose={() => setExercisePickerVisible(false)}
      >
        <View style={styles.exercisePickerContainer}>
          <View style={styles.exercisePickerHeader}>
            <Text style={styles.exercisePickerTitle}>Select Exercise</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setExercisePickerVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ChooseExercise onExerciseSelect={handleExerciseSelect} />
        </View>
      </Modal>
    </ScrollView>
  );
};

// Add calendar-specific styles
const styles = StyleSheet.create({
  // Update these specific styles
  calendarContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000, // High z-index
  },
  
  // The rest of your styles remain unchanged
  // ...
  container: {
    padding: 20,
    paddingBottom: 40,
    position: 'relative',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
    maxWidth: '80%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  heightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  heightLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  heightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // NEW: Button group
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  updateButton: {
    backgroundColor: '#4a69bd',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  goalButton: {
    backgroundColor: '#38a169',
  },
  goalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  allActivitiesButton: {
    backgroundColor: '#1e272e',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 5,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4a69bd',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chartContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
  },
  noDataText: {
    color: '#888',
    fontSize: 16,
  },
  workoutsContainer: {
    marginBottom: 30,
  },
  workoutCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
  },
  workoutStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  muscleGroupsContainer: {
    marginTop: 5,
  },
  muscleGroupsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleTag: {
    backgroundColor: '#f0f4f8',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  muscleTagText: {
    fontSize: 12,
    color: '#4a69bd',
  },
  noMusclesText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  noWorkoutsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
  },
  noWorkoutsText: {
    color: '#666',
    fontSize: 16,
  },
  // New styles for exercise picker
  exercisePickerContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  exercisePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4a69bd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  exercisePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  exerciseSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  selectedExerciseText: {
    color: '#333',
    fontSize: 16,
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 16,
  },
  stepsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepsInfoContainer: {
    marginBottom: 15,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  stepsData: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stepsCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a69bd',
    marginRight: 5,
  },
  stepsUnit: {
    fontSize: 16,
    color: '#666',
  },
  stepsProgressContainer: {
    marginTop: 10,
  },
  stepsProgress: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  stepsProgressFill: {
    height: '100%',
    backgroundColor: '#4a69bd',
  },
  stepsGoal: {
    fontSize: 14,
    color: '#666',
  },
  viewStepsButton: {
    backgroundColor: '#4a69bd',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewStepsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  streakBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f39c12',
    borderRadius: 8,
    alignItems: 'center',
  },
  streakText: {
    color: 'white',
    fontWeight: 'bold',
  },
  predictionInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  predictionInfoText: {
    fontSize: 14,
    color: '#666',
  },
  goalAchievementContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    alignItems: 'center',
  },
  goalAchievementText: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  goalEmphasis: {
    fontWeight: 'bold',
    color: '#2ecc71',
  },
});

// Add this global style for the calendar
if (typeof document !== 'undefined') {
  // This will only run in web environments
  const style = document.createElement('style');
  style.textContent = `
    /* Critical: Make calendar appear on top of everything */
    .react-datepicker-popper {
      z-index: 9999 !important;
      position: fixed !important;
    }
    
    /* Calendar styling */
    .react-datepicker {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0;
    }
    
    .react-datepicker__header {
      background-color: #4a69bd;
      border-bottom: none;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      padding-top: 10px;
    }
    
    .react-datepicker__current-month {
      color: white;
      font-weight: bold;
      font-size: 1rem;
    }
    
    .react-datepicker__day-name {
      color: white;
      margin-top: 5px;
    }
    
    .react-datepicker__day--selected {
      background-color: #4a69bd;
      border-radius: 50%;
    }
    
    .react-datepicker__day--keyboard-selected {
      background-color: rgba(74, 105, 189, 0.7);
      border-radius: 50%;
    }
    
    .react-datepicker__day:hover {
      background-color: #e6eeff;
      border-radius: 50%;
    }
    
    /* Make sure the calendar container is properly positioned */
    .react-datepicker-wrapper {
      display: block;
      width: 100%;
    }
  `;
  document.head.appendChild(style);
}

export default ProfilePage;
