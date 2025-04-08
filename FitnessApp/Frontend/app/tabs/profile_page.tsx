import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import WorkoutForm from '@/components/WorkoutForm';  // Import WorkoutForm
import { Link } from 'expo-router';

const profile_pic = 'a'
const fname = 'fname'
const lname = 'lname'
const bio = 'this is bio text'

// Example placeholder chart component
// You can replace this with an actual chart/graph from a library later
const ChartPlaceholder = () => {
  return (
    <View style={styles.chartPlaceholder}>
      <Text style={styles.chartText}>Chart/Graph will go here</Text>
    </View>
  );
};

const ProfilePage = () => {
  // State variables to hold user data
  const [userData, setUserData] = useState(null);

  // Fetch user data when component mounts
  useEffect(() => {
    // Replace with your backend API endpoint
    fetch('http://localhost:8081/app/user_data') // <---------------------- no idea, stuck here
      .then(response => response.json())  // Parse the JSON data
      .then(data => {
        setUserData(data);  // Store fetched data in state
      })
      .catch(error => {
        console.error("Error fetching user data", error);
      });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Picture */}
      <Image
        source={{ uri: 'https://picsum.photos/id/73/400' }}
        style={styles.profilePicture}
      />

      {/* Name */}
      <Text style={styles.name}>John Doe</Text>

      {/* Bio */}
      <Text style={styles.bio}>
        This is the bio, user can write whatever here.
      </Text>
        {/* Horizontal Boxes */}
        <View style={styles.row}>
        {/* First Box */}
        <View style={styles.box}>
        <Text style={styles.boxTitle}>Starting Weight</Text>
        <Text style={styles.input}>220 lbs.</Text>
        </View>

        {/* Second Box */}
        <View style={styles.box}>
        <Text style={styles.boxTitle}>Current Weight</Text>
        <Text style={styles.input}>196.7 lbs.</Text>
        </View>

        {/* Third Box */}
        <View style={styles.box}>
        <Text style={styles.boxTitle}>Goal Weight</Text>
        <Text style={styles.input}>180 lbs.</Text>
        </View>
    </View>

    {/* Profile Picture */}
    <Image
        source={{ uri: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn1.iconfinder.com%2Fdata%2Ficons%2Fbusiness-graph-and-chart-1%2F128%2Fdecrease_decreasing_graph_bars_stats-512.png&f=1&nofb=1&ipt=9b121c68d361afaecd86b51c36d655978b126c0a9431be3cfbeac883b207465c&ipo=images' }}
        style={styles.graph}
    />
    <View style={styles.buttonContainer}>
        <Link href="/tabs/all_activities">
            <TouchableOpacity style={styles.removeButton}>
                <Text style={styles.buttonText}>All Activities</Text>
            </TouchableOpacity>
        </Link>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  chartPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  chartText: {
    fontSize: 18,
    color: '#999',
  },
  row: {
    flexDirection: 'row', // Align items horizontally
    justifyContent: 'space-between', // Add space between boxes
    width: '50%',
  },
  box: {
    flex: 1, // Each box will take equal width
    padding: 10,
    margin: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  input: {
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    marginBottom: 10,
    paddingLeft: 8,
  },
  inputRow: {
    flexDirection: 'row', // Align text inputs horizontally
    justifyContent: 'space-between', // Add space between inputs
  },
  graph: {
    width: 640,
    height: 480,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    position: 'static',
    bottom: 20,  // Position the button at the bottom
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',  // Center the button horizontally
},
removeButton: {
    backgroundColor: '#000',  // Red color for the button
    paddingVertical: 20,  // Smaller vertical padding
    paddingHorizontal: 200,  // Smaller horizontal padding
    borderRadius: 20,
    alignSelf: 'center',  // Centers the button horizontally
},
buttonText: {
    color: 'white',  // Text color
    fontSize: 16,  // Smaller font size
    fontWeight: 'bold',
},
});

export default ProfilePage;
