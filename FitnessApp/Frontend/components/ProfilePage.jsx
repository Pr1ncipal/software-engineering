import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import WorkoutForm from '@/components/WorkoutForm';
import AllActivities from '@/components/AllActivities'; 

const ProfilePage = () => {
  const navigation = useNavigation();

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8081/app/user_data')
      .then(response => response.json())
      .then(data => {
        setUserData(data);
      })
      .catch(error => {
        console.error("Error fetching user data", error);
      });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={{ uri: 'https://picsum.photos/id/73/400' }}
        style={styles.profilePicture}
      />
      <Text style={styles.name}>John Doe</Text>
      <Text style={styles.bio}>This is the bio, user can write whatever here.</Text>

      <View style={styles.row}>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Starting Weight</Text>
          <Text style={styles.input}>220 lbs.</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Current Weight</Text>
          <Text style={styles.input}>196.7 lbs.</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Goal Weight</Text>
          <Text style={styles.input}>180 lbs.</Text>
        </View>
      </View>

      <Image
        source={{
          uri: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn1.iconfinder.com%2Fdata%2Ficons%2Fbusiness-graph-and-chart-1%2F128%2Fdecrease_decreasing_graph_bars_stats-512.png&f=1&nofb=1',
        }}
        style={styles.graph}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => navigation.navigate('AllActivities')}
        >
          <Text style={styles.buttonText}>All Activities</Text>
        </TouchableOpacity>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
  },
  box: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    fontSize: 20,
    marginBottom: 10,
    paddingLeft: 8,
  },
  graph: {
    width: 640,
    height: 480,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#000',
    paddingVertical: 20,
    paddingHorizontal: 200,
    borderRadius: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfilePage; 
