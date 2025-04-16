import React from 'react';
import {
  SafeAreaView,
  FlatList,
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
const leaderboardData = [
  {
    id: '1',
    photo: 'https://cdn-icons-png.flaticon.com/128/1950/1950591.png',
    name: 'Run',
    stat1Name: 'Distance (mi)',
    stat1: '3.67',
    stat2Name: 'Calories Burned',
    stat2: '486',
    stat3Name: 'Time (min)',
    stat3: '23:45',
  },
  {
    id: '2',
    photo: 'https://cdn-icons-png.flaticon.com/128/55/55259.png',
    name: 'Lift',
    stat1Name: 'Total Weight Moved (lbs)',
    stat1: '34,172',
    stat2Name: 'Number of Sets',
    stat2: '52',
    stat3Name: 'Muscles Hit',
    stat3: 'Chest, Shoulders, Triceps',
  },
  {
    id: '3',
    photo: 'https://cdn-icons-png.flaticon.com/128/1950/1950591.png',
    name: 'Run',
    stat1Name: 'Distance (mi)',
    stat1: '2.29',
    stat2Name: 'Calories Burned',
    stat2: '325',
    stat3Name: 'Time (min)',
    stat3: '13:49',
  },
  {
    id: '4',
    photo: 'https://cdn-icons-png.flaticon.com/128/1950/1950591.png',
    name: 'Run',
    stat1Name: 'Distance (mi)',
    stat1: '7.88',
    stat2Name: 'Calories Burned',
    stat2: '786',
    stat3Name: 'Time (min)',
    stat3: '56:22',
  },
];

const AllActivities = () => {
  const navigation = useNavigation(); // ✅ initialize navigation

  return (
    <SafeAreaView style={styles.container}>
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Profile</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Activity History</Text>

      <FlatList
        data={leaderboardData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={{ uri: item.photo }} style={styles.profileImage} />
            <View style={styles.row}>
              <View style={styles.box}>
                <Text style={styles.boxTitle}>{item.stat1Name}</Text>
                <Text style={styles.input}>{item.stat1}</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.boxTitle}>{item.stat2Name}</Text>
                <Text style={styles.input}>{item.stat2}</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.boxTitle}>{item.stat3Name}</Text>
                <Text style={styles.input}>{item.stat3}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default AllActivities;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    padding: 30,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#ffffff',
    marginVertical: 5,
    borderRadius: 6,
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
    height: 40,
    fontSize: 20,
    marginBottom: 10,
    paddingLeft: 8,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 0,
    marginRight: 10,
  },
});