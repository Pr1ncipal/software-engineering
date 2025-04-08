import React from 'react';
import { SafeAreaView, FlatList, Text, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import WorkoutForm from '@/components/WorkoutForm';  // Import WorkoutForm
import { Link } from 'expo-router';

const leaderboardData = [
    { id: '1', photo: 'https://cdn-icons-png.flaticon.com/128/1950/1950591.png', name: 'Run',
        stat1Name: 'Distance (mi)', stat1: '3.67',
        stat2Name: 'Calories Burned', stat2: '486',
        stat3Name: 'Time (min)', stat3: '23:45'
    },
    { id: '2', photo: 'https://cdn-icons-png.flaticon.com/128/55/55259.png', name: 'Lift',
        stat1Name: 'Total Weight Moved (lbs)', stat1: '34,172',
        stat2Name: 'Number of Sets', stat2: '52',
        stat3Name: 'Muscles Hit', stat3: 'Chest, Shoulders, Triceps'
    },
    { id: '3', photo: 'https://cdn-icons-png.flaticon.com/128/1950/1950591.png', name: 'Run',
        stat1Name: 'Distance (mi)', stat1: '2.29',
        stat2Name: 'Calories Burned', stat2: '325',
        stat3Name: 'Time (min)', stat3: '13:49'
    },
    { id: '4', photo: 'https://cdn-icons-png.flaticon.com/128/1950/1950591.png', name: 'Run',
        stat1Name: 'Distance (mi)', stat1: '7.88',
        stat2Name: 'Calories Burned', stat2: '786',
        stat3Name: 'Time (min)', stat3: '56:22'
    },
  ];

export default function family_management() {
    return (
        <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Activity History</Text>
        <FlatList
            data={leaderboardData}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
            // need to add link to individual setting page here <---------------------------------------------------------------------------
                <View style={styles.row}>
                    {/* Activity Icon */}
                        <Image source={{ uri: item.photo }} style={styles.profileImage} />
                    
                    {/* Activity Name and Stats */}
                        {/* Horizontal Boxes */}
                        <View style={styles.row}>
                        {/* First Box */}
                        <View style={styles.box}>
                        <Text style={styles.boxTitle}>{item.stat1Name}</Text>
                        <Text style={styles.input}>{item.stat1}</Text>
                        </View>
                
                        {/* Second Box */}
                        <View style={styles.box}>
                        <Text style={styles.boxTitle}>{item.stat2Name}</Text>
                        <Text style={styles.input}>{item.stat2}</Text>
                        </View>
                
                        {/* Third Box */}
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
}


const styles = StyleSheet.create({
rowContainer: {
    width: '100%',
    padding: 10,
},
container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
},
title: {
    fontSize: 40    ,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    padding: 30
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
nameContainer: {
    flex: 1,  // Allows the name to take up remaining space
    justifyContent: 'center',  // Centers the text vertically
  },
name: {
    fontSize: 28,
    paddingLeft: 10,
    fontWeight: 'bold',
    textAlign: 'left',  // Ensures the name is aligned left within the container
},
minus_sign: {
    fontSize: 28,
    paddingLeft: 10,
    fontWeight: 'bold',
    textAlign: 'right',  // Ensures the name is aligned left within the container
},
profileImage: {
    width: 90,  // Set the width of the profile photo
    height: 90, // Set the height of the profile photo
    borderRadius: 40, // Makes the image round
    marginRight: 10,  // Spacing between image and text
},
buttonContainer: {
    position: 'absolute',
    bottom: 20,  // Position the button at the bottom
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',  // Center the button horizontally
},
removeButton: {
    backgroundColor: '#C7372F',  // Red color for the button
    paddingVertical: 20,  // Smaller vertical padding
    paddingHorizontal: 120,  // Smaller horizontal padding
    borderRadius: 20,
    alignSelf: 'center',  // Centers the button horizontally
},
buttonText: {
    color: 'white',  // Text color
    fontSize: 16,  // Smaller font size
    fontWeight: 'bold',
},
minusButton: {
    width: 50,
    height: 50,
    backgroundColor: '#C7372F',
    borderRadius: 23, // Makes the button circular
    justifyContent: 'center',
    alignItems: 'center',
  },
minusButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
  