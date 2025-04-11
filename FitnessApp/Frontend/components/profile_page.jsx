import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { Link } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import encode from 'jwt-encode';
import { secureStorage, AUTH_TOKEN_KEY } from '../utils/secureStorage';
import { isNetworkAvailable, getAuthHeaders } from '../utils/networkUtils';

const ProfilePage = () => {
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

  useEffect(() => {
    // Fetch user profile data when component mounts
    fetchProfileData();
  }, []);

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

      // Validate inputs
      if (!weight || isNaN(parseFloat(weight))) {
        showAlert('Please enter a valid weight.', 'warning');
        setIsLoading(false);
        return;
      }

      if (!height || isNaN(parseInt(height))) {
        showAlert('Please enter a valid height in inches.', 'warning');
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

      // Prepare payload
      const updateData = {
        height: parseInt(height),
        weight: parseFloat(weight),
        goal_weight: goalWeight ? parseFloat(goalWeight) : null
      };

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

      const result = await response.json();

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
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Weight Progress</Text>
        {userData.starting_weight.length > 0 ? (
          <LineChart
            data={prepareChartData()}
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
              }
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

      {/* Update Weight/Height Button */}
      <TouchableOpacity
        style={styles.updateButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.updateButtonText}>Update Weight & Height</Text>
      </TouchableOpacity>

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

      {/* All Activities Button */}
      <View style={styles.buttonContainer}>
        <Link href="/tabs/all_activities">
          <TouchableOpacity style={styles.allActivitiesButton}>
            <Text style={styles.buttonText}>View All Activities</Text>
          </TouchableOpacity>
        </Link>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
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
  bio: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
    maxWidth: '80%',
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
  updateButton: {
    backgroundColor: '#4a69bd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
});

export default ProfilePage;
